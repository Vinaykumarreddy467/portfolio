// Single source of truth for every fact on the page.
// Every claim on the site footnotes back to an entry in SOURCES.

const GH = 'https://github.com/Vinaykumarreddy467';

export const PROFILE = {
  name: 'Vinay Kumar Reddy Molakathala',
  short: 'Vinay Kumar Reddy',
  initials: 'VKR',
  role: 'Gen AI Engineer',
  current: 'Software Engineer Intern @ Lifetrenz',
  location: 'Bengaluru, India',
  timezone: 'Asia/Kolkata',
  mission: 'Make LLMs grounded, measurable, and actually useful in production.',
  email: 'vinaykumarreddy467@gmail.com',
  phone: '+91 94936 99458',
  github: GH,
  linkedin: 'https://www.linkedin.com/in/molakathala-vinay-kumar-reddy/',
  linkedinPosts: 'https://www.linkedin.com/in/molakathala-vinay-kumar-reddy/recent-activity/all/',
  resume: 'https://drive.google.com/file/d/1g_BfEvK83Hlc1Lct1kZE9HLYVove_6R6/view?usp=sharing',
  openTo: 'Gen AI / AI Engineer roles',
};

export type Source = { id: string; label: string; url: string };

export const SOURCES: Source[] = [
  { id: 'context-layer', label: 'Context_Layer', url: `${GH}/Context_Layer` },
  { id: 'kbms', label: 'knowledge-base-management-system', url: `${GH}/knowledge-base-management-system` },
  { id: 'redis', label: 'redis-api-rate-limiting-ddos-protection-poc', url: `${GH}/redis-api-rate-limiting-ddos-protection-poc` },
  { id: 'travel', label: 'travel-assistant', url: `${GH}/travel-assistant` },
  { id: 'rag', label: 'Enterprise_RAG_Assistant', url: `${GH}/Enterprise_RAG_Assistant` },
  { id: 'jobs', label: 'auto-job-application-agent', url: `${GH}/auto-job-application-agent` },
  { id: 'taskqa', label: 'task-manager', url: `${GH}/task-manager` },
  { id: 'research', label: 'Research-Assistant-With-Memory', url: `${GH}/Research-Assistant-With-Memory` },
  { id: 'profile', label: 'github.com/Vinaykumarreddy467', url: GH },
  { id: 'linkedin', label: 'LinkedIn: molakathala-vinay-kumar-reddy', url: 'https://www.linkedin.com/in/molakathala-vinay-kumar-reddy/' },
];

export const sourceIndex = (id: string) => SOURCES.findIndex((s) => s.id === id) + 1;

export type Project = {
  id: string;
  n: string;
  title: string;
  tag?: string;
  hook: string;
  body: string;
  stack: string[];
  metric: { value: string; label: string };
  url: string;
  motif: 'graph' | 'vectors' | 'buckets' | 'fanout' | 'fusion' | 'agents' | 'pipeline' | 'web';
};

export const PROJECTS: Project[] = [
  {
    id: 'context-layer',
    n: '01',
    title: 'Context Layer',
    hook: 'AI work loses momentum when the conversation gets too long, the model changes, or you switch platforms.',
    body: 'Persistent, model-agnostic project memory for AI coding agents. Structured handoffs in SurrealDB, full-text + vector + hybrid search, token-budgeted context assembly, handoff lineage and a retrieval-evaluation harness.',
    stack: ['Python', 'MCP', 'SurrealDB', 'Hybrid search', 'Evals'],
    metric: { value: '17', label: 'MCP tools' },
    url: `${GH}/Context_Layer`,
    motif: 'graph',
  },
  {
    id: 'kbms',
    n: '02',
    title: 'Knowledge Base Management System',
    hook: 'An assistant that only answers from what it retrieved, and shows you the exact chunks.',
    body: 'Grounded AI chat with citations, keyword + pgvector semantic search, Tika ingestion, Admin/Editor/Viewer RBAC and an audit log. 100% local: Ollama embeddings and answers, so no data leaves the machine.',
    stack: ['Spring Boot 3.5', 'pgvector', 'Angular 22', 'PrimeNG', 'Ollama'],
    metric: { value: '0', label: 'bytes leave the machine' },
    url: `${GH}/knowledge-base-management-system`,
    motif: 'vectors',
  },
  {
    id: 'redis',
    n: '03',
    title: 'Redis Rate Limiting & DDoS Protection',
    hook: 'First 429 at request #101 for a limit of 100, enforced across two separate JVMs.',
    body: 'Six atomic Redis algorithms: fixed window, sliding window, sliding-window counter, token bucket, leaky bucket and concurrency leases. Dynamic admin policies and fail-open / fail-closed modes.',
    stack: ['Spring Boot', 'Redis', 'Angular'],
    metric: { value: '237', label: 'green tests' },
    url: `${GH}/redis-api-rate-limiting-ddos-protection-poc`,
    motif: 'buckets',
  },
  {
    id: 'travel',
    n: '04',
    title: 'AI Travel Assistant',
    tag: 'Hackathon · Part 2',
    hook: 'From “plan me a trip” to a budget-aware, day-by-day itinerary in seconds.',
    body: 'A deterministic LangGraph state graph: an intent router fans out to flight, hotel, weather and activity agents, then a composer fans in. Live Duffel + OpenTripMap + OpenWeather data, dual-key Groq failover, every node traced in LangSmith.',
    stack: ['LangGraph', 'LangSmith', 'Groq', 'Streamlit'],
    metric: { value: '4', label: 'agents, fan-out / in' },
    url: `${GH}/travel-assistant`,
    motif: 'fanout',
  },
  {
    id: 'rag',
    n: '05',
    title: 'Enterprise RAG Assistant',
    tag: 'Hackathon · Part 1',
    hook: 'Semantic or keyword? Both, fused and tunable live.',
    body: 'A custom Reciprocal Rank Fusion engine over ChromaDB (dense) and BM25 (sparse), with layout-aware Docling ingestion, real-time weight sliders, an RRF score inspector and source-cited answers.',
    stack: ['FastAPI', 'ChromaDB', 'BM25', 'Docling', 'RRF'],
    metric: { value: '2', label: 'retrievers, one ranking' },
    url: `${GH}/Enterprise_RAG_Assistant`,
    motif: 'fusion',
  },
  {
    id: 'jobs',
    n: '06',
    title: 'Auto Job Application Agent',
    hook: '12 agents · 13 tools · 0 cloud dependencies.',
    body: 'Discovers jobs, maps skill gaps against the JD, rewrites the resume, has an LLM judge score it, exports an ATS-ready PDF, drafts outreach and tracks everything on a live dashboard over WebSockets.',
    stack: ['FastAPI', 'Multi-agent', 'LLM-as-judge', 'Angular', 'WebSockets'],
    metric: { value: '12', label: 'cooperating agents' },
    url: `${GH}/auto-job-application-agent`,
    motif: 'agents',
  },
  {
    id: 'taskqa',
    n: '07',
    title: 'Task Manager with AI QA',
    hook: 'LLMs draft the test cases. Humans approve them. Nothing runs unreviewed.',
    body: 'Generates positive, negative, validation, boundary and business-rule cases, then moves them through Draft → Approve → Execute. Groq, Gemini and Ollama providers with automatic fallback.',
    stack: ['Spring Boot 4', 'Angular SSR', 'Gemini', 'Groq', 'Ollama'],
    metric: { value: '3', label: 'LLM providers' },
    url: `${GH}/task-manager`,
    motif: 'pipeline',
  },
  {
    id: 'research',
    n: '08',
    title: 'Research Assistant with Memory',
    hook: 'Drop in URLs. Ask questions across all of them like they’re one document.',
    body: 'n8n webhook ingestion feeds chunking and local Ollama embeddings into a citation-backed RAG on FastAPI, with React and Streamlit front ends.',
    stack: ['n8n', 'FastAPI', 'Ollama', 'React', 'Streamlit'],
    metric: { value: '2', label: 'front ends' },
    url: `${GH}/Research-Assistant-With-Memory`,
    motif: 'web',
  },
];

export type ArchiveItem = { name: string; what: string; stack: string; kind: 'AI' | 'Java' | 'Web' | 'ML'; url: string; live?: string };

export const ARCHIVE: ArchiveItem[] = [
  { name: 'yt-summarizer', what: 'MCP server: YouTube transcripts as tools, resources and prompts', stack: 'FastMCP', kind: 'AI', url: `${GH}/yt-summarizer` },
  { name: 'Multi-Agent Research System', what: 'Search → read → write → critique, self-reviewing reports', stack: 'LangChain, Groq', kind: 'AI', url: `${GH}/Multi-agent-research-system` },
  { name: 'n8n Workflows', what: 'Zero-paid-API Maps lead scraper, Google-tools AI agent', stack: 'n8n, Make, Groq', kind: 'AI', url: `${GH}/n8n-workflows` },
  { name: 'Doc-Intelligent', what: 'Classify → extract → summarise, with human verification', stack: 'Spring Boot, Ollama', kind: 'AI', url: `${GH}/Doc-Intelligent` },
  { name: 'Chat with Files', what: 'Talk to PDFs, DOCX and XLSX with local models', stack: 'Spring Boot, Angular', kind: 'AI', url: `${GH}/Chat_with_files` },
  { name: 'LangChain4j Extractor', what: 'Multi-format parsing + RAG-ready chunking in Java', stack: 'LangChain4j', kind: 'AI', url: `${GH}/LangChain4j-Document-Extractor` },
  { name: 'AI Resume Analyzer', what: 'ATS-style resume vs. JD scoring in ~2 s', stack: 'FastAPI, Groq', kind: 'AI', url: `${GH}/Ai_Resume_Analyzer` },
  { name: 'Hybrid Search RAG', what: 'The original RRF hybrid-search prototype', stack: 'FastAPI, Chroma', kind: 'AI', url: `${GH}/Hybrid_Search_RAG_over_Internal_Docs` },
  { name: 'AI Travel Planner', what: 'Where it all started: the first Gen AI project', stack: 'FastAPI, Groq', kind: 'AI', url: `${GH}/Travel_Planner` },
  { name: 'TeamTask Manager', what: 'Team task management', stack: 'Spring Boot, React', kind: 'Java', url: `${GH}/TeamTask-Manager`, live: 'https://team-task-manager-seven-jade.vercel.app' },
  { name: 'E-Commerce Website', what: '30+ endpoints, JWT RBAC, Razorpay payments', stack: 'Spring Boot, React', kind: 'Java', url: `${GH}/E-Commerce_Website` },
  { name: 'Insight Admin Panel', what: 'Full-stack admin dashboard', stack: 'Spring Boot, Angular, MySQL', kind: 'Java', url: `${GH}/insight-admin-panel` },
  { name: 'ZymSync', what: 'Gym management: auth, profiles, mailing, Actuator monitoring', stack: 'Spring Boot, Angular', kind: 'Java', url: `${GH}/Zym-Management-System` },
  { name: 'SympAI', what: 'Symptom-based disease prediction at 85% accuracy + nearby hospitals', stack: 'Flask, scikit-learn', kind: 'ML', url: `${GH}/Sympai`, live: 'https://sym-ai-v8.vercel.app' },
  { name: 'Music Recommendation System', what: 'NLP query analysis + knowledge-graph recommendations', stack: 'Python, NLTK', kind: 'ML', url: `${GH}/Music-Recommendation-System` },
  { name: 'Weather Analysis', what: 'Cleaning, correlation analysis and visualisation of weather data', stack: 'Pandas, Matplotlib', kind: 'ML', url: `${GH}/Weather_analysis` },
  { name: 'E-commerce Storefront', what: 'Deployed storefront front end', stack: 'JavaScript', kind: 'Web', url: `${GH}/E-commerce`, live: 'https://e-commerce-smoky-delta-84.vercel.app' },
  { name: 'Coffee Shop Admin', what: 'Back-end admin for a coffee shop’s products', stack: 'Flask, SQLAlchemy', kind: 'Web', url: `${GH}/coffee` },
];

export type Commit = { hash: string; from: string; to: string; role: string; org: string; where?: string; notes: string[]; head?: boolean };

export const JOURNEY: Commit[] = [
  {
    hash: 'a7f3e91',
    from: 'Sep 2026',
    to: 'now',
    role: 'Software Engineer Intern',
    org: 'Lifetrenz',
    where: 'Bengaluru',
    notes: [],
    head: true,
  },
  {
    hash: '5c21d08',
    from: 'Apr 2026',
    to: 'Aug 2026',
    role: 'Gen AI Intern',
    org: 'Dr. Reddy’s Foundation',
    notes: [],
  },
  {
    hash: 'e04b6ac',
    from: 'Jul 2025',
    to: 'Dec 2025',
    role: 'Frontend Developer · Infosys.com',
    org: 'NeoSOFT',
    where: 'Infosys client location',
    notes: [
      'Raised WCAG 2.1 AA compliance across 2,200+ Infosys.com pages.',
      'ARIA, semantic HTML, keyboard navigation and focus management for screen readers.',
      'Built reusable, accessible Adobe AEM components and templates.',
      'Shipped an AI Text-to-Speech feature for visually impaired users with the Java and AEM teams.',
    ],
  },
  {
    hash: '9d8e1f2',
    from: 'Mar 2025',
    to: 'Jun 2025',
    role: 'Java Full-Stack Trainee',
    org: 'EduBridge × Capgemini Digital Academy',
    where: 'Bangalore',
    notes: ['Three-month full-stack Java program, hands-on with Java-based applications.'],
  },
  {
    hash: '3b7c4d5',
    from: 'Aug 2023',
    to: 'Sep 2024',
    role: 'Python Full-Stack & Data Analysis Intern',
    org: 'Techno-hub Foundation · APSSDC',
    notes: [
      'Flask + SQLAlchemy back-end admin for a coffee shop on MySQL.',
      'Pandas / NumPy / Matplotlib preprocessing and correlation analysis for meteorological data.',
    ],
  },
  {
    hash: '0000001',
    from: '',
    to: 'May 2025',
    role: 'B.Tech, Data Science Engineering',
    org: 'Sri Venkateswara College of Engineering and Technology',
    notes: ['CGPA 7.69 · College hackathon runner-up.'],
  },
];

export const METRICS = [
  { value: 48, suffix: '', label: 'original repos shipped', src: 'profile' },
  { value: 237, suffix: '', label: 'green tests on one rate-limiter', src: 'redis' },
  { value: 2200, suffix: '+', label: 'Infosys.com pages made accessible', src: 'profile' },
  { value: 17, suffix: '', label: 'MCP tools in Context Layer', src: 'context-layer' },
  { value: 12, suffix: '', label: 'agents in one job pipeline', src: 'jobs' },
  { value: 39, suffix: '', label: 'LinkedIn write-ups, learning in public', src: 'linkedin' },
];

export const LOOP = [
  { k: 'retrieve', title: 'Retrieve', text: 'Dense + sparse, fused with RRF. pgvector, ChromaDB, BM25, SurrealDB. The model only sees what earned its place in the context window.' },
  { k: 'reason', title: 'Reason', text: 'LangGraph state graphs with explicit routers, tools and memory. Deterministic where it matters, agentic where it pays.' },
  { k: 'cite', title: 'Cite', text: 'Every answer points at the exact chunk it came from. If it can’t cite, it doesn’t answer.' },
  { k: 'measure', title: 'Measure', text: 'Retrieval evals, LLM judges, LangSmith traces, human-in-the-loop review. Vibes are not a metric.' },
];

export const STACK = [
  'LangGraph', 'LangChain', 'LangChain4j', 'LangSmith', 'MCP', 'FastMCP', 'Ollama', 'Groq', 'Gemini', 'pgvector', 'ChromaDB', 'SurrealDB', 'Neo4j', 'Redis',
  'Spring Boot', 'Java', 'Python', 'FastAPI', 'Angular', 'React', 'TypeScript', 'n8n', 'Docling', 'PostgreSQL', 'MySQL', 'Adobe AEM',
];

export const PROOF = {
  wins: [
    { title: 'Beyond GenAI hackathon · Part 1', text: 'Amadeus × Contentstack. Shipped the Enterprise RAG Assistant.', src: 'rag' },
    { title: 'Beyond GenAI hackathon · Part 2', text: 'Shipped the AI Travel Assistant, then helped run the event.', src: 'travel' },
    { title: 'Neo4j Agentic AI Workshop', text: 'Volunteer mentor for Cypher and GraphRAG.', src: 'profile' },
    { title: 'Open Source Connect India 2026', text: 'Contributor.', src: 'profile' },
  ],
  certs: [
    { title: 'Neo4j Certified Professional', by: 'Neo4j', note: 'Cleared at 3 AM, taught Cypher at the workshop that same day.' },
    { title: 'Model Context Protocol', by: 'Anthropic' },
    { title: 'Agent Skills', by: 'Anthropic' },
    { title: 'Claude Code 101', by: 'Anthropic' },
    { title: 'Claude 101', by: 'Anthropic' },
    { title: 'Java Full Stack', by: 'Capgemini Digital Academy' },
    { title: 'Computer Vision 101', by: 'Infosys Springboard' },
    { title: 'Project Management Fundamentals', by: 'IBM SkillsBuild' },
  ],
  rooms: ['AI Dev Circle', 'KSUG.AI', 'null | OWASP', 'Claude Community BLR', 'Snowflake World Tour', 'IBM Bob-a-thon', 'n8n Builder Sessions', 'Local AI & Infra Meetup', 'Self-Learning Agents Mixer', 'Bengaluru Tech Week 2026'],
  writing: ['Inference engineering', 'Agent memory', 'Self-hosting SLMs', 'MCP server design', 'Honest reviews of AI coding tools'],
};
