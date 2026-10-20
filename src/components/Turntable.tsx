import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MutableRefObject, type PointerEvent, type RefObject } from 'react';
import { modelTex, pose } from '../data';
import { reducedMotion } from '../hooks';

/** Four facings from three photos: the three-quarter shot, mirrored, covers the other side. */
export type Facing = 'front' | 'right' | 'back' | 'left';
const RING: Facing[] = ['front', 'right', 'back', 'left'];
const DEG: Record<Facing, number> = { front: 0, right: 40, back: 180, left: 320 };

const srcFor = (tee: string, f: Facing) => pose(tee, f === 'right' || f === 'left' ? 'angle' : f);

export function preloadTee(tee: string) {
  return Promise.all(
    [...(['front', 'angle', 'back'] as const).map((p) => pose(tee, p)), modelTex(tee, 'front'), modelTex(tee, 'back')].map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    }),
  );
}

const REST = [0, 45, 135, 180, 225, 315]; // never come to rest side-on
const norm = (a: number) => ((a % 360) + 360) % 360;
const delta = (a: number, b: number) => ((b - a + 540) % 360) - 180; // signed shortest a → b
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Nearest photo to an angle, for the 2D fallback. */
const facingAt = (a: number): Facing =>
  (Object.keys(DEG) as Facing[]).reduce((best, f) => (Math.abs(delta(a, DEG[f])) < Math.abs(delta(a, DEG[best])) ? f : best), 'front');

export const angleLabel = (a: number) => {
  const d = Math.abs(delta(0, a));
  return d < 22.5 ? 'front' : d < 67.5 ? 'three-quarter' : d < 112.5 ? 'profile' : d < 157.5 ? 'back three-quarter' : 'back';
};

type Drive = { yaw: number; pitch: number; zoom: number; lx: number; ly: number };
type Opts = {
  ctl: MutableRefObject<Drive>;
  autoSpin: boolean;
  lookAmp: number; // how far he turns toward the pointer, in degrees
  dial: RefObject<SVGGElement | null>;
  readDeg: RefObject<HTMLElement | null>;
  readLabel: RefObject<HTMLElement | null>;
};

/**
 * Continuous turntable physics: drag with inertia, settle on a good angle, tween spins and steps,
 * lean toward the pointer, and add the scroll scrub on top. Writes `ctl` every frame for the 3D
 * figure and only re-renders React when the nearest photo or the at-rest state changes.
 */
export function useTurntable({ ctl, autoSpin, lookAmp, dial, readDeg, readLabel }: Opts) {
  const [facing, setFacing] = useState<Facing>('front');
  const [still, setStill] = useState(true);
  const [busy, setBusy] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const st = useRef({
    yaw: 0, vel: 0, settle: false,
    drag: false, x: 0, moved: 0,
    tween: null as null | { from: number; to: number; t0: number; dur: number },
    lx: 0, ly: 0, lookYaw: 0, pitch: 0, scroll: 0,
    facing: 'front' as Facing, still: true, busy: false, intro: false,
  });
  const amp = useRef(lookAmp);
  amp.current = lookAmp;

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const s = st.current;
      if (s.tween) {
        const p = Math.min(1, (now - s.tween.t0) / s.tween.dur);
        s.yaw = s.tween.from + (s.tween.to - s.tween.from) * easeIO(p);
        if (p >= 1) {
          s.tween = null;
          if (s.intro) { s.intro = false; setIntroDone(true); }
        }
      } else if (!s.drag) {
        if (Math.abs(s.vel) > 0.04) { s.yaw += s.vel; s.vel *= 0.94; }
        else if (s.settle) {
          const r = REST.reduce((b, x) => (Math.abs(delta(s.yaw, x)) < Math.abs(delta(s.yaw, b)) ? x : b));
          const d = delta(s.yaw, r);
          s.yaw += d * 0.07;
          if (Math.abs(d) < 0.05) { s.yaw += d; s.settle = false; }
        }
      }
      const free = !s.drag && !s.tween;
      s.lookYaw += ((free ? s.lx * amp.current : 0) - s.lookYaw) * 0.06;
      s.pitch += ((free ? -s.ly * 4 : 0) - s.pitch) * 0.06;
      const sc = easeIO(s.scroll);
      const yaw = s.yaw + s.lookYaw + sc * 360;
      ctl.current.yaw = yaw;
      ctl.current.pitch = s.pitch;
      ctl.current.zoom = sc;
      ctl.current.lx = s.lx;
      ctl.current.ly = s.ly;

      const a = norm(yaw);
      if (dial.current) dial.current.style.transform = `rotate(${-yaw}deg)`;
      if (readDeg.current) readDeg.current.textContent = `${String(Math.round(a) % 360).padStart(3, '0')}°`;
      if (readLabel.current) readLabel.current.textContent = angleLabel(a);

      const f = facingAt(a);
      if (f !== s.facing) { s.facing = f; setFacing(f); }
      const atRest = free && Math.abs(s.vel) < 0.04 && !s.settle && Math.abs(delta(0, a)) < 9 && sc < 0.03;
      if (atRest !== s.still) { s.still = atRest; setStill(atRest); }
      const b = !!s.tween || s.drag;
      if (b !== s.busy) { s.busy = b; setBusy(b); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ctl, dial, readDeg, readLabel]);

  const tweenTo = useCallback((to: number, dur: number) => {
    const s = st.current;
    s.vel = 0;
    s.settle = false;
    s.tween = { from: s.yaw, to, t0: performance.now(), dur: reducedMotion() ? 1 : dur };
  }, []);

  /** One full revolution. */
  const spin = useCallback((dir: -1 | 1 = 1) => {
    const s = st.current;
    if (s.tween) return;
    const base = s.yaw + delta(s.yaw, REST.reduce((b, x) => (Math.abs(delta(s.yaw, x)) < Math.abs(delta(s.yaw, b)) ? x : b)));
    tweenTo(base + dir * 360, 1500);
  }, [tweenTo]);

  /** To the next 45° mark. */
  const step = useCallback((dir: -1 | 1) => {
    const s = st.current;
    const from = s.tween ? s.tween.to : s.yaw;
    tweenTo(dir > 0 ? Math.floor(from / 45 + 1e-6) * 45 + 45 : Math.ceil(from / 45 - 1e-6) * 45 - 45, 480);
  }, [tweenTo]);

  /** Pointer position: x is the offset from the figure in figure-widths (clamped), y is -1…1 over the hero. */
  const look = useCallback((x: number, y: number) => {
    st.current.lx = Math.max(-1, Math.min(1, x));
    st.current.ly = Math.max(-1, Math.min(1, y));
  }, []);

  const setScroll = useCallback((p: number) => { st.current.scroll = p; }, []);

  useEffect(() => {
    if (!autoSpin) return;
    if (reducedMotion()) { setIntroDone(true); return; }
    const id = window.setTimeout(() => { st.current.intro = true; spin(1); }, 350);
    return () => clearTimeout(id);
  }, [autoSpin, spin]);

  const bind = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      const s = st.current;
      s.drag = true; s.x = e.clientX; s.moved = 0; s.vel = 0; s.tween = null;
      if (s.intro) { s.intro = false; setIntroDone(true); } // grabbed mid-intro: the intro is over
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const s = st.current;
      if (!s.drag) return;
      const dx = e.clientX - s.x;
      s.x = e.clientX;
      s.moved += Math.abs(dx);
      s.yaw += dx * 0.5;
      s.vel = s.vel * 0.5 + dx * 0.25;
    },
    onPointerUp: () => {
      const s = st.current;
      s.drag = false;
      s.settle = true;
      if (reducedMotion()) s.vel = 0;
      if (s.moved < 6) spin(1);
    },
    onPointerCancel: () => { st.current.drag = false; st.current.settle = true; },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    },
    onClick: (e: { detail: number }) => { if (e.detail === 0) spin(1); }, // keyboard Enter / Space
  };

  return { facing, still, busy, introDone, spin, step, look, setScroll, bind };
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
