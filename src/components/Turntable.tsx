import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { pose } from '../data';
import { reducedMotion } from '../hooks';

/** Four facings from three photos: the three-quarter shot, mirrored, covers the other side. */
export type Facing = 'front' | 'right' | 'back' | 'left';
const RING: Facing[] = ['front', 'right', 'back', 'left'];
const DEG: Record<Facing, number> = { front: 0, right: 40, back: 180, left: 320 };
export const FACING_LABEL: Record<Facing, string> = { front: 'front', right: 'three-quarter', back: 'back', left: 'three-quarter, mirrored' };

const srcFor = (tee: string, f: Facing) => pose(tee, f === 'right' || f === 'left' ? 'angle' : f);

export function preloadTee(tee: string) {
  return Promise.all(
    (['front', 'angle', 'back'] as const).map((p) => {
      const img = new Image();
      img.src = pose(tee, p);
      return img.decode().catch(() => undefined);
    }),
  );
}

/**
 * Turntable state: which way the figure faces, and a cumulative angle for the dial
 * (cumulative so a full spin animates 0 → 360 instead of snapping back).
 */
export function useTurntable(autoSpin: boolean) {
  const [facing, setFacing] = useState<Facing>('front');
  const [deg, setDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const cur = useRef<Facing>('front');
  const total = useRef(0);
  const busy = useRef(false);
  const hold = useRef(0);
  const drag = useRef({ on: false, x: 0, acc: 0, moved: 0 });
  const timers = useRef<number[]>([]);

  const go = useCallback((next: Facing, dir: -1 | 0 | 1 = 0) => {
    const prev = cur.current;
    if (prev === next) return;
    let d = DEG[next] - DEG[prev];
    if (dir === 1) d = ((d % 360) + 360) % 360;
    else if (dir === -1) d = -((((-d) % 360) + 360) % 360);
    else d = ((d + 540) % 360) - 180;
    total.current += d;
    cur.current = next;
    setDeg(total.current);
    setFacing(next);
  }, []);

  const step = useCallback((dir: -1 | 1) => {
    hold.current = performance.now() + 2200; // a deliberate turn outranks pointer-looking for a moment
    go(RING[(RING.indexOf(cur.current) + dir + 4) % 4], dir);
  }, [go]);

  /** One full revolution, easing out like a turntable winding down. */
  const spin = useCallback((dir: -1 | 1 = 1) => {
    if (busy.current) return;
    if (reducedMotion()) { step(dir); return; }
    busy.current = true;
    setSpinning(true);
    let t = 0;
    [120, 140, 170, 230].forEach((ms, i, all) => {
      t += ms;
      timers.current.push(window.setTimeout(() => {
        step(dir);
        if (i === all.length - 1) { busy.current = false; setSpinning(false); }
      }, t));
    });
  }, [step]);

  /** Look toward the pointer: x is the pointer's offset from the figure, in figure-widths. */
  const look = useCallback((x: number) => {
    if (busy.current || drag.current.on || performance.now() < hold.current) return;
    go(x > 0.62 ? 'right' : x < -0.62 ? 'left' : 'front');
  }, [go]);

  useEffect(() => {
    if (!autoSpin) return;
    const id = window.setTimeout(() => spin(1), 900);
    return () => clearTimeout(id);
  }, [autoSpin, spin]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const bind = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      drag.current = { on: true, x: e.clientX, acc: 0, moved: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d.on || busy.current) return;
      const dx = e.clientX - d.x;
      d.x = e.clientX;
      d.acc += dx;
      d.moved += Math.abs(dx);
      while (Math.abs(d.acc) > 64) {
        // dragging right turns him to his left, like spinning a real turntable
        step(d.acc > 0 ? 1 : -1);
        d.acc -= Math.sign(d.acc) * 64;
      }
    },
    onPointerUp: () => {
      const d = drag.current;
      d.on = false;
      if (d.moved < 6) spin(1);
    },
    onPointerCancel: () => { drag.current.on = false; },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    },
    onClick: (e: { detail: number }) => { if (e.detail === 0) spin(1); }, // keyboard Enter / Space
  };

  return { facing, deg, spinning, step, spin, look, bind };
}

/**
 * The cut-out figure. Every facing is stacked and cross-faded; a tee change dyes the
 * new colour in from the hem up, over the old one.
 */
export function Figure({ tee, facing, className = '' }: { tee: string; facing: Facing; className?: string }) {
  const [shown, setShown] = useState(tee);
  const [next, setNext] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (tee === shown) { setNext(null); return; }
    let alive = true;
    preloadTee(tee).then(() => { if (alive) setNext(tee); });
    return () => { alive = false; };
  }, [tee, shown]);

  // A quick squash and blur sells the cut between photos as a turn.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reducedMotion()) return;
    box.current?.animate(
      [
        { transform: 'scaleX(1)', filter: 'blur(0)' },
        { transform: 'scaleX(0.92)', filter: 'blur(1.4px)', offset: 0.45 },
        { transform: 'scaleX(1)', filter: 'blur(0)' },
      ],
      { duration: 240, easing: 'cubic-bezier(.65,0,.35,1)' },
    );
  }, [facing]);

  const layer = (t: string) =>
    RING.map((f) => (
      <img
        key={f}
        className={`fig-img ${f}${f === facing ? ' on' : ''}`}
        src={srcFor(t, f)}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority={f === 'front' ? 'high' : 'auto'}
      />
    ));

  return (
    <div className={`fig-turn ${className}`} ref={box}>
      <div className="fig-layer">{layer(shown)}</div>
      {next && (
        <div
          className="fig-layer fig-dye"
          key={next}
          onAnimationEnd={() => { setShown(next); setNext(null); }}
        >
          {layer(next)}
        </div>
      )}
    </div>
  );
}
