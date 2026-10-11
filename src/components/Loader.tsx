import { useEffect, useState } from 'react';

const LINES = [
  ['indexing', '48 repositories'],
  ['embedding', '2,200+ accessible pages'],
  ['ranking', 'dense ⊕ sparse via RRF'],
  ['grounding', 'every claim → a source'],
];

export function Loader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const dur = 1500;
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

  return (
    <div className={`loader${out ? ' out' : ''}`} role="status" aria-label="Loading">
      <div className="loader-lines">
        {LINES.map(([a, b], i) => (
          <span key={a} style={{ animationDelay: `${0.1 + i * 0.28}s` }}>
            &gt; {a} <b>{b}</b>
          </span>
        ))}
      </div>
      <div className="loader-count">
        <span className="mono mute">Vinay Kumar Reddy<br />Gen AI Engineer</span>
        <strong>{String(n).padStart(3, '0')}</strong>
      </div>
      <div className="loader-bar" style={{ width: `${n}%` }} />
    </div>
  );
}
