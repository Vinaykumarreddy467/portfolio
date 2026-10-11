import { useEffect, useRef, useState } from 'react';
import { finePointer, reducedMotion } from '../hooks';

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [enabled] = useState(() => finePointer() && !reducedMotion());

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-cursor');
    const p = { x: -100, y: -100, rx: -100, ry: -100 };
    let raf = 0;
    const el = ref.current!;

    let mag: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      // magnetic pull toward [data-magnetic] elements
      const m = (e.target as Element | null)?.closest?.('[data-magnetic]') as HTMLElement | null;
      if (mag && mag !== m) mag.style.transform = '';
      mag = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.38;
        m.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      el.classList.remove('gone');
      const t = (e.target as Element | null)?.closest?.('[data-cursor], a, button') as HTMLElement | null;
      const l = t?.dataset.cursor ?? '';
      el.classList.toggle('hover', !!l);
      el.classList.toggle('link', !l && !!t);
      setLabel(l);
    };
    const onDown = () => el.classList.add('down');
    const onUp = () => el.classList.remove('down');
    const onLeave = () => el.classList.add('gone');

    const tick = () => {
      p.rx += (p.x - p.rx) * 0.2;
      p.ry += (p.y - p.ry) * 0.2;
      dot.current!.style.transform = `translate(${p.x}px, ${p.y}px)`;
      ring.current!.style.transform = `translate(${p.rx}px, ${p.ry}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={ref} className="cursor gone" aria-hidden="true">
      <div ref={ring} style={{ position: 'absolute' }}><div className="cursor-ring"><span>{label}</span></div></div>
      <div ref={dot} style={{ position: 'absolute' }}><div className="cursor-dot" /></div>
    </div>
  );
}
