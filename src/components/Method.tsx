import { useEffect, useRef, useState } from 'react';
import { LOOP } from '../data';
import { reducedMotion } from '../hooks';
import { Cite, SectionHead } from './ui';

type Node = { id: string; x: number; y: number; w: number; t: string; sub: string };

const NODES: Node[] = [
  { id: 'intent', x: 16, y: 60, w: 104, t: 'intent', sub: 'user query' },
  { id: 'router', x: 166, y: 60, w: 104, t: 'router', sub: 'langgraph' },
  { id: 'retrieval', x: 316, y: 8, w: 112, t: 'retrieval', sub: 'dense ⊕ bm25' },
  { id: 'tools', x: 316, y: 60, w: 112, t: 'tools', sub: 'mcp' },
  { id: 'memory', x: 316, y: 112, w: 112, t: 'memory', sub: 'surrealdb' },
  { id: 'composer', x: 474, y: 60, w: 110, t: 'composer', sub: 'llm' },
  { id: 'judge', x: 474, y: 262, w: 110, t: 'judge', sub: 'llm-as-judge' },
  { id: 'answer', x: 166, y: 262, w: 262, t: 'cited answer', sub: 'or no answer at all' },
];

const ACTIVE: Record<string, string[]> = {
  retrieve: ['retrieval', 'memory'],
  reason: ['router', 'tools', 'composer'],
  cite: ['answer'],
  measure: ['judge'],
};

const EDGES = [
  'M120 80 L166 80',
  'M270 80 C 295 80, 290 28, 316 28',
  'M270 80 L316 80',
  'M270 80 C 295 80, 290 132, 316 132',
  'M428 28 C 452 28, 450 80, 474 80',
  'M428 80 L474 80',
  'M428 132 C 452 132, 450 80, 474 80',
  'M529 100 L529 262',
  'M474 282 L428 282',
];

const FLOW = 'M68 80 L218 80 L372 80 L529 80 L529 282 L297 282';

export function Method() {
  const [step, setStep] = useState('retrieve');
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setStep((e.target as HTMLElement).dataset.k!)),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const on = ACTIVE[step] ?? [];
  const still = reducedMotion();

  return (
    <section className="section" id="method" aria-labelledby="method-title">
      <div className="wrap">
        <SectionHead
          idx="03"
          kicker="Method"
          lede={<>Every project I ship is some remix of one loop.<Cite id="profile" sm /> If a system can't show where an answer came from, it isn't done.</>}
        >
          <span id="method-title">Retrieve, reason, <span className="serif">cite,</span> measure.</span>
        </SectionHead>

        <div className="loop">
          <figure className="loop-diagram" data-reveal>
            <svg viewBox="0 0 600 380" role="img" aria-label="Agent pipeline: intent, router, retrieval, tools and memory, composer, judge, cited answer">
              {EDGES.map((d, i) => <path key={i} d={d} className="pipe-edge" />)}
              <path d={FLOW} className="pipe-edge live" />
              {NODES.map((n) => (
                <g key={n.id} className={`pipe-node${on.includes(n.id) ? ' on' : ''}`}>
                  <rect x={n.x} y={n.y} width={n.w} height={40} rx={8} />
                  <text x={n.x + 12} y={n.y + 17}>{n.t}</text>
                  <text x={n.x + 12} y={n.y + 31} className="sub">{n.sub}</text>
                </g>
              ))}
              {!still && (
                <circle r="4" className="pipe-packet">
                  <animateMotion dur="4.2s" repeatCount="indefinite" path={FLOW} />
                </circle>
              )}
              <text x="16" y="350" fill="var(--fg-2)" fontFamily="var(--f-serif)" fontStyle="italic" fontSize="19">
                “First 429 at request #101, across two JVMs.”
              </text>
              <text x="16" y="372" fill="var(--accent)" fontFamily="var(--f-mono)" fontSize="11">
                ↳ source: redis-api-rate-limiting-ddos-protection-poc / README.md
              </text>
            </svg>
            <figcaption className="cap mono mute">
              <span>fig. 1 · the loop</span>
              <span>step: <span className="accent">{step}</span></span>
            </figcaption>
          </figure>

          <ol className="loop-steps">
            {LOOP.map((s, i) => (
              <li key={s.k} data-k={s.k} ref={(el) => { refs.current[i] = el; }} className={`loop-step${step === s.k ? ' on' : ''}`}>
                <h3><span className="mono">0{i + 1}</span>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
