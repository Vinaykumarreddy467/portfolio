import type { JSX } from 'react';
import type { Project } from '../data';

// One tiny, honest diagram per project: each picture is the system's actual shape.

const Box = ({ x, y, w = 70, h = 26, t, hot }: { x: number; y: number; w?: number; h?: number; t: string; hot?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} className="m-box" style={hot ? { stroke: 'var(--accent)' } : undefined} />
    <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" className={hot ? 'm-txt-hot' : 'm-txt'}>{t}</text>
  </g>
);

function Graph() {
  const nodes = [[160, 110], [90, 60], [230, 55], [250, 150], [80, 160], [160, 35], [40, 105], [285, 100], [165, 185]];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [1, 6], [2, 7], [3, 7], [4, 8], [3, 8], [4, 6]];
  return (
    <>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} className={a === 0 ? 'm-strong flow' : 'm-line'} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 9 : 5} className={i === 0 ? 'm-hot pulse' : 'm-dot'} />
      ))}
      <text x="160" y="140" textAnchor="middle" className="m-txt-hot">handoff</text>
      <text x="14" y="208" className="m-txt">surrealdb · 17 tools</text>
    </>
  );
}

function Vectors() {
  const pts = Array.from({ length: 46 }, (_, i) => {
    const a = i * 2.39996;
    const r = 18 + (i % 9) * 10 + ((i * 37) % 11);
    return [160 + Math.cos(a) * r * 1.35, 108 + Math.sin(a) * r * 0.78] as const;
  });
  const q = [178, 96];
  const near = [...pts].sort((a, b) => Math.hypot(a[0] - q[0], a[1] - q[1]) - Math.hypot(b[0] - q[0], b[1] - q[1])).slice(0, 5);
  return (
    <>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.2} className="m-dot" opacity={0.5} />)}
      {near.map(([x, y], i) => <line key={i} x1={q[0]} y1={q[1]} x2={x} y2={y} className="m-strong flow" />)}
      {near.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={3.4} className="m-hot" />)}
      <circle cx={q[0]} cy={q[1]} r={7} className="m-strong" />
      <text x="14" y="22" className="m-txt">pgvector · cosine</text>
      <text x="14" y="208" className="m-txt-hot">answer ← [chunk 3] [chunk 7]</text>
    </>
  );
}

function Buckets() {
  return (
    <>
      {Array.from({ length: 20 }, (_, i) => {
        const hot = i === 19;
        const hgt = 40 + ((i * 53) % 90);
        return (
          <rect key={i} x={22 + i * 14} y={170 - hgt} width={9} height={hgt} rx={2}
            className={hot ? 'm-hot grow' : 'm-dot grow'} style={{ animationDelay: `${i * 0.08}s`, opacity: hot ? 1 : 0.45 }} />
        );
      })}
      <line x1="14" y1="62" x2="306" y2="62" className="m-strong" strokeDasharray="5 4" />
      <text x="14" y="54" className="m-txt-hot">limit = 100</text>
      <text x="306" y="54" textAnchor="end" className="m-txt-hot">#101 → 429</text>
      <text x="14" y="196" className="m-txt">jvm-a · jvm-b · one redis</text>
    </>
  );
}

function Fanout() {
  const agents = ['flights', 'hotels', 'weather', 'activities'];
  return (
    <>
      {agents.map((_, i) => {
        const y = 30 + i * 46;
        return (
          <g key={i}>
            <path d={`M95 110 C 125 110, 115 ${y + 13}, 125 ${y + 13}`} className="m-strong flow" />
            <path d={`M205 ${y + 13} C 215 ${y + 13}, 205 110, 230 110`} className="m-line" />
          </g>
        );
      })}
      <Box x={20} y={97} w={75} t="router" hot />
      {agents.map((a, i) => <Box key={a} x={125} y={30 + i * 46} w={80} t={a} />)}
      <Box x={230} y={97} w={75} t="composer" hot />
      <text x="14" y="208" className="m-txt">langgraph · traced in langsmith</text>
    </>
  );
}

function Fusion() {
  const L = ['d3', 'd1', 'd7', 'd4'];
  const R = ['d1', 'd9', 'd3', 'd2'];
  const F = ['d1', 'd3', 'd9', 'd7'];
  return (
    <>
      <text x="40" y="26" className="m-txt">dense</text>
      <text x="40" y="198" className="m-txt">bm25</text>
      {L.map((d, i) => <Box key={`l${d}`} x={20 + i * 36} y={34} w={30} h={22} t={d} hot={d === 'd1'} />)}
      {R.map((d, i) => <Box key={`r${d}`} x={20 + i * 36} y={160} w={30} h={22} t={d} hot={d === 'd1'} />)}
      <path d="M170 45 C 200 45, 200 110, 220 110" className="m-strong flow" />
      <path d="M170 171 C 200 171, 200 110, 220 110" className="m-strong flow" />
      <text x="195" y="104" textAnchor="middle" className="m-txt-hot">rrf</text>
      {F.map((d, i) => <Box key={`f${d}`} x={226} y={62 + i * 26} w={76} h={20} t={`${i + 1}. ${d}`} hot={i === 0} />)}
    </>
  );
}

function Agents() {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 160 + Math.cos(a) * 82;
        const y = 108 + Math.sin(a) * 78;
        return (
          <g key={i}>
            <line x1={160} y1={108} x2={x} y2={y} className={i % 3 === 0 ? 'm-strong flow' : 'm-line'} />
            <circle cx={x} cy={y} r={7} className={i % 3 === 0 ? 'm-hot pulse' : 'm-dot'} style={{ animationDelay: `${i * 0.2}s` }} />
          </g>
        );
      })}
      <circle cx={160} cy={108} r={20} className="m-box" style={{ stroke: 'var(--accent)' }} />
      <text x={160} y={111} textAnchor="middle" className="m-txt-hot">judge</text>
      <text x="14" y="208" className="m-txt">12 agents · 13 tools</text>
    </>
  );
}

function Pipeline() {
  return (
    <>
      <Box x={14} y={60} w={80} h={30} t="draft" />
      <Box x={120} y={60} w={80} h={30} t="approve" hot />
      <Box x={226} y={60} w={80} h={30} t="execute" />
      <line x1="94" y1="75" x2="120" y2="75" className="m-strong flow" />
      <line x1="200" y1="75" x2="226" y2="75" className="m-strong flow" />
      <text x="160" y="50" textAnchor="middle" className="m-txt-hot">human in the loop</text>
      {['positive', 'negative', 'boundary', 'validation', 'business-rule'].map((c, i) => (
        <g key={c}>
          <rect x={14} y={112 + i * 18} width={8} height={8} rx={2} className={i === 2 ? 'm-hot' : 'm-dot'} opacity={i === 2 ? 1 : 0.5} />
          <text x={30} y={120 + i * 18} className="m-txt">{c}</text>
        </g>
      ))}
      <text x="306" y="208" textAnchor="end" className="m-txt">groq ⇢ gemini ⇢ ollama</text>
    </>
  );
}

function Web() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={16} y={24 + i * 44} width={86} height={30} rx={5} className="m-box" />
          <text x={24} y={43 + i * 44} className="m-txt">url://{['docs', 'blog', 'paper', 'wiki'][i]}</text>
          <path d={`M102 ${39 + i * 44} C 150 ${39 + i * 44}, 150 110, 196 110`} className="m-strong flow" />
        </g>
      ))}
      <rect x={196} y={60} width={108} height={100} rx={8} className="m-box" style={{ stroke: 'var(--accent)' }} />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={208} y1={80 + i * 15} x2={292 - (i % 2) * 22} y2={80 + i * 15} className="m-line" />)}
      <text x={250} y={178} textAnchor="middle" className="m-txt-hot">one document</text>
      <text x="14" y="212" className="m-txt">n8n → ollama → fastapi</text>
    </>
  );
}

const MAP: Record<Project['motif'], () => JSX.Element> = {
  graph: Graph, vectors: Vectors, buckets: Buckets, fanout: Fanout, fusion: Fusion, agents: Agents, pipeline: Pipeline, web: Web,
};

export function Motif({ kind }: { kind: Project['motif'] }) {
  const C = MAP[kind];
  return (
    <svg className="motif" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <C />
    </svg>
  );
}
