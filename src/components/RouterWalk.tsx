import { useEffect, useRef } from "react";
import { listeners } from "@/lib/camera";

/**
 * Adapt-RAG's real graph, from src/rag/graph_builder.py: seven nodes, the real edges, the
 * real routing rule and MAX_REWRITES = 2. Scroll walks three sample questions through it.
 * The log lines use the formats the nodes actually print. The questions are samples, and
 * the page says so: this is a scripted walk over the real graph, not a recorded run.
 */

const NODES = [
  { id: "query_analysis", x: 190, y: 300 },
  { id: "retriever", x: 430, y: 150 },
  { id: "grade", x: 670, y: 150 },
  { id: "rewrite", x: 550, y: 40 },
  { id: "web_search", x: 430, y: 300 },
  { id: "general_llm", x: 430, y: 450 },
  { id: "generate", x: 880, y: 300 },
] as const;

const EDGES: Record<string, { d: string; label?: string; lx?: number; ly?: number }> = {
  start: { d: "M52 300 H115" },
  index: { d: "M265 300 C 310 300, 310 150, 355 150", label: "index", lx: 316, ly: 210 },
  search: { d: "M265 300 H355", label: "search", lx: 310, ly: 292 },
  general: { d: "M265 300 C 310 300, 310 450, 355 450", label: "general", lx: 316, ly: 402 },
  toGrade: { d: "M505 150 H595" },
  no: { d: "M670 125 C 670 70, 660 40, 625 40", label: "no", lx: 676, ly: 82 },
  retry: { d: "M475 40 C 440 40, 430 70, 430 125" },
  yes: { d: "M745 150 C 820 150, 880 200, 880 275", label: "yes", lx: 818, ly: 186 },
  web: { d: "M505 300 H805" },
  done: { d: "M955 300 C 975 300, 975 330, 975 368" },
  direct: { d: "M505 450 C 760 450, 975 450, 975 392" },
};

type Step = { id: string; log?: string };

const WALKS: Array<{ q: string; route: string; steps: Step[] }> = [
  {
    q: "What notice period does my uploaded lease ask for?",
    route: "index",
    steps: [
      { id: "e:start" },
      { id: "n:query_analysis", log: "[query_analysis] route=index" },
      { id: "e:index" },
      { id: "n:retriever" },
      { id: "e:toGrade" },
      { id: "n:grade", log: "[grade] no" },
      { id: "e:no" },
      { id: "n:rewrite", log: "rewrite 1 of 2" },
      { id: "e:retry" },
      { id: "n:retriever" },
      { id: "e:toGrade" },
      { id: "n:grade", log: "[grade] yes" },
      { id: "e:yes" },
      { id: "n:generate" },
      { id: "e:done" },
      { id: "n:end", log: "answered from your documents" },
    ],
  },
  {
    q: "Who won the Mexican Grand Prix this year?",
    route: "search",
    steps: [
      { id: "e:start" },
      { id: "n:query_analysis", log: "[query_analysis] route=search" },
      { id: "e:search" },
      { id: "n:web_search", log: "Tavily, 5 results, dated today" },
      { id: "e:web" },
      { id: "n:generate" },
      { id: "e:done" },
      { id: "n:end", log: "answered from the web" },
    ],
  },
  {
    q: "Summarise our chat so far.",
    route: "general",
    steps: [
      { id: "e:start" },
      { id: "n:query_analysis", log: "[query_analysis] route=general" },
      { id: "e:general" },
      { id: "n:general_llm" },
      { id: "e:direct" },
      { id: "n:end", log: "answered from chat history" },
    ],
  },
];

const W0 = 0.05;
const SPAN = 0.3;

export function RouterWalk({ id }: { id: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const parts = new Map<string, Element>();
    el.querySelectorAll("[data-part]").forEach((p) => parts.set(p.getAttribute("data-part")!, p));
    const entries = [...el.querySelectorAll<HTMLElement>("[data-walk]")];
    const lines = [...el.querySelectorAll<HTMLElement>("[data-line]")];
    let last = "";

    listeners.set(id, (p) => {
      const w = Math.min(WALKS.length - 1, Math.max(0, Math.floor((p - W0) / SPAN)));
      const q = Math.min(1, Math.max(0, (p - W0 - w * SPAN) / (SPAN * 0.86)));
      const steps = WALKS[w].steps;
      const at = p < W0 ? -1 : q * steps.length;
      const key = `${w}:${at.toFixed(2)}`;
      if (key === last) return;
      last = key;

      const state = new Map<string, string>();
      // earlier walks stay on the sheet as a faint trace
      for (let k = 0; k < w; k++) WALKS[k].steps.forEach((s) => state.set(s.id, "trace"));
      steps.forEach((s, k) => {
        if (at >= k + 1) state.set(s.id, "on");
        else if (at >= k) state.set(s.id, "now");
      });
      parts.forEach((node, partId) => {
        const s = state.get(partId) ?? "off";
        node.setAttribute("data-s", s);
        if (partId.startsWith("e:")) {
          const k = steps.findIndex((st, i) => st.id === partId && at >= i && at < i + 1);
          const f = k > -1 ? at - k : s === "on" || s === "trace" ? 1 : 0;
          (node as SVGPathElement).style.strokeDashoffset = String(1 - f);
        }
      });

      // where the walk is, along the graph's x axis: on a phone the graph is drawn larger
      // than the screen and pans to keep the active node in view (globals.css, .walk__graph)
      const X: Record<string, number> = { start: 40, end: 975 };
      NODES.forEach((n) => (X[n.id] = n.x));
      const xOf = (k: number) => X[steps[Math.max(0, Math.min(steps.length - 1, k))].id.slice(2)];
      let gx = X.start;
      if (at >= 0) {
        const k = Math.min(steps.length - 1, Math.floor(at));
        const f = Math.min(1, at - k);
        gx = steps[k].id.startsWith("n:") ? xOf(k) : xOf(k - 1) + (xOf(k + 1) - xOf(k - 1)) * f;
      }
      el.style.setProperty("--gx", (gx / 1000).toFixed(4));

      entries.forEach((entry, k) => entry.setAttribute("data-s", k < w ? "done" : k === w && at >= 0 ? "now" : "off"));
      lines.forEach((line) => {
        const [lw, ls] = line.dataset.line!.split(":").map(Number);
        line.setAttribute("data-s", lw < w || (lw === w && at >= ls) ? "on" : "off");
      });
    });
    return () => {
      listeners.delete(id);
    };
  }, [id]);

  return (
    <div ref={root} className="walk">
      <figure className="walk__graph">
        <svg viewBox="0 0 1000 500" role="img" aria-labelledby={`${id}-cap`}>
          <circle className="g-term" data-part="n:start" cx="40" cy="300" r="12" />
          <text className="g-tag" x="40" y="334" textAnchor="middle">
            START
          </text>
          {Object.entries(EDGES).map(([key, e]) => (
            <g key={key}>
              <path className="g-rail" d={e.d} />
              <path className="g-edge" data-part={`e:${key}`} d={e.d} pathLength={1} />
              {e.label ? (
                <text className="g-tag" x={e.lx} y={e.ly}>
                  {e.label}
                </text>
              ) : null}
            </g>
          ))}
          {NODES.map((n) => (
            <g key={n.id} className="g-node" data-part={`n:${n.id}`}>
              <rect x={n.x - 75} y={n.y - 25} width="150" height="50" rx="6" />
              <text x={n.x} y={n.y + 6} textAnchor="middle">
                {n.id}
              </text>
            </g>
          ))}
          <circle className="g-term" data-part="n:end" cx="975" cy="380" r="12" />
          <text className="g-tag" x="975" y="414" textAnchor="middle">
            END
          </text>
        </svg>
        <figcaption id={`${id}-cap`} className="sr-only">
          Adapt-RAG&apos;s graph. query_analysis labels each question index, search or general.
          Index goes to retriever, then grade; a &quot;no&quot; grade rewrites the query and
          retrieves again, up to two rewrites, then generate. Search goes to web_search, then
          generate. General goes straight to general_llm.
        </figcaption>
      </figure>

      <ol className="walk__log">
        {WALKS.map((walk, w) => (
          <li key={walk.q} data-walk data-s="done">
            <p className="walk__q">{walk.q}</p>
            <ul>
              {walk.steps.map((s, k) =>
                s.log ? (
                  <li key={k} data-line={`${w}:${k}`} data-s="on">
                    {s.log}
                  </li>
                ) : null
              )}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
