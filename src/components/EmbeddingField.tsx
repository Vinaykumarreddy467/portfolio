import { useEffect, useRef } from 'react';
import { cssVar, reducedMotion } from '../hooks';

// The hero background: a 2-D "embedding space". The cursor is a query vector;
// lines are drawn to its k nearest neighbours, like a retriever doing its job.

const CLUSTERS = [
  { label: 'rag', x: 0.18, y: 0.28, s: 0.075 },
  { label: 'agents', x: 0.52, y: 0.2, s: 0.08 },
  { label: 'mcp', x: 0.84, y: 0.26, s: 0.06 },
  { label: 'evals', x: 0.7, y: 0.52, s: 0.07 },
  { label: 'spring-boot', x: 0.33, y: 0.55, s: 0.07 },
  { label: 'memory', x: 0.92, y: 0.62, s: 0.05 },
  { label: 'graph-rag', x: 0.07, y: 0.62, s: 0.05 },
  { label: 'a11y', x: 0.5, y: 0.78, s: 0.06 },
];

type P = { x: number; y: number; c: number; ph: number; r: number };

const gauss = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export function EmbeddingField({ theme }: { theme: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useRef({ fg: '#edeae3', accent: '#ff5420', mute: '#858178' });

  useEffect(() => {
    colors.current = { fg: cssVar('--fg'), accent: cssVar('--accent'), mute: cssVar('--mute') };
  }, [theme]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const still = reducedMotion();
    let w = 0, h = 0, dpr = 1;
    let pts: P[] = [];
    let raf = 0;
    let visible = true;
    const mouse = { x: 0, y: 0, active: false, last: 0 };
    const q = { x: 0, y: 0 };

    const build = () => {
      const n = w < 640 ? 200 : w < 1100 ? 360 : 540;
      pts = [];
      for (let i = 0; i < n; i++) {
        const ci = i % CLUSTERS.length;
        const c = CLUSTERS[ci];
        const noise = Math.random() < 0.12;
        pts.push({
          x: noise ? Math.random() : c.x + gauss() * c.s * (w > h ? 0.75 : 1),
          y: noise ? Math.random() : c.y + gauss() * c.s * (w > h ? 1.2 : 0.8),
          c: noise ? -1 : ci,
          ph: Math.random() * Math.PI * 2,
          r: Math.random() * 1.1 + 0.7,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      q.x = w * 0.62;
      q.y = h * 0.38;
    };

    const draw = (t: number) => {
      const { fg, accent, mute } = colors.current;
      ctx.clearRect(0, 0, w, h);

      // query target: mouse when active, otherwise a slow Lissajous wander
      const idle = !mouse.active || t - mouse.last > 4000;
      const tx = idle ? w * (0.55 + 0.3 * Math.sin(t * 0.00019)) : mouse.x;
      const ty = idle ? h * (0.4 + 0.22 * Math.sin(t * 0.00029 + 1.2)) : mouse.y;
      const k = still ? 1 : idle ? 0.02 : 0.14;
      q.x += (tx - q.x) * k;
      q.y += (ty - q.y) * k;

      const amp = still ? 0 : 5;
      const pos = pts.map((p) => ({
        x: p.x * w + Math.sin(t * 0.0004 + p.ph) * amp,
        y: p.y * h + Math.cos(t * 0.00033 + p.ph) * amp,
        p,
      }));

      // cluster labels
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = mute;
      ctx.globalAlpha = 0.55;
      for (const c of CLUSTERS) ctx.fillText(c.label, c.x * w, c.y * h - c.s * h * 1.9);

      // all points
      ctx.fillStyle = fg;
      for (const { x, y, p } of pos) {
        ctx.globalAlpha = p.c === -1 ? 0.14 : 0.3;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // k nearest neighbours
      const K = w < 640 ? 6 : 9;
      const ranked = pos
        .map((o) => ({ ...o, d: Math.hypot(o.x - q.x, o.y - q.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, K);

      ranked.forEach((o, i) => {
        const a = 1 - i / (K + 2);
        ctx.globalAlpha = a * 0.85;
        ctx.strokeStyle = accent;
        ctx.lineWidth = i < 3 ? 1.2 : 0.8;
        ctx.setLineDash(i < 3 ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(o.x, o.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(o.x, o.y, i < 3 ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (i < 3) {
          const sim = Math.max(0.5, 0.995 - o.d / 900).toFixed(3);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = fg;
          ctx.textAlign = 'left';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`${sim}`, o.x + 7, o.y - 6);
        }
      });

      // query crosshair
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(q.x - 22, q.y); ctx.lineTo(q.x - 8, q.y);
      ctx.moveTo(q.x + 8, q.y); ctx.lineTo(q.x + 22, q.y);
      ctx.moveTo(q.x, q.y - 22); ctx.lineTo(q.x, q.y - 8);
      ctx.moveTo(q.x, q.y + 8); ctx.lineTo(q.x, q.y + 22);
      ctx.stroke();

      const top = ranked[0]?.p.c ?? -1;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = accent;
      ctx.fillText(`q → top-${K}`, q.x + 20, q.y + 30);
      ctx.fillStyle = mute;
      ctx.fillText(top >= 0 ? `nearest: ${CLUSTERS[top].label}` : 'nearest: noise', q.x + 20, q.y + 43);
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (visible && !document.hidden) draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return (mouse.active = false);
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
      mouse.last = performance.now();
      if (still) draw(0);
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (still) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });

    if (still) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
