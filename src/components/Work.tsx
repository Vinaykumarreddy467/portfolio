import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data';
import { finePointer } from '../hooks';
import { Motif } from './Motif';
import { ArrowUpRight, Cite, Plus, SectionHead } from './ui';

export function Work() {
  const [open, setOpen] = useState<string | null>(PROJECTS[0].id);
  const [hover, setHover] = useState<string | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, r: 0 });

  // Floating preview card that trails the cursor (desktop only).
  useEffect(() => {
    if (!finePointer()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => { pos.current.tx = e.clientX; pos.current.ty = e.clientY; };
    const tick = () => {
      const p = pos.current;
      const dx = p.tx - p.x;
      p.x += dx * 0.12;
      p.y += (p.ty - p.y) * 0.12;
      p.r += (Math.max(-12, Math.min(12, dx * 0.15)) - p.r) * 0.1;
      const el = floatRef.current;
      if (el) {
        el.style.left = `${p.x + 190}px`;
        el.style.top = `${p.y}px`;
        el.style.setProperty('--r', `${p.r}deg`);
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); };
  }, []);

  const hovered = PROJECTS.find((p) => p.id === hover && p.id !== open);

  return (
    <section className="section" id="work" aria-labelledby="work-title">
      <div className="wrap">
        <SectionHead
          idx="01"
          kicker={`Selected work · ${PROJECTS.length}`}
          lede="Grounded retrieval, agent graphs, memory for coding agents, and the boring-but-critical infrastructure underneath. Open any row for the full story."
        >
          <span id="work-title">Things I've <span className="serif">shipped,</span> with receipts.</span>
        </SectionHead>

        <ul className="work-list" onPointerLeave={() => setHover(null)}>
          {PROJECTS.map((p, i) => {
            const isOpen = open === p.id;
            return (
              <li key={p.id} className={`work-row${isOpen ? ' open' : ''}`} data-reveal style={{ ['--d' as string]: `${i * 0.04}s` }}>
                <button
                  className="work-btn"
                  aria-expanded={isOpen}
                  aria-controls={`panel-${p.id}`}
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  onPointerEnter={() => setHover(p.id)}
                  data-cursor={isOpen ? 'close' : 'open'}
                >
                  <span className="w-n">{p.n}</span>
                  <span className="w-title">{p.title}{p.tag && <span className="w-tag">{p.tag}</span>}</span>
                  <span className="w-hook">{p.hook}</span>
                  <span className="w-metric"><b>{p.metric.value}</b><span>{p.metric.label}</span></span>
                  <span className="w-plus"><Plus /></span>
                </button>
                <div className="w-panel" id={`panel-${p.id}`} role="region" aria-label={p.title}>
                  <div>
                    <div className="w-panel-in">
                      <div className="body">
                        <p>{p.body}<Cite id={p.id} sm /></p>
                        <div className="stack">{p.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
                        <div className="links">
                          <a className="btn" href={p.url} target="_blank" rel="noreferrer" data-cursor="source" data-magnetic tabIndex={isOpen ? 0 : -1}>
                            Read the source <ArrowUpRight />
                          </a>
                          <span className="mono mute">{p.metric.value} · {p.metric.label}</span>
                        </div>
                      </div>
                      <div className="viz"><Motif kind={p.motif} /></div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div ref={floatRef} className={`w-float${hovered ? ' show' : ''}`} aria-hidden="true">
        {hovered && <><Motif kind={hovered.motif} /><span className="lbl">fig. {hovered.n} · {hovered.title}</span></>}
      </div>
    </section>
  );
}
