import { useEffect, useState } from 'react';
import { FRAMES, asset } from '../data';

const LINES = [
  ['loading', '5 angles'],
  ['cutting out', 'the backgrounds'],
  ['dyeing', 'one tee, four colours'],
  ['grounding', 'every claim → a source'],
];

/** Contact-sheet intro: the five original frames flash past while the counter runs. */
export function Loader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const dur = 1700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setOut(true);
        setTimeout(onDone, 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const idx = Math.min(FRAMES.length - 1, Math.floor(n / (100 / FRAMES.length)));
  return (
    <div className={`loader${out ? ' out' : ''}`} role="status" aria-label="Loading">
      <div className="loader-lines">
        {LINES.map(([a, b], i) => (
          <span key={a} style={{ animationDelay: `${0.1 + i * 0.28}s` }}>
            &gt; {a} <b>{b}</b>
          </span>
        ))}
      </div>
      <div className="loader-shots" aria-hidden="true">
        {FRAMES.map((f, i) => (
          <img key={f.id} src={asset(`img/photo/${f.id}.webp`)} alt="" className={i === idx ? 'on' : i < idx ? 'past' : ''} />
        ))}
        <span className="mono">{FRAMES[idx].code} · {FRAMES[idx].label}</span>
      </div>
      <div className="loader-count">
        <span className="mono mute">Vinay Kumar Reddy<br />Gen AI Engineer</span>
        <strong>{String(n).padStart(3, '0')}</strong>
      </div>
      <div className="loader-bar" style={{ width: `${n}%` }} />
    </div>
  );
}
