import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  CHAPTERS, CHUNKS, CLUSTERS, DOTS, MAP, chunk, clusterOf, dotOf, freeAnswer, search, tokensOf,
  type Chapter, type Chunk, type Hit, type Kind, type Seg,
} from '../corpus';
import { PROFILE, SOURCES, pose, sourceIndex } from '../data';
import { reducedMotion, useClock } from '../hooks';
import { ArrowUpRight } from './ui';

type View = {
  key: string;
  q: string;
  kinds: Kind[] | null;
  cards: Chunk[];
  lit: Set<string>;
  answer: Seg[];
  hits?: Map<string, Hit>;
  ms?: number;
  typed: boolean; // a guided question types itself out; a visitor's own doesn't
};

type Actions = { onOpen: (c: Chunk) => void; onCopy: () => void; tee: string };

const BUDGET = 4096;
const TRY = ['langgraph', 'redis', 'accessibility', 'mcp', 'hackathon', 'spring boot'];
const wideQuery = '(min-width: 1000px)';

const chapterView = (ch: Chapter): View => ({
  key: `ch-${ch.id}`,
  q: ch.q,
  kinds: ch.kinds,
  cards: ch.cards.map(chunk),
  lit: new Set(CHUNKS.filter((c) => ch.kinds.includes(c.kind)).map((c) => c.id)),
  answer: ch.answer,
  typed: true,
});

let runs = 0;
const askView = (q: string): View => {
  const r = search(q);
  return {
    key: `q-${++runs}`,
    q,
    kinds: null,
    cards: r.hits.map((h) => h.c),
    lit: new Set(r.hits.map((h) => h.c.id)),
    answer: freeAnswer(r),
    hits: new Map(r.hits.map((h) => [h.c.id, h])),
    ms: r.ms,
    typed: false,
  };
};

// Group cards point at the dots they gather.
const GROUP_DOTS: Record<string, string> = { 'g-stack': 'tl-', 'g-certs': 'ct-', 'g-rooms': 'rm-', 'g-writing': 'wr-' };
const anchorOf = (c: Chunk) => {
  const d = dotOf.get(c.id);
  if (d) return d;
  const pre = GROUP_DOTS[c.id];
  const ds = pre ? DOTS.filter((x) => x.id.startsWith(pre)) : [];
  if (!ds.length) return null;
  return { x: ds.reduce((s, x) => s + x.x, 0) / ds.length, y: ds.reduce((s, x) => s + x.y, 0) / ds.length };
};

const wordsIn = (segs: Seg[]) =>
  segs.reduce((n, s) => n + (typeof s === 'string' ? s.split(/\s+/).filter(Boolean).length : 'b' in s ? s.b.split(/\s+/).length : 1), 0);

// ---------------------------------------------------------------------------

export function Corpus({ tee, onCopy }: { tee: string; onCopy: () => void }) {
  const [wide, setWide] = useState(() => matchMedia(wideQuery).matches);
  const [open, setOpen] = useState<Chunk | null>(null);
  useEffect(() => {
    const m = matchMedia(wideQuery);
    const f = () => setWide(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  const act: Actions = { onOpen: setOpen, onCopy, tee };
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) root.dataset.zone = 'corpus';
      else delete root.dataset.zone;
    }, { rootMargin: '0px 0px -94% 0px' });
    io.observe(el);
    return () => { io.disconnect(); delete root.dataset.zone; };
  }, []);

  return (
    <section className="corpus" id="corpus" ref={section} aria-labelledby="corpus-title">
      <header className="corpus-intro wrap">
        <p className="mono c-kicker"><span>(02)</span> Inside the thinking cap</p>
        <h2 id="corpus-title">
          Everything I’ve built, <span className="serif">indexed.</span>
        </h2>
        <div className="corpus-lede">
          <p>
            The rest of this page is a small retrieval system over my work. {CHUNKS.length} chunks, real BM25 and vector
            search, running in your browser. Scroll and it asks the obvious questions, then answers with citations.
            Or ask it your own.
          </p>
          <dl className="mono">
            <div><dt>chunks</dt><dd>{CHUNKS.length}</dd></div>
            <div><dt>clusters</dt><dd>{CLUSTERS.length}</dd></div>
            <div><dt>questions</dt><dd>{CHAPTERS.length}</dd></div>
            <div><dt>model</dt><dd>none</dd></div>
          </dl>
        </div>
      </header>
      {wide ? <Stage {...act} /> : <Steps {...act} />}
      {open && <Inspector c={open} onClose={() => setOpen(null)} {...act} />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Desktop: a pinned stage. Scrolling steps through the questions.

function Stage(act: Actions) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const map = useRef<SVGSVGElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const cardEls = useRef(new Map<string, HTMLElement>());
  const [ci, setCi] = useState(0);
  const [asked, setAsked] = useState<View | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = track.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const step = (r.height - innerHeight) / CHAPTERS.length;
        setCi(Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(-r.top / step))));
      });
    };
    on();
    addEventListener('scroll', on, { passive: true });
    const bump = () => setSize((s) => s + 1);
    const ro = new ResizeObserver(() => { on(); bump(); });
    const st = stage.current;
    if (st) { ro.observe(st); st.addEventListener('scroll', bump, true); }
    return () => { removeEventListener('scroll', on); ro.disconnect(); st?.removeEventListener('scroll', bump, true); cancelAnimationFrame(raf); };
  }, []);

  // Scrolling to another question drops the visitor's own.
  useEffect(() => { setAsked(null); setDraft(null); }, [ci]);

  const view = useMemo(() => asked ?? chapterView(CHAPTERS[ci]), [asked, ci]);
  const { typed, phase, words } = usePlay(view);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setAsked(askView(q.trim()));
  };

  // Threads from each retrieved dot to its card, once the cards are in.
  const [links, setLinks] = useState<{ id: string; d: string }[]>([]);
  useLayoutEffect(() => {
    if (phase !== 'show') return setLinks([]);
    const st = stage.current?.getBoundingClientRect();
    const m = map.current?.getBoundingClientRect();
    if (!st || !m) return;
    const s = Math.min(m.width / MAP.w, m.height / MAP.h);
    const ox = m.left - st.left + (m.width - MAP.w * s) / 2;
    const oy = m.top - st.top + (m.height - MAP.h * s) / 2;
    setLinks(view.cards.flatMap((c) => {
      const el = cardEls.current.get(c.id);
      const a = anchorOf(c);
      if (!el || !a) return [];
      const r = el.getBoundingClientRect();
      const list = el.parentElement?.getBoundingClientRect();
      if (list && (r.top < list.top - 2 || r.top + 24 > list.bottom)) return [];
      const x1 = ox + a.x * s;
      const y1 = oy + a.y * s;
      const x2 = r.left - st.left;
      const y2 = r.top - st.top + Math.min(24, r.height / 2);
      const mx = x1 + (x2 - x1) * 0.55;
      return [{ id: c.id, d: `M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}` }];
    }));
  }, [view, phase, size]);

  const refCard = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) cardEls.current.set(id, el);
    else cardEls.current.delete(id);
  }, []);

  return (
    <div className="ctrack" ref={track} style={{ ['--n' as string]: CHAPTERS.length }}>
      {CHAPTERS.map((c, i) => (
        <span key={c.id} id={`q-${c.id}`} className="canchor" style={{ ['--i' as string]: i }} aria-hidden="true" />
      ))}
      <div className="cstage" ref={stage}>
        <div className="cbar-top">
          <form className="cquery" role="search" onSubmit={(e) => { e.preventDefault(); ask(draft ?? ''); }}>
            <label htmlFor="cq" className="mono">ask</label>
            <span className="cq-caret" aria-hidden="true">›</span>
            <input
              id="cq"
              ref={input}
              value={draft ?? typed}
              placeholder="type a question, a tool, a company…"
              autoComplete="off"
              spellCheck={false}
              onFocus={() => setDraft((d) => d ?? '')}
              onBlur={() => setDraft((d) => (d ? d : null))}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(null); setAsked(null); input.current?.blur(); } }}
            />
            {phase === 'type' && draft === null && <span className="cq-cursor" aria-hidden="true" />}
            <button type="submit" className="mono">retrieve ↵</button>
          </form>
          <nav className="crail" aria-label="Questions">
            {CHAPTERS.map((c, i) => (
              <a key={c.id} href={`#q-${c.id}`} className={i === ci && !asked ? 'on' : ''}>
                <span className="mono">0{i + 1}</span>{c.nav}
              </a>
            ))}
          </nav>
        </div>

        <div className="cmap-wrap">
          <CorpusMap ref={map} view={view} phase={phase} hot={hot} onHot={setHot} onOpen={act.onOpen} />
          <p className="cmap-try mono">
            try
            {TRY.map((t) => <button key={t} onClick={() => { setDraft(t); ask(t); }}>{t}</button>)}
          </p>
        </div>

        <Panel view={view} phase={phase} words={words} hot={hot} onHot={setHot} refCard={refCard} {...act} />

        <svg className="clinks" aria-hidden="true">
          {links.map((l, i) => (
            <path key={`${view.key}-${l.id}`} d={l.d} pathLength={1} className={hot === l.id ? 'hot' : ''} style={{ ['--i' as string]: i }} />
          ))}
        </svg>
      </div>
    </div>
  );
}

/** Types the question, then streams the answer a couple of words at a time. */
function usePlay(view: View) {
  const [typed, setTyped] = useState(view.q);
  const [phase, setPhase] = useState<'type' | 'show'>('show');
  const [words, setWords] = useState(Infinity);
  useEffect(() => {
    if (reducedMotion()) {
      setTyped(view.q);
      setPhase('show');
      setWords(Infinity);
      return;
    }
    const total = wordsIn(view.answer);
    let id = 0;
    const stream = () => {
      setPhase('show');
      setWords(0);
      let w = 0;
      id = window.setInterval(() => {
        w += 2;
        setWords(w);
        if (w >= total) clearInterval(id);
      }, 34);
    };
    if (!view.typed) {
      setTyped(view.q);
      const t = window.setTimeout(stream, 60);
      return () => { clearTimeout(t); clearInterval(id); };
    }
    setTyped('');
    setPhase('type');
    let i = 0;
    let t = 0;
    id = window.setInterval(() => {
      i += 1;
      setTyped(view.q.slice(0, i));
      if (i >= view.q.length) {
        clearInterval(id);
        t = window.setTimeout(stream, 200);
      }
    }, 34);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [view]);
  return { typed, phase, words };
}

// ---------------------------------------------------------------------------

type MapProps = {
  view: View | null; phase: string; hot: string | null; onHot: (id: string | null) => void; onOpen: (c: Chunk) => void;
  small?: boolean; onCluster?: (id: string) => void;
};

const CorpusMapInner = ({ view, phase, hot, onHot, onOpen, small, onCluster }: MapProps, ref: Ref<SVGSVGElement>) => {
  const reach = useMemo(() => new Map(CLUSTERS.map((cl) => {
    const ds = DOTS.filter((d) => d.cluster === cl.id);
    return [cl.id, Math.max(...ds.map((d) => Math.hypot(d.x - cl.x, d.y - cl.y) + d.r))];
  })), []);
  const on = (id: string) => !!view && phase === 'show' && view.lit.has(id);
  const hotDot = hot ? dotOf.get(hot) : null;
  const hotChunk = hotDot ? CHUNKS.find((c) => c.id === hotDot.id) : null;

  return (
    <svg ref={ref} className={`cmap${small ? ' small' : ''}`} viewBox={`0 0 ${MAP.w} ${MAP.h}`} preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={`Map of ${CHUNKS.length} chunks in ${CLUSTERS.length} clusters: ${CLUSTERS.map((c) => c.label).join(', ')}`}>
      <g className="cmap-grid" aria-hidden="true">
        {[120, 240, 360].map((r) => <circle key={r} cx={MAP.w / 2} cy={MAP.h / 2} r={r} />)}
        <path d={`M${MAP.w / 2} 20V${MAP.h - 20}M20 ${MAP.h / 2}H${MAP.w - 20}`} />
      </g>
      {CLUSTERS.map((cl) => {
        const lit = DOTS.some((d) => d.cluster === cl.id && on(d.id));
        const n = DOTS.filter((d) => d.cluster === cl.id).length;
        const r = reach.get(cl.id)!;
        return (
          <g key={cl.id} className={`ccl${lit ? ' on' : ''}${onCluster ? ' go' : ''}`} onClick={onCluster && (() => onCluster(cl.id))}>
            <circle className="ccl-ring" cx={cl.x} cy={cl.y} r={r + 10} />
            <text x={cl.x} y={cl.y - r - 20} textAnchor="middle">{cl.label.toUpperCase()} <tspan>{n}</tspan></text>
          </g>
        );
      })}
      {DOTS.map((d) => {
        const c = CHUNKS.find((x) => x.id === d.id)!;
        return (
          <g key={d.id} className="cfloat" style={{ ['--d' as string]: d.d }}>
            <circle
              className={`cdot k-${c.kind}${on(d.id) ? ' on' : ''}${hot === d.id ? ' hot' : ''}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
              onMouseEnter={() => onHot(d.id)}
              onMouseLeave={() => onHot(null)}
              onClick={onCluster ? undefined : () => onOpen(c)}
            />
          </g>
        );
      })}
      {hotDot && hotChunk && (
        <g className="ctip" transform={`translate(${hotDot.x},${hotDot.y - hotDot.r - 12})`} pointerEvents="none">
          <rect x={-(hotChunk.title.length * 7.4 + 20) / 2} y={-22} width={hotChunk.title.length * 7.4 + 20} height={26} rx={6} />
          <text textAnchor="middle" y={-4}>{hotChunk.title}</text>
        </g>
      )}
    </svg>
  );
};
const CorpusMap = forwardRef(CorpusMapInner);

// ---------------------------------------------------------------------------

type PanelProps = Actions & {
  view: View;
  phase: string;
  words: number;
  hot: string | null;
  onHot: (id: string | null) => void;
  refCard?: (id: string) => (el: HTMLElement | null) => void;
  limit?: number; // phones: show the first few cards, the rest behind a toggle
  onMore?: () => void;
};

function Panel({ view, phase, words, hot, onHot, refCard, limit, onMore, ...act }: PanelProps) {
  const shown = phase === 'show';
  const tok = shown ? view.cards.reduce((s, c) => s + tokensOf(c), 0) : 0;
  const num = new Map(view.cards.map((c, i) => [c.id, i + 1]));
  return (
    <div className="cctx" aria-live="polite">
      <header className="cctx-head">
        <span className="mono">context window</span>
        <span className="mono"><b>{tok.toLocaleString('en-IN')}</b> / {BUDGET.toLocaleString('en-IN')} tokens</span>
        <i className="cmeter" aria-hidden="true"><b style={{ width: `${(tok / BUDGET) * 100}%` }} /></i>
        <p className="mono cfilter">
          {view.kinds
            ? <>filter: kind ∈ {'{'}{view.kinds.join(', ')}{'}'} · {view.lit.size} of {CHUNKS.length} chunks</>
            : <>bm25 + trigram vectors · rrf k=60 · {view.cards.length} hits in {(view.ms ?? 0).toFixed(1)} ms</>}
        </p>
      </header>
      {shown && (
        <ol className="ccards" key={view.key} data-many={view.cards.length > 5 || undefined}>
          {view.cards.slice(0, limit).map((c, i) => (
            <Card key={c.id} c={c} n={i + 1} i={i} hit={view.hits?.get(c.id)} top={view.hits ? view.cards.map((x) => view.hits!.get(x.id)!.bm25) : null}
              hot={hot === c.id} onHot={onHot} refEl={refCard?.(c.id)} {...act} />
          ))}
        </ol>
      )}
      {shown && onMore && view.cards.length > 3 && (
        <button className="cmore mono" onClick={onMore} aria-expanded={!limit}>
          {limit ? `show all ${view.cards.length} chunks ↓` : 'show fewer ↑'}
        </button>
      )}
      {shown && !view.cards.length && <p className="cempty mono">0 chunks retrieved</p>}
      <div className="cans">
        <span className="mono">answer{view.typed ? '' : ' · retrieval only'}</span>
        <p>{shown ? <AnswerText segs={view.answer} words={words} num={num} onHot={onHot} onOpen={act.onOpen} /> : <span className="cthink mono">retrieving…</span>}</p>
      </div>
    </div>
  );
}

type AnswerProps = { segs: Seg[]; words: number; num: Map<string, number>; onHot: (id: string | null) => void; onOpen: (c: Chunk) => void };

function AnswerText({ segs, words, num, onHot, onOpen }: AnswerProps) {
  let left = words;
  const out: ReactNode[] = [];
  segs.forEach((s, i) => {
    if (left <= 0) return;
    if (typeof s === 'string') {
      const parts = s.split(/(\s+)/);
      let txt = '';
      for (const p of parts) {
        if (!p.trim()) { txt += p; continue; }
        if (left <= 0) break;
        txt += p;
        left -= 1;
      }
      out.push(txt);
    } else if ('b' in s) {
      const ws = s.b.split(/\s+/);
      out.push(<b key={i}>{ws.slice(0, Math.max(0, left)).join(' ')}</b>);
      left -= ws.length;
    } else {
      left -= 1;
      const n = num.get(s.cite);
      out.push(
        <button key={i} className="ccite mono" onClick={() => onOpen(chunk(s.cite))}
          onMouseEnter={() => onHot(s.cite)} onMouseLeave={() => onHot(null)} onFocus={() => onHot(s.cite)} onBlur={() => onHot(null)}
          aria-label={`Citation ${n}: ${chunk(s.cite).title}`}>
          {n}
        </button>,
      );
    }
  });
  return <>{out}{words < wordsIn(segs) && <span className="cstream" aria-hidden="true" />}</>;
}

// ---------------------------------------------------------------------------

type CardProps = Actions & {
  c: Chunk; n: number; i: number; hit?: Hit; top: number[] | null; hot: boolean;
  onHot: (id: string | null) => void; refEl?: (el: HTMLElement | null) => void;
};

function Card({ c, n, i, hit, top, hot, onHot, refEl, onOpen, onCopy, tee }: CardProps) {
  const time = useClock(PROFILE.timezone);
  const maxBm = top ? Math.max(...top, 1e-6) : 1;
  const hit2 = c.kind === 'contact' && c.url && c.id !== 'c-local';
  return (
    <li ref={refEl} className={`ccard k-${c.kind}${hot ? ' hot' : ''}`} style={{ ['--i' as string]: i }}
      onMouseEnter={() => onHot(c.id)} onMouseLeave={() => onHot(null)}>
      {c.id === 'c-email' ? (
        <button className="ccard-hit" onClick={onCopy} aria-label={`Copy email address ${PROFILE.email}`} />
      ) : hit2 ? (
        <a className="ccard-hit" href={c.url} target="_blank" rel="noreferrer" aria-label={`${c.title}: ${c.text}`} />
      ) : (
        <button className="ccard-hit" onClick={() => onOpen(c)} aria-label={`Open ${c.title}`} />
      )}
      <span className="ccard-n mono">[{n}]</span>
      <div className="ccard-body">
        {c.photo && <img className="ccard-face" src={pose(tee, 'portrait')} alt="" />}
        <b className={`ccard-title${c.kind === 'metric' ? ' big' : ''}`}>
          {c.title}
          {c.tag && <em className="mono">{c.tag}</em>}
        </b>
        <span className="ccard-text">{c.id === 'c-local' ? `${time} IST · ${c.text}` : c.text}</span>
        {c.items && (
          <span className="ccard-chips">
            {c.items.map((t) => <span key={t}>{t}</span>)}
          </span>
        )}
      </div>
      <span className="ccard-side mono">
        {hit ? (
          <span className="cscore" title={`bm25 ${hit.bm25.toFixed(2)} · trigram cosine ${hit.tri.toFixed(2)} · rrf ${hit.rrf.toFixed(4)}`}>
            <i><b style={{ width: `${(hit.bm25 / maxBm) * 100}%` }} /></i>
            <i><b style={{ width: `${Math.min(1, hit.tri / 0.6) * 100}%` }} /></i>
            <em>{(hit.rrf * 1000).toFixed(1)}</em>
          </span>
        ) : c.id === 'c-email' ? 'copy' : hit2 ? <>open <ArrowUpRight size={10} /></> : `${tokensOf(c)} tok`}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Narrow screens: the same questions, one after another, no pinning.

function Steps(act: Actions) {
  const [asked, setAsked] = useState<View | null>(null);
  const [draft, setDraft] = useState('');
  const [hot, setHot] = useState<string | null>(null);
  const [all, setAll] = useState<Set<string>>(() => new Set());
  const ask = (q: string) => q.trim() && setAsked(askView(q.trim()));
  const more = (id: string) => setAll((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const jump = (cluster: string) => {
    const ch = CHAPTERS.find((c) => c.kinds.some((k) => clusterOf(k)?.id === cluster));
    if (ch) document.getElementById(`q-${ch.id}`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <div className="csteps wrap">
      <div className="csteps-map">
        <CorpusMap view={asked} phase="show" hot={hot} onHot={setHot} onOpen={act.onOpen} onCluster={jump} small />
        <p className="mono cmap-hint">tap a cluster to jump to its question</p>
      </div>
      <form className="cquery" role="search" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <label htmlFor="cq-m" className="mono">ask</label>
        <span className="cq-caret" aria-hidden="true">›</span>
        <input id="cq-m" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="a tool, a company, a skill…" autoComplete="off" spellCheck={false} />
        <button type="submit" className="mono">↵</button>
      </form>
      <p className="cmap-try mono">
        try
        {TRY.slice(0, 4).map((t) => <button key={t} onClick={() => { setDraft(t); ask(t); }}>{t}</button>)}
      </p>
      {asked && <Panel view={asked} phase="show" words={Infinity} hot={hot} onHot={setHot} {...act} />}
      {CHAPTERS.map((ch, i) => (
        <section key={ch.id} id={`q-${ch.id}`} className="cstep" aria-labelledby={`cstep-${ch.id}`}>
          <h3 id={`cstep-${ch.id}`} className="cstep-q"><span className="mono">0{i + 1}</span> <span className="cq-caret">›</span> {ch.q}</h3>
          <Panel view={chapterView(ch)} phase="show" words={Infinity} hot={hot} onHot={setHot} limit={all.has(ch.id) ? undefined : 3} onMore={() => more(ch.id)} {...act} />
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Inspector({ c, onClose, tee }: Actions & { c: Chunk; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [onClose]);
  const ref = c.src ? sourceIndex(c.src) : 0;
  return (
    <div className="cinsp" role="dialog" aria-modal="true" aria-labelledby="cinsp-t" onClick={onClose}>
      <article onClick={(e) => e.stopPropagation()}>
        <header className="mono">
          <span>{clusterOf(c.kind)?.label ?? 'Group'} · chunk {c.id} · {tokensOf(c)} tokens</span>
          <button ref={close} onClick={onClose}>close ✕</button>
        </header>
        {c.photo && <img className="cinsp-face" src={pose(tee, 'portrait')} alt="Close-up portrait of Vinay smiling, in glasses and a khaki cap" />}
        <h3 id="cinsp-t">{c.title}{c.tag && <em className="mono">{c.tag}</em>}</h3>
        {c.meta && <p className="mono cinsp-meta">{c.meta}</p>}
        <p className="cinsp-lead">{c.text}</p>
        {c.body && <p>{c.body}</p>}
        {!!c.notes?.length && <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
        {(c.stack || c.items) && <p className="ccard-chips">{(c.stack ?? c.items ?? []).map((t) => <span key={t}>{t}</span>)}</p>}
        <footer>
          {c.url && <a className="btn solid" href={c.url} target="_blank" rel="noreferrer">{c.url.includes('github.com') ? 'Read the source' : 'Open'} <ArrowUpRight /></a>}
          {c.live && <a className="btn" href={c.live} target="_blank" rel="noreferrer">Live demo <ArrowUpRight /></a>}
          {ref > 0 && <a className="mono cinsp-ref" href={`#ref-${ref}`} onClick={onClose}>source [{ref}] {SOURCES[ref - 1].label}</a>}
        </footer>
      </article>
    </div>
  );
}
