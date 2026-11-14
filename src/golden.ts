// The test questions the search is graded on. `want` lists the chunks a good answer needs;
// an empty `want` means the corpus has no answer and the search should return nothing.
// Add a question here whenever a real one fails: the score below is only as honest as this list.

export type Golden = { q: string; want: string[] };

export const GOLDEN: Golden[] = [
  // projects, asked the way a person would
  { q: 'memory for coding agents', want: ['pr-context-layer'] },
  { q: 'how do you keep context when switching models', want: ['pr-context-layer'] },
  { q: 'rate limiter', want: ['pr-redis'] },
  { q: 'ddos protection', want: ['pr-redis'] },
  { q: 'what happens when redis goes down', want: ['pr-redis'] },
  { q: 'token bucket', want: ['pr-redis'] },
  { q: 'role based access knowledge base', want: ['pr-kbms'] },
  { q: 'pgvector project', want: ['pr-kbms', 'tl-pgvector'] },
  { q: 'hybrid search with reciprocal rank fusion', want: ['pr-rag', 'pr-context-layer', 'ws-hybrid-search-rag'] },
  { q: 'travel itinerary planner', want: ['pr-travel', 'ws-ai-travel-planner'] },
  { q: 'parallel agents', want: ['pr-travel'] },
  { q: 'llm generated test cases', want: ['pr-taskqa'] },
  { q: 'human approval before running', want: ['pr-taskqa'] },
  { q: 'ask questions across many urls', want: ['pr-research'] },
  { q: 'export chat to pdf', want: ['pr-research'] },
  // side projects
  { q: 'youtube transcripts', want: ['ws-yt-summarizer'] },
  { q: 'resume scoring against a job description', want: ['ws-ai-resume-analyzer'] },
  { q: 'disease prediction', want: ['ws-sympai'] },
  { q: 'payments razorpay', want: ['ws-e-commerce-website'] },
  { q: 'gym management', want: ['ws-zymsync'] },
  { q: 'lead scraper', want: ['ws-n8n-workflows'] },
  { q: 'chat with pdf files', want: ['ws-chat-with-files'] },
  // tools
  { q: 'langgraph', want: ['tl-langgraph', 'pr-travel'] },
  { q: 'mcp', want: ['tl-mcp', 'pr-context-layer', 'ws-yt-summarizer'] },
  { q: 'spring boot', want: ['tl-spring-boot'] },
  { q: 'does he know java', want: ['tl-java'] },
  { q: 'graph database', want: ['tl-neo4j', 'ct-0'] },
  { q: 'vector database', want: ['tl-pgvector', 'tl-chromadb'] },
  // history
  { q: 'where does he work now', want: ['p-now', 'jr-a7f3e91'] },
  { q: 'accessibility', want: ['jr-e04b6ac', 'm-2'] },
  { q: 'screen readers', want: ['jr-e04b6ac'] },
  { q: 'infosys', want: ['jr-e04b6ac', 'm-2'] },
  { q: 'capgemini', want: ['jr-9d8e1f2', 'ct-5'] },
  { q: 'education', want: ['jr-0000001'] },
  { q: 'what did he study', want: ['jr-0000001'] },
  { q: 'data analysis internship', want: ['jr-3b7c4d5'] },
  // proof
  { q: 'hackathon', want: ['wn-0', 'wn-1'] },
  { q: 'certifications', want: ['ct-0', 'ct-1'] },
  { q: 'anthropic', want: ['ct-1', 'ct-2', 'ct-3', 'ct-4'] },
  { q: 'mentor', want: ['wn-2'] },
  { q: 'open source', want: ['wn-3'] },
  { q: 'what does he write about', want: ['wr-0', 'wr-1', 'wr-2', 'wr-3', 'wr-4', 'm-5'] },
  // method, profile, contact
  { q: 'how does he measure retrieval', want: ['lp-measure'] },
  { q: 'evals', want: ['lp-measure'] },
  { q: 'how many repos', want: ['m-0'] },
  { q: 'is he open to work', want: ['p-open'] },
  { q: 'how can i contact him', want: ['c-email', 'c-linkedin'] },
  { q: 'resume', want: ['c-resume'] },
  // misspellings
  { q: 'langgrph', want: ['tl-langgraph'] },
  { q: 'accesibility', want: ['jr-e04b6ac', 'm-2'] },
  { q: 'postgress', want: ['tl-postgresql'] },
  { q: 'kubernets', want: [] },
  // not in the corpus: the right result is nothing
  { q: 'kubernetes', want: [] },
  { q: 'rust', want: [] },
  { q: 'blockchain', want: [] },
  { q: 'salary expectations', want: [] },
  { q: 'favourite movie', want: [] },
  { q: 'swift ios apps', want: [] },
  { q: 'photoshop', want: [] },
  { q: 'zxqvw plomb', want: [] },
];
