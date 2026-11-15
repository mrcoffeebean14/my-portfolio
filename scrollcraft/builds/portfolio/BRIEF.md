# BRIEF: portfolio (Mandeep Singh)

Interviewed. Answers below are the owner's words as supplied, lightly reflowed.
Authored decisions are marked **[authored]**.

## The eight topics

1. **Vibe:** "Dark, precise, alive, notebook-like. References: the film Arrival,
   the ship log in the game Outer Wilds, and the Computer World album cover by
   Kraftwerk."
2. **Journey:** "Hero: your name, one line, and the live assistant prompt.
   Adapt-RAG. TAILORAI. Typeclone and SpendWise. Corporate Cruise internship.
   Stack, drawn as a system map. Ratings (LeetCode and CodeChef 1700+) and the
   IEEE paper. Email. The other repos sit as a compact index, not a chapter."
3. **Energy:** "Calm at the hero. First peak at Adapt-RAG. Sustained at TAILORAI.
   Quiet at the internship, which is the human beat. Second peak at the stack
   map. Calm and still at the email."
4. **Feelings:** "Hero: curiosity. Projects: 'this is real'. Internship: trust.
   Stack: breadth under control. Email: easy to act. The moment they retell is
   the router firing in real time as they scroll."
5. **Signature seed:** "Scrolling walks a real query through Adapt-RAG's 7
   nodes. The Qdrant, Tavily or direct-LLM path lights up as you scroll. The
   trace comes from the live /api/chat route. If that route doesn't expose node
   traces, I'll use a recorded real trace and say so on the page."
6. **Range:** "One step toward dense editorial. It keeps the restraint but
   carries more information per screen."
7. **World:** "One unbroken world. The page is a single notebook sheet that the
   camera pans and zooms across. Chapters are regions on it, not cuts."
8. **Assets:** "None provided. Build from real UI, code and repo data, with no
   generated images or video."

Defaults confirmed: the visitor leaves believing "he ships real AI systems, not
demos". The one action is **Email me**. OpsLens AI stays out. No em dashes.

## Facts checked against source (and where the brief disagreed)

- `/api/chat` is the portfolio assistant (Groq, gpt-oss-20b), not Adapt-RAG. It
  exposes no node trace, and no recorded Adapt-RAG run exists to replay.
  **[authored]** The walk uses the real graph from
  `Adapt-RAG/src/rag/graph_builder.py`: the 7 real node names, the real edges,
  the real routing rule (`index` / `general` / anything else to `web_search`),
  `MAX_REWRITES = 2`, and the real log-line formats (`[query_analysis]
  route=...`, `[grade] yes|no`). The three questions are samples, and the page
  says so on its face: "scripted walk, not a recorded run".
- Ratings: LeetCode **1786**, CodeChef **1639** (src/data/profile.ts). CodeChef
  is not 1700+, so the page shows the real numbers.
- Paper: the data names **ICCET-2026 (DVCOE)**. Nothing in the data says IEEE,
  so the page does not claim IEEE until that is confirmed.
- TAILORAI graph: `parse > customize_sections > merge > cover_letter`; only
  `projects, experience, skills, education` are rewritten; providers Groq,
  OpenAI, Anthropic, Google.
- SpendWise: `/api/auth/{register,login,activate,refresh}`, access token 1 h,
  refresh 7 d, 20 requests per minute rate limit, `/api/report/{excel,pdf}`.

## Belief, action

- Believe by the end: he ships real AI systems, not demos.
- Next: **Email me** (mailto). Same label everywhere.

## Journey (beats)

1. Curiosity: a name, a sentence, a window that answers.
2. Proof by mechanism: a graph that visibly decides.
3. Proof by craft: an agent that edits only what it should.
4. Range: two shipped products, a form app and a finance API.
5. Trust: three months on a production codebase, told plainly.
6. Command: everything he uses, as one working system.
7. Credibility: three figures anyone can check.
8. Ease: one button, in the place a drawing keeps its signature.

## Feeling curve

| # | Region | Feeling | What causes it |
|---|---|---|---|
| 1 | Title (hero) | curiosity | Name, one line, a live assistant window, held still on a dark sheet |
| 2 | Adapt-RAG | awe that it is real | The router fires under the reader's hand: route chosen, retrieval graded `no`, query rewritten, retried, answered. Three questions, three paths |
| 3 | TAILORAI | absorption | The camera tracks along the pipeline while four sections rewrite in parallel and the locked ones stay grey |
| 4 | Typeclone + SpendWise | respect for range | Two products side by side, real endpoints and real limits, the other repos as a small index in the margin |
| 5 | Corporate Cruise | trust | Everything stops. Plain prose, no diagram. The quietest screen on the sheet (authored silence) |
| 6 | Stack map | command | The camera pulls back and the system map inks itself layer by layer: interface, services, agents, data, ship |
| 7 | Record | credibility | Three real figures, small, precise |
| 8 | Title block (close) | ease | The camera lands on the sheet's title block in the bottom corner. One button: Email me |

**Peak:** Adapt-RAG, region 2. "I scrolled and watched the graph grade its own
retrieval as `no`, rewrite the question and go round again."
It gets the largest span on the page (2.3 vh) and the calm hero before it.
The stack map is a crest, not a second peak: shorter span (2.2 vh), the
quiet internship before it.

**Tell-someone:** "It's the site where you scroll and watch his RAG graph decide,
node by node, how to answer a question."

**Authored silence:** region 5 (internship) holds the camera perfectly still for
its whole span (no push-in, `data-quiet`). The only thing that moves is the text:
the four points arrive one at a time as you scroll, so the beat is quiet, not dead.

## Grammar **[authored]**

**Annotated sheet** (new). One fixed stage holding one DOM sheet: grid paper,
ink diagrams, real text and links. Scroll drives a camera (pan and zoom) between
regions. Nothing in document flow but the spacer.

- Nav: a **map of the sheet** (the ship log), camera frame drawn on it,
  every region clickable.
- Hero: an establishing position on the sheet, its title area.
- Close: arrival at the sheet's title block, bottom right, where a drawing
  keeps its signature. The CTA is an entry in that block.
- Bans: video, photography, scrims, acts, pinning, kinetic type, cards as page
  structure, anything scrolling over the stage.
- Reduced motion and no JS: the same sheet, flattened into a plain reading
  column. Nothing hidden, every link works.

## Verification (2026-11-15, production build, `next start -p 4500`)

Tools: scroll-craft `shoot.mjs` (headless Chrome) and `playwright-cli` with axe-core 4.10.2.

| Check | Result |
|---|---|
| Dead scroll, desktop 1440x900, phone 390x844, compact 360x640 | none detected (61 / 61 / 46 samples) |
| Scroll track | 18.7 vh, 16830 px at 900 px tall, as computed |
| Console errors | 0 |
| Keyboard: Tab through every link | camera cuts to the focused region; on screen in 3 of 4 full walks, one intermittent miss right after a server restart (not reproduced since) |
| Map: open, jump to Stack and Adapt-RAG, close | works; jumps land where the region reads complete (`data-land`) |
| axe, contrast with the camera resting on each region | all 8 pass |
| axe, whole page, reduced motion | 0 violations |
| axe, whole page, camera mode | 6 contrast flags, all on the Typeclone sample form while it is off camera and dimmed to 26% by design |
| Horizontal overflow, both modes | none |
| Live assistant | answers; plain text, no markdown, no dashes; facts match src/data (it calls Typeclone by its repo name, "TypeForm") |

Fixed during verification: route line drawn through content; map panel covering
copy; stack framing cut off; Express mark invisible; grids not collapsing on
phones; router graph unreadable on phones (now drawn larger and panned by the
walk); phone stack scaled by a desktop cap; translucent phone bar; TAILORAI
overflowing the reading column; map jumps landing on half-inked regions; keyboard
focus landing off screen; assistant markdown, dash and "live" errors; `<aside>`
inside `<main>`; band labels struck through by the next divider.

Not verified: a real phone (iOS Safari touch scroll, address-bar resize), screen
reader pass, no-JS render, deployment on Vercel.
