/**
 * The sheet camera. One fixed stage, one sheet, one spacer: scroll is a single number t
 * (in viewport-heights), smoothed once, and everything on screen is a pure function of it.
 *
 * Each [data-stop] region owns `data-w` viewport-heights of scroll, then a `travel` leg to
 * the next. Inside a stop the camera holds (with a slow push-in) or, when the region is
 * bigger than the screen at the chosen scale, pans across it. Between stops it travels and
 * pulls back a little, so the reader glimpses the sheet around them.
 *
 * Off (no JS, or reduced motion): the page is a plain reading column. See globals.css.
 */

type Frame = { x: number; y: number; s: number };

type Stop = {
  el: HTMLElement;
  id: string;
  label: string;
  w: number;
  start: number;
  a: Frame;
  b: Frame;
  live: boolean;
  quiet: boolean;
};

const TRAVEL = 0.8;
const LERP = 0.12;

/** Region progress listeners, keyed by region id. Called every frame the camera moves. */
export const listeners = new Map<string, (p: number) => void>();

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (u: number) => u * u * (3 - 2 * u);
const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

export function mountCamera(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;
  const sheet = root.querySelector<HTMLElement>("[data-sheet]")!;
  const spacer = root.querySelector<HTMLElement>("[data-spacer]")!;
  // reduced motion: the camera still travels, gently, with no tilt, peel, pull-back or lean
  const calm = document.documentElement.classList.contains("calm");
  const lerp = calm ? 0.3 : LERP;
  const route = root.querySelector<SVGSVGElement>("[data-route]");
  const map = root.querySelector<HTMLElement>("[data-map]");

  let stops: Stop[] = [];
  let total = 0;
  let vw = 0;
  let vh = 0;
  let t = 0;
  let target = 0;
  let raf = 0;
  let active = -1;

  /** An element's position on the sheet. offsetLeft alone is not enough: the 3D rows
   *  (transform-style) become offsetParents, so sum the chain up to the sheet. */
  function posOf(el: HTMLElement): [number, number] {
    let x = 0;
    let y = 0;
    for (let e: Element | null = el; e && e !== sheet; e = (e as HTMLElement).offsetParent) {
      x += (e as HTMLElement).offsetLeft;
      y += (e as HTMLElement).offsetTop;
    }
    return [x, y];
  }

  function framesFor(el: HTMLElement, phone: boolean): { a: Frame; b: Frame } {
    const padX = phone ? 16 : 64;
    // the phone keeps the map bar along its bottom edge, so it reserves more room there
    const padTop = phone ? 28 : 72;
    const padBottom = phone ? 84 : 72;
    const [rx, ry] = posOf(el);
    const rw = el.offsetWidth;
    const rh = el.offsetHeight;
    // data-cap and data-floor tune the desktop framing; a phone always fits its column at 1:1
    const cap = phone ? 1 : parseFloat(el.dataset.cap ?? "1");
    const fitW = (vw - 2 * padX) / rw;
    const fitH = (vh - padTop - padBottom) / rh;
    const floor = phone ? Math.min(fitW, cap) : parseFloat(el.dataset.floor ?? "0.8");
    const s = Math.min(cap, Math.max(floor, Math.min(fitW, fitH)));
    const viewW = vw / s;
    const viewH = vh / s;

    // a: the frame at the start of the region, b: at its end. Equal when the region fits.
    const axis = (r: number, len: number, view: number, p0: number, p1: number): [number, number] => {
      if (len * s <= view * s - p0 - p1) {
        const c = r + len / 2 + (p1 - p0) / (2 * s);
        return [c, c];
      }
      return [r - p0 / s + view / 2, r + len + p1 / s - view / 2];
    };
    const [ax, bx] = axis(rx, rw, viewW, padX, padX);
    const [ay, by] = axis(ry, rh, viewH, padTop, padBottom);
    return { a: { x: ax, y: ay, s }, b: { x: bx, y: by, s } };
  }

  function layout() {
    vw = innerWidth;
    vh = innerHeight;
    if (!vh) return;
    const phone = vw < 760;
    let c = 0;
    stops = [...sheet.querySelectorAll<HTMLElement>("[data-stop]")].map((el, i, all) => {
      const w = parseFloat(el.dataset.w ?? "1");
      const stop: Stop = {
        el,
        id: el.id,
        label: el.dataset.stop ?? el.id,
        w,
        start: c,
        ...framesFor(el, phone),
        live: el.hasAttribute("data-live"),
        quiet: el.hasAttribute("data-quiet"),
      };
      c += w + (i < all.length - 1 ? TRAVEL : 0);
      return stop;
    });
    total = c;
    // +1 viewport so the last stop is somewhere the reader can come to rest
    spacer.style.height = `${Math.round((total + 1) * vh)}px`;
    // sampling markers for scroll-craft's shoot.mjs: one per stop and one per travel leg,
    // shaped like pinned acts so it samples inside each. Empty, never painted.
    spacer.replaceChildren(
      ...stops.flatMap((s, i) => {
        const legs = [[s.start, s.w]];
        if (i < stops.length - 1) legs.push([s.start + s.w, TRAVEL]);
        return legs.map(([top, w]) => {
          const m = document.createElement("i");
          m.dataset.scAct = "pin";
          m.style.cssText = `position:absolute;left:0;width:1px;top:${top * vh}px;height:${(w + 1) * vh}px`;
          return m;
        });
      })
    );
    drawRoute();
    drawMap();
    target = t = clamp(scrollY / vh, 0, total);
    render(true);
  }

  type At = { f: Frame; near: number[]; i: number; p: number; lift: number; dx: number; dy: number };

  function frameAt(x: number): At {
    const nearness = stops.map(() => 0);
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const end = s.start + s.w;
      if (x <= end || i === stops.length - 1) {
        const p = clamp((x - s.start) / s.w);
        // data-pan="from to": where in the stop the camera crosses an oversized region
        const [pa, pb] = (s.el.dataset.pan ?? "0.08 0.92").split(" ").map(Number);
        const k = smooth(clamp((p - pa) / (pb - pa)));
        // a still that sits perfectly still reads as a placeholder; push in, slowly
        const push = s.quiet ? 1 : 1 + 0.035 * p;
        nearness[i] = 1;
        return {
          f: { x: s.a.x + (s.b.x - s.a.x) * k, y: s.a.y + (s.b.y - s.a.y) * k, s: s.a.s * push },
          near: nearness,
          i,
          p,
          lift: 0,
          dx: 0,
          dy: 0,
        };
      }
      const next = stops[i + 1];
      if (x < next.start) {
        const u = (x - end) / TRAVEL;
        const e = inOut(u);
        const from: Frame = { ...s.b, s: s.b.s * (s.quiet ? 1 : 1.035) };
        const to = next.a;
        const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
        const dist = len * Math.min(from.s, to.s);
        const arc = Math.sin(Math.PI * e);
        const dip = calm ? 0 : clamp(dist / (4 * vw), 0.06, 0.36);
        const sc = from.s * (to.s / from.s) ** e * (1 - dip * arc);
        nearness[i] = 1 - u;
        nearness[i + 1] = u;
        return {
          f: { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: sc },
          near: nearness,
          i: u < 0.5 ? i : i + 1,
          p: u < 0.5 ? 1 : 0,
          lift: arc,
          dx: (to.x - from.x) / len,
          dy: (to.y - from.y) / len,
        };
      }
    }
    return { f: { x: 0, y: 0, s: 1 }, near: nearness, i: 0, p: 0, lift: 0, dx: 0, dy: 0 };
  }

  function render(force = false) {
    const { f, near: nearness, i, lift, dx, dy } = frameAt(t);

    // The sheet is a page in space. Travelling between regions it tips away from the camera
    // in the direction of travel and the plates peel up off the paper; any scroll leans it a
    // little with the hand's speed. At rest every angle is zero, so text renders flat and sharp.
    // Reduced motion keeps the camera and drops all of this.
    const v = calm ? 0 : clamp((target - t) * 28, -1, 1);
    const tilt = calm ? 0 : lift;
    const rx = tilt * 20 * dy + v * 7;
    const ry = -tilt * 16 * dx;
    const rz = tilt * 2.5 * dx;
    const peel = calm ? 0 : Math.max(lift, Math.abs(v) * 0.4);
    // flat at rest: a 3D transform (even at 0deg) keeps the sheet on a 3D layer and Chrome
    // draws its text soft, so when nothing is tilted or lifted, write a plain 2D transform
    const flat = Math.abs(rx) < 0.01 && Math.abs(ry) < 0.01 && Math.abs(rz) < 0.01 && peel < 0.001;
    sheet.classList.toggle("is-flat", flat);
    sheet.style.transform = flat
      ? `translate(${vw / 2 - f.x * f.s}px, ${vh / 2 - f.y * f.s}px) scale(${f.s})`
      : `translate3d(${vw / 2}px, ${vh / 2}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)` +
        ` rotateZ(${rz.toFixed(3)}deg) scale(${f.s}) translate3d(${-f.x}px, ${-f.y}px, 0)`;
    sheet.style.setProperty("--lift", peel.toFixed(3));

    stops.forEach((s, k) => {
      const p = clamp((t - s.start) / s.w);
      s.el.style.setProperty("--p", p.toFixed(4));
      s.el.style.setProperty("--near", nearness[k].toFixed(3));
      listeners.get(s.id)?.(p);
    });

    if (route) {
      const path = route.querySelector<SVGPathElement>("[data-trace]");
      if (path) {
        path.style.strokeDashoffset = String(1 - clamp(t / total));
        // fades in with the first scroll, so the resting title screen has no stray mark
        path.style.opacity = String(Math.min(0.55, (t / total) * 20));
      }
    }

    if (map) {
      const frame = map.querySelector<HTMLElement>("[data-frame]");
      const W = sheet.offsetWidth;
      const H = sheet.offsetHeight;
      if (frame && W && H) {
        const vwS = vw / f.s;
        const vhS = vh / f.s;
        frame.style.left = `${((f.x - vwS / 2) / W) * 100}%`;
        frame.style.top = `${((f.y - vhS / 2) / H) * 100}%`;
        frame.style.width = `${(vwS / W) * 100}%`;
        frame.style.height = `${(vhS / H) * 100}%`;
      }
    }

    if (i !== active || force) {
      active = i;
      stops.forEach((s, k) => s.el.toggleAttribute("data-here", k === i));
      map?.querySelectorAll<HTMLElement>("[data-go]").forEach((b, k) => {
        if (k === i) b.setAttribute("aria-current", "location");
        else b.removeAttribute("aria-current");
      });
      const label = map?.querySelector("[data-label]");
      if (label) label.textContent = stops[i]?.label ?? "";
    }

    // what the verification harness compares between samples: the actual camera,
    // plus the live region's state where scroll drives something other than the camera
    const live = stops[i]?.live ? clamp((t - stops[i].start) / stops[i].w).toFixed(2) : "";
    stage.setAttribute(
      "data-sc-verify-state",
      `${f.x.toFixed(0)},${f.y.toFixed(0)},${f.s.toFixed(3)}|${i}:${live}`
    );
  }

  function drawRoute() {
    if (!route) return;
    route.setAttribute("width", String(sheet.offsetWidth));
    route.setAttribute("height", String(sheet.offsetHeight));
    route.setAttribute("viewBox", `0 0 ${sheet.offsetWidth} ${sheet.offsetHeight}`);
    // the route enters each region at its top-left mark, where the ink starts
    const pts = stops.map((s) => { const [x, y] = posOf(s.el); return [x - 90, y + 60]; });
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1];
      const [x1, y1] = pts[k];
      const my = (y0 + y1) / 2;
      d += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
    route.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
  }

  function drawMap() {
    if (!map) return;
    const W = sheet.offsetWidth;
    const H = sheet.offsetHeight;
    const plate = map.querySelector<HTMLElement>("[data-plate]");
    if (plate) plate.style.aspectRatio = `${W} / ${H}`;
    map.querySelectorAll<HTMLElement>("[data-go]").forEach((b, k) => {
      const el = stops[k]?.el;
      if (!el) return;
      const [ex, ey] = posOf(el);
      b.style.left = `${(ex / W) * 100}%`;
      b.style.top = `${(ey / H) * 100}%`;
      b.style.width = `${(el.offsetWidth / W) * 100}%`;
      b.style.height = `${(el.offsetHeight / H) * 100}%`;
    });
  }

  function go(k: number, smoothly = true, at?: number) {
    const s = stops[k];
    if (!s) return;
    // a map jump lands where the region reads complete (data-land, as stop progress);
    // keyboard focus lands at the start, where every region keeps its links
    const land = at ?? parseFloat(s.el.dataset.land ?? "0.02");
    scrollTo({ top: (s.start + s.w * land) * vh, behavior: smoothly ? "smooth" : "instant" });
  }

  function tick() {
    raf = 0;
    const d = target - t;
    t = Math.abs(d) < 0.0004 ? target : t + d * lerp;
    render();
    if (t !== target) {
      sheet.style.willChange = "transform";
      raf = requestAnimationFrame(tick);
    } else {
      // settled: drop the layer hint so the text re-rasters sharp at its resting scale
      sheet.style.willChange = "auto";
    }
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  const onScroll = () => {
    target = clamp(scrollY / vh, 0, total);
    kick();
  };
  const onResize = () => layout();
  // keyboard travel: a focused link off camera brings its region into frame
  const onFocus = (e: FocusEvent) => {
    const region = (e.target as HTMLElement).closest<HTMLElement>("[data-stop]");
    if (!region) return;
    const k = stops.findIndex((s) => s.el === region);
    if (k < 0 || k === active) return;
    // cut, don't glide: the focused control has to be on screen the moment it has focus
    go(k, false, 0.02);
    target = t = clamp(scrollY / vh, 0, total);
    render(true);
  };
  const onMap = (e: MouseEvent) => {
    const toggle = (e.target as HTMLElement).closest<HTMLElement>("[data-toggle]");
    if (toggle && map) {
      const open = map.toggleAttribute("data-open");
      toggle.setAttribute("aria-expanded", String(open));
      return;
    }
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-go]");
    if (!b) return;
    e.preventDefault();
    go(Number(b.dataset.go));
  };
  const relayout = () => layout();

  layout();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize);
  addEventListener("load", relayout);
  document.fonts?.ready.then(relayout);
  sheet.addEventListener("focusin", onFocus);
  map?.addEventListener("click", onMap);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onResize);
    removeEventListener("load", relayout);
    sheet.removeEventListener("focusin", onFocus);
    map?.removeEventListener("click", onMap);
    spacer.style.height = "";
    sheet.style.transform = "";
  };
}
