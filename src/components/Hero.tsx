import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from 'react';
import { ABILITIES, PROFILE, TEES } from '../data';
import { finePointer, reducedMotion, useClock } from '../hooks';
import type { Fig3D } from './Figure3D';
import { Figure, preloadTee, useTurntable } from './Turntable';
import { Arrow, Cite } from './ui';

// three.js only loads when the browser can run it; until then (or instead) the 2D photo turntable shows.
const Figure3D = lazy(() => import('./Figure3D'));
const canWebGL2 = () => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};
/** Desktop with motion allowed: the hero pins and scrolling scrubs the turnaround. */
const pinnable = () => typeof window !== 'undefined' && matchMedia('(min-width: 1101px) and (prefers-reduced-motion: no-preference)').matches;

type Props = { tee: string; onTee: (id: string) => void; onCopy: () => void; ready: boolean };

// Stage coordinates: the figure is 520×820 at x=0; labels sit in the 340 units to its right.
const NOTES = [
  { id: 'cap', at: [265, 45], y: 50, k: 'cap', text: <>Thinking cap: <b>RAG · agents · MCP</b></> },
  { id: 'lens', at: [305, 117], y: 145, k: 'lenses', text: <>Reads the source <b>before</b> answering<Cite id="kbms" sm /></> },
  { id: 'chest', at: [327, 330], y: 330, k: 'core', text: <>Backend at heart: <b>Spring Boot · FastAPI</b></> },
  { id: 'watch', at: [428, 608], y: 600, k: 'watch', text: null },
] as const;

function Dial({ ring }: { ring: RefObject<SVGGElement | null> }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="198" className="dial-face" />
      <g className="dial-ring" ref={ring}>
        {ticks.map((a) => {
          const long = a % 45 === 0;
          return (
            <line
              key={a}
              x1="200" y1={long ? 14 : 8} x2="200" y2={long ? 34 : 18}
              className={long ? 'dial-tick long' : 'dial-tick'}
              transform={`rotate(${a} 200 200)`}
            />
          );
        })}
        {[0, 90, 180, 270].map((a) => (
          <text key={a} x="200" y="52" className="dial-num" transform={`rotate(${a} 200 200)${a === 180 ? ' rotate(180 200 48)' : ''}`}>{String(a).padStart(3, '0')}</text>
        ))}
        <circle cx="200" cy="200" r="150" className="dial-inner" />
      </g>
      <path d="M200 2 l7 12 h-14z" className="dial-pointer" />
    </svg>
  );
}

function Rotator({ words, every = 2600 }: { words: string[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), every);
    return () => clearInterval(id);
  }, [words.length, every]);
  return (
    <span className="rot serif" aria-hidden="true">
      <span key={i} className="rot-in">
        {words[i].split('').map((c, k) => (
          <span key={k} style={{ ['--k' as string]: k }}>{c === ' ' ? ' ' : c}</span>
        ))}
      </span>
    </span>
  );
}

export function Wardrobe({ tee, onTee }: { tee: string; onTee: (id: string) => void }) {
  const cur = TEES.find((t) => t.id === tee) ?? TEES[0];
  return (
    <div className="wardrobe">
      <span className="mono mute" id="wardrobe-label">Dye the tee</span>
      <div className="swatches" role="radiogroup" aria-labelledby="wardrobe-label">
        {TEES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={t.id === tee}
            aria-label={t.name}
            className="swatch"
            style={{ ['--sw' as string]: t.swatch }}
            onPointerEnter={() => preloadTee(t.id)}
            onFocus={() => preloadTee(t.id)}
            onClick={() => onTee(t.id)}
            data-cursor="dye"
          />
        ))}
      </div>
      <span className="mono wardrobe-name">{cur.name}</span>
    </div>
  );
}

export function Hero({ tee, onTee, onCopy, ready }: Props) {
  const hero = useRef<HTMLElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGGElement>(null);
  const readDeg = useRef<HTMLElement>(null);
  const readLabel = useRef<HTMLElement>(null);
  const ctl = useRef<Fig3D>({ yaw: 0, pitch: 0, zoom: 0, lx: 0, ly: 0 });
  const time = useClock(PROFILE.timezone);
  const [want3d] = useState(canWebGL2);
  const [pin] = useState(pinnable);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [failed, setFailed] = useState(false);
  const use3d = want3d && !failed;
  // with 3D coming, hold the intro spin until the model is up, so he only spins once
  const tt = useTurntable({
    ctl, dial: ring, readDeg, readLabel,
    autoSpin: ready && (!use3d || mode === '3d'),
    lookAmp: mode === '3d' ? 16 : 44,
  });
  const { look, setScroll } = tt;
  const swatch = TEES.find((t) => t.id === tee)?.swatch ?? TEES[0].swatch;

  // Pointer depth (--px/--py), and the figure turning toward the pointer.
  useEffect(() => {
    const el = hero.current;
    if (!el || !finePointer()) return;
    const still = reducedMotion();
    const t = { x: 0, y: 0 };
    const c = { x: 0, y: 0 };
    let raf = 0;
    const tick = () => {
      c.x += (t.x - c.x) * 0.08;
      c.y += (t.y - c.y) * 0.08;
      el.style.setProperty('--px', c.x.toFixed(4));
      el.style.setProperty('--py', c.y.toFixed(4));
      raf = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf && !still) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      t.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      t.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
      const f = fig.current?.getBoundingClientRect();
      if (f && e.pointerType === 'mouse') look((e.clientX - (f.left + f.width / 2)) / (f.width * 1.2), ((e.clientY - f.top) / f.height) * 2 - 1);
    };
    const onLeave = () => { t.x = 0; t.y = 0; kick(); look(0, 0); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); cancelAnimationFrame(raf); };
  }, [look]);

  // Scroll: --sp drives the exit parallax. On a pinned desktop hero it also scrubs the
  // turnaround: the camera pulls back to the full figure while he makes one full turn.
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = hero.current;
        if (!el) return;
        const pin = pinnable();
        const span = el.offsetHeight - innerHeight;
        const p = pin && span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : Math.min(1, scrollY / innerHeight);
        el.style.setProperty('--sp', p.toFixed(4));
        el.style.setProperty('--zoom', (pin && use3d ? p : 0).toFixed(4));
        setScroll(pin ? p : 0);
      });
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [setScroll, use3d]);

  const showNotes = ready && tt.introDone && tt.still;

  return (
    <section className="hero" id="top" ref={hero} aria-label="Introduction">
      <div className="hero-pin">
      <div className="hero-dial"><Dial ring={ring} /></div>

      <div className="name-wrap">
        <h1 className="hero-name">
          <span aria-hidden="true">
            {'VINAY'.split('').map((c, i) => <span key={i} style={{ ['--i' as string]: i }}>{c}</span>)}
          </span>
          <span className="sr-only">{PROFILE.name}, {PROFILE.role}</span>
        </h1>
        {/* Outline copy in front of the figure, so his head never hides a letter. */}
        <div className="hero-name ghost" aria-hidden="true">
          <span>{'VINAY'.split('').map((c, i) => <span key={i} style={{ ['--i' as string]: i }}>{c}</span>)}</span>
        </div>
      </div>

      <div className="stage">
        <div className={`fig-box${mode === '3d' ? ' is-3d' : ''}`} ref={fig}>
          <Figure tee={tee} facing={tt.facing} />
          {use3d && (
            <Suspense fallback={null}>
              <Figure3D tee={tee} accent={swatch} ctl={ctl} onReady={() => setMode('3d')} onFail={() => { setFailed(true); setMode('2d'); }} />
            </Suspense>
          )}
          <button
            className="fig-hit"
            aria-label={`${mode === '3d' ? '3D model of Vinay' : 'Photo of Vinay'}, facing ${tt.facing === 'front' ? 'front' : tt.facing === 'back' ? 'back' : 'three-quarter'}. Drag, or use the arrow keys, to turn him around.`}
            data-cursor="drag"
            {...tt.bind}
          />
        </div>
      </div>

      <div className="stage stage-notes">
        <div className={`notes${showNotes ? ' show' : ''}`} aria-hidden={!showNotes}>
          <svg viewBox="0 0 860 820" preserveAspectRatio="none" aria-hidden="true">
            {NOTES.map((n, i) => (
              <g key={n.id} style={{ ['--d' as string]: `${0.1 + i * 0.12}s` }}>
                <path className="note-line" pathLength={1} d={`M${n.at[0]} ${n.at[1]} L${n.at[0] + 80} ${n.y} L560 ${n.y}`} />
                <circle className="note-dot" cx={n.at[0]} cy={n.at[1]} r="4" />
                <circle className="note-ping" cx={n.at[0]} cy={n.at[1]} r="4" />
              </g>
            ))}
          </svg>
          {NOTES.map((n, i) => (
            <p key={n.id} className="note" style={{ top: `${(n.y / 820) * 100}%`, ['--d' as string]: `${0.35 + i * 0.12}s` }}>
              <span className="mono">0{i + 1} / {n.k}</span>
              <span>{n.text ?? <>Running on <b>BLR {time}</b> IST</>}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="hero-ui wrap">
        <div className="hero-top">
          <p className="mono mute hero-meta">{PROFILE.role}<br />{PROFILE.location}</p>
          <span className="status mono"><span className="dot" aria-hidden="true" /> Open to {PROFILE.openTo}</span>
        </div>

        <div className="hero-bottom">
          <div className="hero-copy">
            <p className="hero-line">
              <span className="hl-a">I build AI that</span>
              <Rotator words={ABILITIES} />
              <span className="sr-only">cites its sources, reasons in graphs, remembers context and measures itself.</span>
            </p>
            <p className="hero-sub">
              Hybrid-search RAG, <strong>LangGraph</strong> multi-agent pipelines and <strong>MCP</strong> servers,
              with Spring Boot and FastAPI behind them. Currently <strong>{PROFILE.current}</strong>.
            </p>
            <div className="hero-cta">
              <a className="btn solid" href="#work" data-cursor="view" data-magnetic>See the work <Arrow /></a>
              <button className="btn" onClick={onCopy} data-cursor="copy" data-magnetic>Copy email</button>
            </div>
            <Wardrobe tee={tee} onTee={onTee} />
          </div>

          <div className="hero-readout mono">
            <span><span className="mute">{mode === '3d' ? '3D · facing' : 'Facing'}</span> <b ref={readDeg}>000°</b> <span className="mute">· <span ref={readLabel}>front</span></span></span>
            <span className="hint">
              <button onClick={() => tt.step(-1)} aria-label="Turn left">←</button>
              <span>{mode === '3d' ? (pin ? 'drag to orbit · scroll to turn' : 'drag to orbit') : 'drag or tap him'}</span>
              <button onClick={() => tt.step(1)} aria-label="Turn right">→</button>
            </span>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
