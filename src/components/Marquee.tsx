import { useEffect, useRef } from 'react';
import { STACK } from '../data';
import { reducedMotion } from '../hooks';

const PHRASES = ['retrieve', 'reason', 'cite', 'measure', 'ship', 'learn in public'];

// Scroll-reactive marquee: drifts on its own, and scrolling the page
// speeds it up, flips its direction and skews it with the scroll velocity.
export function Marquee() {
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let lastY = scrollY;
    let vel = 0;
    let dir = 1;
    const x = [0, 0];
    const tick = () => {
      const y = scrollY;
      const dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * 0.12;
      if (Math.abs(dy) > 1) dir = dy > 0 ? 1 : -1;
      const speed = 0.6 + Math.min(14, Math.abs(vel) * 0.35);
      rows.current.forEach((el, i) => {
        if (!el) return;
        const half = el.scrollWidth / 2;
        x[i] -= speed * dir * (i === 0 ? 1 : -0.8);
        if (x[i] <= -half) x[i] += half;
        if (x[i] > 0) x[i] -= half;
        const skew = Math.max(-8, Math.min(8, vel * 0.25));
        el.style.transform = `translate3d(${x[i]}px,0,0) skewX(${-skew}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const a = [...STACK, ...STACK];
  const b = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES];
  return (
    <div className="marquee" aria-label="Tools I work with">
      <div className="marquee-row" ref={(el) => { rows.current[0] = el; }}>
        {a.map((s, i) => <span key={i}>{s}<i aria-hidden="true">✳</i></span>)}
      </div>
      <div className="marquee-row rev" aria-hidden="true" ref={(el) => { rows.current[1] = el; }}>
        {b.map((s, i) => <span key={i}>{s}<i>→</i></span>)}
      </div>
    </div>
  );
}
