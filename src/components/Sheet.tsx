import { useEffect, useRef } from "react";
import Image from "next/image";
import { mountCamera } from "@/lib/camera";
import { Assistant } from "@/components/Assistant";
import { RouterWalk } from "@/components/RouterWalk";
import {
  profile,
  links,
  education,
  experience,
  positions,
  achievements,
} from "@/data/profile";
import { featured, alsoShipped } from "@/data/projects";

/**
 * The annotated sheet: one notebook page, every region on it, a camera over it.
 * Regions appear in journey order in the DOM, which is also the reading order with the
 * camera off. Positions on the sheet are CSS (globals.css, .cam only).
 */

const project = (id: string) => featured.find((p) => p.id === id)!;
const rag = project("adapt-rag");
const tailor = project("tailorai");
const typeclone = project("typeclone");
const spendwise = project("spendwise");
const [role] = experience;
const [leetcode, codechef, paper] = achievements;

const STOPS = [
  { id: "title", label: "Title" },
  { id: "adapt-rag", label: "Adapt-RAG" },
  { id: "tailorai", label: "TAILORAI" },
  { id: "products", label: "Typeclone and SpendWise" },
  { id: "internship", label: "Corporate Cruise" },
  { id: "stack", label: "Stack" },
  { id: "record", label: "Record" },
  { id: "contact", label: "Email" },
];

/** Marks drawn in near-black, turned for this ground. */
const INK = new Set(["langchain", "github", "vercel", "railway", "express", "openai", "nextjs"]);

const BANDS: Array<{ name: string; via?: string; items: Array<[string | null, string]> }> = [
  {
    name: "Interface",
    via: "HTTP and JSON",
    items: [
      ["nextjs", "Next.js"],
      ["react", "React"],
      ["typescript", "TypeScript"],
      ["tailwindcss", "Tailwind"],
    ],
  },
  {
    name: "Services",
    via: "tool calls",
    items: [
      ["fastapi", "FastAPI"],
      [null, "Flask"],
      [null, "Express.js"],
      ["nodejs", "Node.js"],
      ["spring", "Spring Boot"],
      ["django", "Django"],
    ],
  },
  {
    name: "Agents and retrieval",
    via: "queries and vectors",
    items: [
      [null, "LangGraph"],
      ["langchain", "LangChain"],
      ["qdrant", "Qdrant"],
      ["openai", "OpenAI API"],
      [null, "Relevance grading"],
    ],
  },
  {
    name: "Data",
    via: "runs in",
    items: [
      ["mongodb", "MongoDB"],
      ["postgres", "PostgreSQL"],
      ["mysql", "MySQL"],
      ["redis", "Redis"],
    ],
  },
  {
    name: "Ship",
    items: [
      ["docker", "Docker"],
      ["linux-tux", "Linux"],
      ["git", "Git"],
      ["github", "GitHub"],
      ["postman", "Postman"],
      ["vercel", "Vercel"],
      ["railway", "Railway"],
    ],
  },
];

const LANGUAGES = ["Python", "Java", "TypeScript", "JavaScript", "C++", "SQL", "Bash"];

const SPENDWISE_API: Array<[string, string, string]> = [
  ["POST", "/api/auth/register", "activation link sent"],
  ["POST", "/api/auth/login", "access 1 h, refresh 7 d"],
  ["POST", "/api/auth/refresh", "new access token"],
  ["GET", "/api/budgets/current-month", "this month's budgets"],
  ["POST", "/api/recurring", "recurring expense"],
  ["GET", "/api/report/pdf", "monthly report, or /excel"],
  ["ANY", "21st call in a minute", "429, rate limited"],
];

const TAILOR_SECTIONS = ["projects", "experience", "skills", "education"];

const DIFF: Array<[string, string]> = [
  ["\\item Built REST APIs for the login system.", "\\item Built 6+ REST APIs for authentication and session management in Node.js."],
  ["\\item Worked on payments.", "\\item Integrated third-party payment and email APIs, cutting handling time by about 60%."],
  ["\\item Did code reviews.", "\\item Caught a critical payment flow bug across 10+ React and Node.js pull requests."],
];

function Mark({ file, size = 22 }: { file: string; size?: number }) {
  return (
    <Image
      src={`/icons/${file}.svg`}
      alt=""
      width={size}
      height={size}
      className={INK.has(file) ? "mark mark--ink" : "mark"}
    />
  );
}

function Links({ repo, live }: { repo: string; live?: string }) {
  return (
    <p className="links">
      {live ? (
        <a className="link" href={live} target="_blank" rel="noopener noreferrer">
          Open it live
        </a>
      ) : null}
      <a className="link" href={repo} target="_blank" rel="noopener noreferrer">
        Read the source
      </a>
    </p>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <ul className="tags mono" aria-label="Built with">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

export function Sheet() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    // sc-ready: the page has laid out (read by scroll-craft's verification harness)
    const ready = () => html.classList.add("sc-ready");
    if (!root.current || !html.classList.contains("cam")) return ready();
    const unmount = mountCamera(root.current);
    ready();
    return unmount;
  }, []);

  return (
    <div ref={root} className="world">
      <a className="skip" href="#contact">
        Skip to email
      </a>
      <div className="ground" data-ground aria-hidden="true" />

      <main className="stage" data-stage data-sc-world>
        <div className="sheet" data-sheet>
          <svg className="route" data-route aria-hidden="true">
            <path className="route__trace" data-trace pathLength={1} />
          </svg>

          <div className="row row--1">
            {/* ------------------------------------------------------------ title */}
            <section id="title" className="region r-title" data-stop="Title" data-w="0.6" aria-labelledby="title-h">
              <p className="kicker mono">Open to internships and 2027 new-grad roles</p>
              <h1 id="title-h">{profile.name}</h1>
              <p className="lead">
                Backend and agentic AI engineer. I build retrieval graphs, agents and the APIs under
                them, and I ship them.
              </p>
              <Assistant />
            </section>

            {/* ------------------------------------------------------------ Adapt-RAG */}
            <section
              id="adapt-rag"
              className="region r-rag"
              data-stop="Adapt-RAG"
              data-w="2.3"
              data-pan="0.01 0.06"
              data-live
              aria-labelledby="rag-h"
            >
              <header className="r-head">
                <h2 id="rag-h">{rag.title}</h2>
                <p>{rag.summary}</p>
                <Stack items={rag.stack} />
                <Links repo={rag.repo} live={rag.live} />
              </header>
              <RouterWalk id="adapt-rag" />
              <p className="note">
                The graph, its routes, the two-rewrite limit and the bracketed log lines are the
                repository&apos;s own (src/rag/graph_builder.py). The questions are samples: this is a
                scripted walk through the real graph, not a recorded run.
              </p>
            </section>
          </div>

          <div className="row row--2">
            {/* ------------------------------------------------------------ TAILORAI */}
            <section
              id="tailorai"
              className="region r-tailor"
              data-stop="TAILORAI"
              data-w="1.2"
              data-live
              data-floor="0.92"
              data-land="0.9"
              aria-labelledby="tailor-h"
            >
              <div className="r-tailor__body">
              <header className="r-head">
                <h2 id="tailor-h">{tailor.title}</h2>
                <p>{tailor.summary}</p>
                <Stack items={tailor.stack} />
                <Links repo={tailor.repo} live={tailor.live} />
              </header>

              <ol className="pipe mono" aria-label="TAILORAI's LangGraph workflow">
                <li className="pipe__node pipe__node--on">parse</li>
                <li className="pipe__fan">
                  <span className="pipe__node pipe__node--on">customize_sections</span>
                  <ul>
                    {TAILOR_SECTIONS.map((s, i) => (
                      <li key={s} style={{ "--i": i } as React.CSSProperties}>
                        <span>{s}</span>
                        <i aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                  <span className="pipe__locked">every other section, certifications included, passes through untouched</span>
                </li>
                <li className="pipe__node pipe__node--merge">merge</li>
                <li className="pipe__node pipe__node--cover">cover_letter</li>
              </ol>

              <figure className="diff mono">
                <figcaption>Example bullets in, rewritten against a backend job description</figcaption>
                {DIFF.map(([before, after], i) => (
                  <div key={i} className="diff__pair" style={{ "--i": i } as React.CSSProperties}>
                    <p className="diff__del">
                      <span aria-hidden="true">-</span> {before}
                    </p>
                    <p className="diff__add">
                      <span aria-hidden="true">+</span> {after}
                    </p>
                  </div>
                ))}
                <p className="diff__foot">Groq by default (qwen3-32b). OpenAI, Anthropic or Google by changing one file.</p>
              </figure>
              </div>
            </section>

            {/* ------------------------------------------------------------ Typeclone, SpendWise, index */}
            <section id="products" className="region r-products" data-stop="Typeclone and SpendWise" data-w="1.2" aria-labelledby="products-h">
              <h2 id="products-h" className="sr-only">
                Typeclone and SpendWise
              </h2>
              <div className="r-products__body">
              <article className="spec" aria-labelledby="typeclone-h">
                <h3 id="typeclone-h">{typeclone.title}</h3>
                <p>{typeclone.summary}</p>
                <p className="fact mono">{typeclone.fact}</p>
                <div className="form-demo" aria-label="A sample form, as Typeclone publishes it">
                  <p className="mono">Sample form · question 3 of 6</p>
                  <p className="form-demo__q">How did you hear about us?</p>
                  <ul>
                    {["A friend", "Search", "A conference", "Somewhere else"].map((o, i) => (
                      <li key={o} data-on={i === 1 || undefined}>
                        <span className="mono">{String.fromCharCode(65 + i)}</span> {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <Stack items={typeclone.stack} />
                <Links repo={typeclone.repo} live={typeclone.live} />
              </article>

              <article className="spec" aria-labelledby="spendwise-h">
                <h3 id="spendwise-h">{spendwise.title}</h3>
                <p>{spendwise.summary}</p>
                <table className="api mono">
                  <caption className="sr-only">Some of SpendWise&apos;s endpoints</caption>
                  <tbody>
                    {SPENDWISE_API.map(([verb, path, what]) => (
                      <tr key={path} data-err={verb === "ANY" || undefined}>
                        <td>{verb}</td>
                        <td>{path}</td>
                        <td>{what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Stack items={spendwise.stack} />
                <Links repo={spendwise.repo} live={spendwise.live} />
              </article>

              <div className="index">
                <h3 id="index-h" className="mono">
                  Also in public repositories
                </h3>
                <ul>
                  {alsoShipped.map((r) => (
                    <li key={r.slug}>
                      <a className="link" href={r.live ?? r.repo} target="_blank" rel="noopener noreferrer">
                        {r.title}
                      </a>
                      <span>{r.summary}</span>
                      <span className="mono">{r.stack.join(", ")}</span>
                    </li>
                  ))}
                </ul>
                <a className="link mono" href={links.repos} target="_blank" rel="noopener noreferrer">
                  All repositories
                </a>
              </div>
              </div>
            </section>
          </div>

          <div className="row row--3">
            {/* ------------------------------------------------------------ internship */}
            <section id="internship" className="region r-intern" data-stop="Corporate Cruise" data-w="1.2" data-live data-quiet data-land="0.85" aria-labelledby="intern-h">
              <h2 id="intern-h">
                {role.title}, {role.org}
              </h2>
              <p className="mono dates">
                {role.from} to {role.to}
              </p>
              <ul className="points">
                {role.points.map((point, i) => (
                  <li key={point} style={{ "--i": i } as React.CSSProperties}>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="aside">
                {education.degree}, {education.school}, {education.from} to {education.to}. CGPA{" "}
                {education.cgpa}. {positions.map((p) => `${p.title}, ${p.org.split(",")[0]}`).join(". ")}.
              </p>
            </section>

            {/* ------------------------------------------------------------ stack map */}
            <section id="stack" className="region r-stack" data-stop="Stack" data-w="2.2" data-live data-cap="0.9" data-floor="0.66" data-land="0.8" aria-labelledby="stack-h">
              <header className="r-head">
                <h2 id="stack-h">Stack, as one system</h2>
                <p>What I reach for, in the order a request travels through it.</p>
              </header>
              <div className="map-grid">
                <div className="langs mono">
                  <h3>Languages</h3>
                  <ul>
                    {LANGUAGES.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
                <ol className="bands">
                  {BANDS.map((band, i) => (
                    <li key={band.name} className="band" style={{ "--i": i } as React.CSSProperties}>
                      <h3 className="mono">{band.name}</h3>
                      <ul>
                        {band.items.map(([file, name]) => (
                          <li key={name}>
                            {file ? <Mark file={file} /> : <span className="mark mark--none" aria-hidden="true" />}
                            {name}
                          </li>
                        ))}
                      </ul>
                      {band.via ? <p className="band__via mono">{band.via}</p> : null}
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <div className="col">
              {/* ---------------------------------------------------------- record */}
              <section id="record" className="region r-record" data-stop="Record" data-w="0.7" aria-labelledby="record-h">
                <h2 id="record-h">Record</h2>
                <dl>
                  {[leetcode, codechef].map((a) => (
                    <div key={a.label}>
                      <dt>{a.label}</dt>
                      <dd className="figure mono">{a.figure}</dd>
                      {a.href ? (
                        <dd>
                          <a className="link" href={a.href} target="_blank" rel="noopener noreferrer">
                            See the profile
                          </a>
                        </dd>
                      ) : null}
                    </div>
                  ))}
                  <div>
                    <dt>{paper.label}</dt>
                    <dd className="figure mono">{paper.figure}</dd>
                    <dd>{paper.note}</dd>
                  </div>
                </dl>
              </section>

              {/* ---------------------------------------------------------- the title block */}
              <section id="contact" className="region r-sign" data-stop="Email" data-w="0.6" aria-labelledby="sign-h">
                <h2 id="sign-h">Tell me what you are building.</h2>
                <table className="block">
                  <tbody>
                    <tr>
                      <th scope="row">Drawn by</th>
                      <td>{profile.name}</td>
                    </tr>
                    <tr>
                      <th scope="row">Role</th>
                      <td>{profile.role}</td>
                    </tr>
                    <tr>
                      <th scope="row">Based in</th>
                      <td>{profile.location}</td>
                    </tr>
                    <tr>
                      <th scope="row">Free from</th>
                      <td>Internships now. Full time from {education.to}.</td>
                    </tr>
                  </tbody>
                </table>
                <p className="sign__cta">
                  <a className="btn" href={`mailto:${profile.email}`}>
                    Email me
                  </a>
                  <span className="mono">{profile.email}</span>
                </p>
                <p className="links">
                  <a className="link" href={links.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                  <a className="link" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                  <a className="link" href={links.leetcode} target="_blank" rel="noopener noreferrer">
                    LeetCode
                  </a>
                  <a className="link" href={profile.resume} target="_blank" rel="noopener noreferrer">
                    Resume
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <div className="near" data-near aria-hidden="true">
        <i style={{ left: 300, top: 900, width: 1400, height: 900 }} />
        <i style={{ left: 2600, top: 300, width: 1600, height: 1100 }} />
        <i style={{ left: 1200, top: 2600, width: 1800, height: 1200 }} />
        <i style={{ left: 3800, top: 3300, width: 1400, height: 1000 }} />
      </div>

      <nav className="map" data-map aria-label="Sheet map">
        <div className="map__plate" id="sheet-map" data-plate>
          {STOPS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} data-go={i} className="map__region">
              <span className="map__name">{s.label}</span>
            </a>
          ))}
          <span className="map__frame" data-frame aria-hidden="true" />
        </div>
        <button
          type="button"
          className="map__here mono"
          data-toggle
          aria-expanded="false"
          aria-controls="sheet-map"
        >
          <span data-label>Title</span>
          <span className="map__hint"> · map</span>
        </button>
        <a className="btn btn--small" href={`mailto:${profile.email}`}>
          Email me
        </a>
      </nav>

      <div className="spacer" data-spacer aria-hidden="true" />
    </div>
  );
}
