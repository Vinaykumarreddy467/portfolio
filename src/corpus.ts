// The page below the hero is a small retrieval system over everything in data.ts: every fact is a
// chunk, chunks sit in clusters on a map, and questions retrieve them. The search is real (BM25 plus
// character-trigram vectors, fused with RRF) and runs in the browser. No LLM: answers to the guided
// questions are written by hand from the same facts, and free questions get retrieval only.

import { ARCHIVE, JOURNEY, LOOP, METRICS, PROFILE, PROJECTS, PROOF, STACK } from './data';

export type Kind = 'profile' | 'metric' | 'contact' | 'project' | 'side' | 'method' | 'role' | 'tool' | 'win' | 'cert' | 'room' | 'writing' | 'group';

export type Chunk = {
  id: string;
  kind: Kind;
  title: string;
  text: string;
  meta?: string;
  tag?: string;
  body?: string;
  notes?: string[];
  stack?: string[];
  url?: string;
  live?: string;
  src?: string; // a SOURCES id, for the [n] reference
  items?: string[]; // group cards: what they gather
  photo?: boolean;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const usedIn = (tool: string) => {
  const t = tool.toLowerCase();
  const hits = [
    ...PROJECTS.filter((p) => p.stack.some((s) => s.toLowerCase().includes(t)) || p.body.toLowerCase().includes(t)).map((p) => p.title),
    ...ARCHIVE.filter((a) => a.stack.toLowerCase().includes(t) || a.what.toLowerCase().includes(t)).map((a) => a.name),
  ];
  return hits;
};

const all: Chunk[] = [
  { id: 'p-me', kind: 'profile', title: PROFILE.name, text: `${PROFILE.role} in ${PROFILE.location}.`, meta: PROFILE.current, photo: true },
  { id: 'p-mission', kind: 'profile', title: 'Mission', text: PROFILE.mission },
  { id: 'p-now', kind: 'profile', title: 'Now', text: `${PROFILE.current}, ${PROFILE.location}.`, meta: `${JOURNEY[0].from} – now` },
  { id: 'p-open', kind: 'profile', title: 'Open to', text: `${PROFILE.openTo}. Hiring, collaborating, or just comparing notes on retrieval: say hello.` },
  ...METRICS.map((m, i): Chunk => ({
    id: `m-${i}`,
    kind: 'metric',
    title: `${m.value.toLocaleString('en-IN')}${m.suffix}`,
    text: m.label.charAt(0).toUpperCase() + m.label.slice(1) + '.',
    src: m.src,
  })),
  { id: 'c-email', kind: 'contact', title: 'Email', text: PROFILE.email, meta: 'fastest reply', url: `mailto:${PROFILE.email}` },
  { id: 'c-linkedin', kind: 'contact', title: 'LinkedIn', text: 'molakathala-vinay-kumar-reddy', meta: 'write-ups and updates', url: PROFILE.linkedin },
  { id: 'c-github', kind: 'contact', title: 'GitHub', text: '@Vinaykumarreddy467', meta: 'every project on this page', url: PROFILE.github },
  { id: 'c-resume', kind: 'contact', title: 'Résumé', text: 'One page, PDF on Google Drive.', meta: 'download', url: PROFILE.resume },
  { id: 'c-local', kind: 'contact', title: 'Local time', text: `${PROFILE.location}, India Standard Time.`, meta: 'IST · UTC+5:30' },
  ...PROJECTS.map((p): Chunk => ({
    id: `pr-${p.id}`,
    kind: 'project',
    title: p.title,
    text: p.hook,
    body: p.body,
    stack: p.stack,
    meta: `${p.metric.value} ${p.metric.label}`,
    tag: p.tag,
    url: p.url,
    src: p.id,
  })),
  ...ARCHIVE.map((a): Chunk => ({
    id: `ws-${slug(a.name)}`,
    kind: 'side',
    title: a.name,
    text: a.what.charAt(0).toUpperCase() + a.what.slice(1) + '.',
    meta: a.stack,
    tag: a.kind,
    url: a.url,
    live: a.live,
  })),
  ...LOOP.map((l): Chunk => ({ id: `lp-${l.k}`, kind: 'method', title: l.title, text: l.text })),
  ...JOURNEY.map((j): Chunk => ({
    id: `jr-${j.hash}`,
    kind: 'role',
    title: j.role,
    text: `${j.org}${j.where ? `, ${j.where}` : ''}.`,
    meta: j.from ? `${j.from} – ${j.to}` : j.to,
    notes: j.notes,
  })),
  ...STACK.map((t): Chunk => {
    const used = usedIn(t);
    return {
      id: `tl-${slug(t)}`,
      kind: 'tool',
      title: t,
      text: used.length ? `Used in ${used.slice(0, 4).join(', ')}${used.length > 4 ? ` and ${used.length - 4} more` : ''}.` : 'In the regular toolbox.',
    };
  }),
  ...PROOF.wins.map((w, i): Chunk => ({ id: `wn-${i}`, kind: 'win', title: w.title, text: w.text, src: w.src })),
  ...PROOF.certs.map((c, i): Chunk => ({ id: `ct-${i}`, kind: 'cert', title: c.title, text: `Certified by ${c.by}.${c.note ? ` ${c.note}` : ''}` })),
  ...PROOF.rooms.map((r, i): Chunk => ({ id: `rm-${i}`, kind: 'room', title: r, text: 'A Bengaluru room he keeps showing up in: meetups, workshops, build nights.' })),
  ...PROOF.writing.map((w, i): Chunk => ({ id: `wr-${i}`, kind: 'writing', title: w, text: 'A LinkedIn write-up topic. Learning in public.', url: PROFILE.linkedinPosts, src: 'linkedin' })),
];

// Cards that gather many small chunks (each still its own dot on the map).
const groups: Chunk[] = [
  { id: 'g-stack', kind: 'group', title: `Stack · ${STACK.length} tools`, text: 'What he reaches for, day to day.', items: STACK },
  { id: 'g-certs', kind: 'group', title: `Certifications · ${PROOF.certs.length}`, text: PROOF.certs[0].note ?? '', items: PROOF.certs.map((c) => c.title) },
  { id: 'g-rooms', kind: 'group', title: `Rooms · ${PROOF.rooms.length}`, text: 'Bengaluru evenings spent with people building with AI.', items: PROOF.rooms },
  { id: 'g-writing', kind: 'group', title: 'Writing in public', text: `${METRICS.find((m) => m.src === 'linkedin')?.value ?? ''} LinkedIn write-ups, including:`, items: PROOF.writing, url: PROFILE.linkedinPosts, src: 'linkedin' },
];

export const CHUNKS = all;
const byId = new Map([...all, ...groups].map((c) => [c.id, c]));
export const chunk = (id: string) => {
  const c = byId.get(id);
  if (!c) throw new Error(`no chunk ${id}`);
  return c;
};
export const tokensOf = (c: Chunk) =>
  Math.ceil([c.title, c.text, c.meta, c.body, ...(c.notes ?? []), ...(c.stack ?? []), ...(c.items ?? [])].filter(Boolean).join(' ').length / 4);

// ---------------------------------------------------------------------------
// The map: clusters placed by hand, dots in each laid out on a sunflower spiral.
// ---------------------------------------------------------------------------

export const MAP = { w: 1000, h: 760 };

export type Cluster = { id: string; label: string; kinds: Kind[]; x: number; y: number; gap: number; r: number };

export const CLUSTERS: Cluster[] = [
  { id: 'profile', label: 'Profile', kinds: ['profile', 'metric', 'contact'], x: 205, y: 215, gap: 27, r: 6 },
  { id: 'project', label: 'Shipped', kinds: ['project'], x: 470, y: 150, gap: 40, r: 9 },
  { id: 'side', label: 'Workshop', kinds: ['side'], x: 770, y: 175, gap: 25, r: 5 },
  { id: 'method', label: 'Method', kinds: ['method'], x: 430, y: 405, gap: 40, r: 9 },
  { id: 'role', label: 'History', kinds: ['role'], x: 175, y: 520, gap: 38, r: 7.5 },
  { id: 'tool', label: 'Toolbox', kinds: ['tool'], x: 750, y: 470, gap: 21, r: 4 },
  { id: 'proof', label: 'Proof', kinds: ['win', 'cert', 'room', 'writing'], x: 470, y: 630, gap: 22, r: 4.5 },
];

export type Dot = { id: string; cluster: string; x: number; y: number; r: number; d: number };

export const DOTS: Dot[] = CLUSTERS.flatMap((cl) => {
  const members = all.filter((c) => cl.kinds.includes(c.kind));
  return members.map((c, i) => {
    const a = i * 2.39996; // golden angle
    const rad = cl.gap * Math.sqrt(i + 0.6) * 0.62;
    const big = c.kind === 'win' ? 1.4 : c.kind === 'metric' ? 0.85 : 1;
    return { id: c.id, cluster: cl.id, x: cl.x + Math.cos(a) * rad, y: cl.y + Math.sin(a) * rad, r: cl.r * big, d: (i * 0.37) % 4 };
  });
});
export const dotOf = new Map(DOTS.map((d) => [d.id, d]));
export const clusterOf = (k: Kind) => CLUSTERS.find((c) => c.kinds.includes(k));

// ---------------------------------------------------------------------------
// Retrieval: BM25 over words, cosine over character trigrams, fused with reciprocal rank fusion.
// ---------------------------------------------------------------------------

const STOP = new Set(
  'a an the and or of to in on for with is are was were be been by at as it its his he him her what who whom how where which when why do does did has have had i me my you your this that these those from about into than then so can could would should will there their them they any some all much many more most just also not no yes please tell show me us'.split(' '),
);
const SYN: Record<string, string[]> = {
  rag: ['retrieval', 'retrieve', 'citation', 'grounded'],
  agent: ['agentic', 'langgraph', 'multi-agent'],
  llm: ['groq', 'ollama', 'gemini', 'model'],
  job: ['intern', 'role', 'developer', 'engineer'],
  work: ['intern', 'role', 'developer'],
  worked: ['intern', 'role', 'developer'],
  experience: ['intern', 'role', 'developer'],
  company: ['lifetrenz', 'neosoft', 'infosys', 'capgemini', 'foundation'],
  contact: ['email', 'linkedin', 'github'],
  reach: ['email', 'linkedin'],
  hire: ['open', 'role', 'email'],
  test: ['tests', 'testcontainers', 'playwright', 'evals'],
  java: ['spring'],
  python: ['fastapi', 'flask'],
  accessibility: ['wcag', 'aria', 'accessible'],
  a11y: ['wcag', 'aria', 'accessible'],
  memory: ['context', 'persistent'],
  search: ['bm25', 'vector', 'hybrid', 'retrieval'],
  certificate: ['certified', 'certification'],
  certification: ['certified'],
  hackathon: ['hackathon'],
  mentor: ['mentor', 'volunteer', 'workshop'],
  study: ['b.tech', 'college', 'cgpa'],
  education: ['b.tech', 'college', 'cgpa'],
  frontend: ['angular', 'react', 'html'],
  backend: ['spring', 'fastapi', 'flask'],
  database: ['postgresql', 'redis', 'pgvector', 'surrealdb', 'chromadb', 'mysql', 'neo4j'],
};

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const stem = (t: string) => (t.length > 4 && t.endsWith('ies') ? `${t.slice(0, -3)}y` : t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
const words = (s: string) => fold(s).split(/[^a-z0-9+#.]+/).map((t) => t.replace(/^\.+|\.+$/g, '')).filter((t) => t && !STOP.has(t)).map(stem);
const grams = (s: string) => {
  const v = new Map<string, number>();
  for (const w of fold(s).split(/[^a-z0-9]+/).filter(Boolean)) {
    const p = ` ${w} `;
    for (let i = 0; i < p.length - 2; i++) v.set(p.slice(i, i + 3), (v.get(p.slice(i, i + 3)) ?? 0) + 1);
  }
  let n = 0;
  v.forEach((x) => (n += x * x));
  n = Math.sqrt(n) || 1;
  v.forEach((x, k) => v.set(k, x / n));
  return v;
};

const docText = (c: Chunk) => [c.title, c.title, c.text, c.meta, c.tag, c.body, ...(c.notes ?? []), ...(c.stack ?? [])].filter(Boolean).join(' ');
const index = all.map((c) => {
  const toks = words(docText(c));
  const tf = new Map<string, number>();
  toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
  return { c, tf, len: toks.length, tri: grams(`${c.title} ${c.text} ${(c.stack ?? []).join(' ')} ${c.meta ?? ''}`) };
});
const avgLen = index.reduce((s, d) => s + d.len, 0) / index.length;
const df = new Map<string, number>();
index.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)));

export type Hit = { c: Chunk; bm25: number; tri: number; rrf: number };
export type Result = { hits: Hit[]; ms: number; scanned: number };

export function search(q: string, k = 6): Result {
  const t0 = performance.now();
  const base = words(q);
  const terms = [...new Set([...base, ...base.flatMap((t) => SYN[t] ?? [])].map(stem))];
  const qv = grams(q);
  const N = index.length;
  const scored = index.map((d) => {
    let bm = 0;
    for (const t of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      bm += (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.len / avgLen))) * (base.includes(t) ? 1 : 0.5);
    }
    let tri = 0;
    qv.forEach((x, g) => (tri += x * (d.tri.get(g) ?? 0)));
    return { c: d.c, bm25: bm, tri, rrf: 0 };
  });
  const rankOf = (key: 'bm25' | 'tri') => {
    const order = [...scored].sort((a, b) => b[key] - a[key]);
    const r = new Map<Hit, number>();
    order.forEach((h, i) => r.set(h, i + 1));
    return r;
  };
  const rb = rankOf('bm25');
  const rt = rankOf('tri');
  scored.forEach((h) => (h.rrf = (h.bm25 > 0 ? 1 / (60 + rb.get(h)!) : 0) + (h.tri > 0.12 ? 1 / (60 + rt.get(h)!) : 0)));
  const hits = scored.filter((h) => h.rrf > 0 && (h.bm25 > 0 || h.tri > 0.22)).sort((a, b) => b.rrf - a.rrf).slice(0, k);
  return { hits, ms: performance.now() - t0, scanned: N };
}

// ---------------------------------------------------------------------------
// Guided questions. One per scroll step; each lights its clusters and cites its cards.
// ---------------------------------------------------------------------------

export type Seg = string | { cite: string } | { b: string };

export type Chapter = { id: string; nav: string; q: string; kinds: Kind[]; cards: string[]; answer: Seg[] };

const pr = (id: string) => `pr-${id}`;
const role = (i: number) => `jr-${JOURNEY[i].hash}`;

export const CHAPTERS: Chapter[] = [
  {
    id: 'who',
    nav: 'Who',
    q: 'who is vinay?',
    kinds: ['profile', 'metric'],
    cards: ['p-me', 'p-mission', 'p-now', 'm-0', 'm-2', 'p-open'],
    answer: [
      { b: 'A Gen AI engineer in Bengaluru' }, ' ', { cite: 'p-me' }, ' who makes LLMs grounded, measurable and actually useful in production ', { cite: 'p-mission' },
      '. Right now: Software Engineer Intern at Lifetrenz ', { cite: 'p-now' }, '. 48 original repos shipped ', { cite: 'm-0' },
      ', and 2,200+ Infosys.com pages made accessible along the way ', { cite: 'm-2' }, '. Open to Gen AI / AI Engineer roles ', { cite: 'p-open' }, '.',
    ],
  },
  {
    id: 'shipped',
    nav: 'Shipped',
    q: 'what has he shipped?',
    kinds: ['project'],
    cards: PROJECTS.map((p) => pr(p.id)),
    answer: [
      { b: 'Seven systems, all built to answer from evidence.' }, ' Context Layer gives coding agents memory that survives model and platform switches ', { cite: pr('context-layer') },
      '; the knowledge base answers only from retrieved, role-filtered rows ', { cite: pr('kbms') }, '; the Redis limiter holds a limit of 100 across two JVMs ', { cite: pr('redis') },
      '. Two hackathon builds fused retrievers ', { cite: pr('rag') }, ' and fanned out agents in parallel ', { cite: pr('travel') },
      ', the task manager keeps LLM-written tests behind human approval ', { cite: pr('taskqa') }, ', and the research assistant reads many URLs as one document ', { cite: pr('research') }, '.',
    ],
  },
  {
    id: 'method',
    nav: 'Method',
    q: 'how does he build?',
    kinds: ['method'],
    cards: LOOP.map((l) => `lp-${l.k}`),
    answer: [
      { b: 'Every project is a remix of one loop.' }, ' Retrieve ', { cite: 'lp-retrieve' }, ', reason ', { cite: 'lp-reason' }, ', cite ', { cite: 'lp-cite' }, ', measure ', { cite: 'lp-measure' },
      '. If a system can’t show where an answer came from, it isn’t done. This page runs the same loop on him.',
    ],
  },
  {
    id: 'history',
    nav: 'History',
    q: 'where has he worked?',
    kinds: ['role'],
    cards: JOURNEY.map((_, i) => role(i)),
    answer: [
      { b: 'Now a Software Engineer Intern at Lifetrenz' }, ' ', { cite: role(0) }, ', after a Gen AI internship at Dr. Reddy’s Foundation ', { cite: role(1) },
      '. Before that he made Infosys.com accessible to screen-reader users at NeoSOFT ', { cite: role(2) }, ', trained as a Java full-stack developer with Capgemini ', { cite: role(3) },
      ', interned in Python and data analysis ', { cite: role(4) }, ', and graduated in Data Science Engineering ', { cite: role(5) }, '.',
    ],
  },
  {
    id: 'toolbox',
    nav: 'Toolbox',
    q: 'what is in his toolbox?',
    kinds: ['tool', 'side'],
    cards: ['g-stack', 'ws-yt-summarizer', 'ws-multi-agent-research-system', 'ws-langchain4j-rag-document-ingestion', 'ws-doc-intelligent', 'ws-sympai'],
    answer: [
      { b: `${STACK.length} tools in regular use,` }, ' from LangGraph and MCP to Spring Boot and pgvector ', { cite: 'g-stack' }, `. The workshop holds ${ARCHIVE.length} more builds: an MCP server for YouTube transcripts `,
      { cite: 'ws-yt-summarizer' }, ', a research crew that critiques its own reports ', { cite: 'ws-multi-agent-research-system' }, ', LangChain4j ingestion for eight document formats ',
      { cite: 'ws-langchain4j-rag-document-ingestion' }, ', document intelligence with a human check ', { cite: 'ws-doc-intelligent' }, ' and a symptom predictor at 85% accuracy ', { cite: 'ws-sympai' }, '.',
    ],
  },
  {
    id: 'proof',
    nav: 'Proof',
    q: 'who has seen his work?',
    kinds: ['win', 'cert', 'room', 'writing'],
    cards: ['wn-0', 'wn-1', 'wn-2', 'wn-3', 'g-certs', 'g-rooms', 'g-writing'],
    answer: [
      { b: 'Hackathon judges, workshop rooms and a lot of Bengaluru.' }, ' Two Beyond GenAI builds ', { cite: 'wn-0' }, { cite: 'wn-1' }, ', a mentor seat at the Neo4j Agentic AI workshop ', { cite: 'wn-2' },
      ', an open-source contribution ', { cite: 'wn-3' }, ', eight certifications ', { cite: 'g-certs' }, ', ten community rooms ', { cite: 'g-rooms' }, ' and a habit of writing up what he learns ', { cite: 'g-writing' }, '.',
    ],
  },
  {
    id: 'contact',
    nav: 'Contact',
    q: 'how do I reach him?',
    kinds: ['contact'],
    cards: ['c-email', 'c-linkedin', 'c-github', 'c-resume', 'c-local'],
    answer: [
      { b: 'Email is fastest' }, ' ', { cite: 'c-email' }, '. Updates and write-ups are on LinkedIn ', { cite: 'c-linkedin' }, ', every project above is on GitHub ', { cite: 'c-github' },
      ', and the résumé is one click away ', { cite: 'c-resume' }, '. He’s in Bengaluru, on IST ', { cite: 'c-local' }, '. If your LLM needs to be right, not just fluent: write.',
    ],
  },
];

/** A retrieval-only answer for a free question: what matched, cited, or an honest miss. */
export function freeAnswer(r: Result): Seg[] {
  const [top, ...rest] = r.hits;
  if (!top) return [{ b: 'Nothing in the corpus answers that.' }, ' He’d rather say so than guess. Try a tool, a project, a company or a skill.'];
  const segs: Seg[] = [{ b: `Closest match: ${top.c.title}.` }, ` ${top.c.text} `, { cite: top.c.id }];
  if (rest.length) {
    segs.push(' Also relevant: ');
    rest.slice(0, 4).forEach((h, i, a) => {
      segs.push(h.c.title, ' ', { cite: h.c.id }, i < a.length - 1 ? ', ' : '.');
    });
  }
  segs.push(' (Retrieval only: no model wrote this.)');
  return segs;
}
