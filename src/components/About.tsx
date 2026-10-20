import { useCallback, useEffect, useRef, useState } from 'react';
import { FRAMES, PROFILE, TEES, asset, pose, type Pose } from '../data';
import { SectionHead } from './ui';

// Guide lines on the turnaround, as a % of the 820-unit frame height.
const GUIDES = [
  { k: 'cap', y: 3.7 },
  { k: 'eyes', y: 14.6 },
  { k: 'chin', y: 21 },
  { k: 'shoulders', y: 27.4 },
  { k: 'hands', y: 71.5 },
];

function Lightbox({ index, onClose, onNav }: { index: number | null; onClose: () => void; onNav: (d: number) => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    close.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNav(1);
      else if (e.key === 'ArrowLeft') onNav(-1);
      else if (e.key === 'Tab') { e.preventDefault(); close.current?.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = ''; restore.current?.focus?.(); };
  }, [open, onClose, onNav]);

  if (!open) return null;
  const f = FRAMES[index];
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={`Original photo: ${f.label}`} onClick={onClose}>
      <figure className="lb-in" onClick={(e) => e.stopPropagation()}>
        <img key={f.id} src={asset(`img/photo/${f.id}.webp`)} alt={f.alt} />
        <figcaption className="mono">
          <span><b>{f.code}</b> · {f.label} · original, undyed</span>
          <span className="lb-nav">
            <button onClick={() => onNav(-1)} aria-label="Previous photo">←</button>
            <span>{index + 1} / {FRAMES.length}</span>
            <button onClick={() => onNav(1)} aria-label="Next photo">→</button>
            <button ref={close} onClick={onClose} className="lb-x">Close</button>
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

export function About({ tee }: { tee: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hot, setHot] = useState<Pose | null>(null);
  const t = TEES.find((x) => x.id === tee) ?? TEES[0];
  const turn = FRAMES.slice(0, 3);
  const heads = FRAMES.slice(3);

  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + FRAMES.length) % FRAMES.length)), []);

  // A render helper, not a component: a component defined here would remount (and reload) on every hover.
  const renderPose = (i: number, cls: string) => {
    const f = FRAMES[i];
    return (
      <button
        key={f.id}
        className={`pose ${cls}${hot && hot !== f.id ? ' dim' : ''}`}
        onClick={() => setOpen(i)}
        onPointerEnter={() => setHot(f.id)}
        onPointerLeave={() => setHot(null)}
        onFocus={() => setHot(f.id)}
        onBlur={() => setHot(null)}
        aria-label={`${f.code}, ${f.label}. Open the original photo.`}
        data-cursor="view"
      >
        <span className="pose-img"><img src={pose(tee, f.id)} alt={f.alt} loading="lazy" draggable={false} /></span>
        <span className="pose-cap mono"><b>{f.code}</b>{f.label}{f.deg && <i>{f.deg}</i>}</span>
      </button>
    );
  };

  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead
          idx="02"
          kicker="About · model sheet"
          lede={<>{PROFILE.mission} Animators draw a character from every angle before they animate it. Here's mine. Pick a pose to see the original photo.</>}
        >
          <span id="about-title">One engineer, <span className="serif">every angle.</span></span>
        </SectionHead>

        <div className="sheet" data-reveal>
          <div className="sheet-bar mono">
            <span><b>Model sheet</b> · VKR-01</span>
            <span>Subject · {PROFILE.short}</span>
            <span>Tee · <i style={{ background: t.swatch }} />{t.name}</span>
            <span>Scale · 1 : 1, all angles</span>
          </div>

          <div className="sheet-body">
            <div className="sheet-turn">
              <div className="guide-box" aria-hidden="true">
                {GUIDES.map((g, i) => (
                  <span key={g.k} className="guide" style={{ top: `${g.y}%`, ['--d' as string]: `${0.2 + i * 0.12}s` }}>
                    <span className="guide-k mono">{g.k}</span>
                  </span>
                ))}
              </div>
              {turn.map((_, i) => renderPose(i, 'full'))}
            </div>

            <div className="sheet-heads">
              {heads.map((_, i) => renderPose(i + 3, 'head'))}
            </div>
          </div>
        </div>

        <dl className="facts" data-reveal>
          <div><dt className="mono">Role</dt><dd>{PROFILE.role}</dd></div>
          <div><dt className="mono">Now</dt><dd>{PROFILE.current}</dd></div>
          <div><dt className="mono">Based in</dt><dd>{PROFILE.location}</dd></div>
          <div><dt className="mono">Open to</dt><dd>{PROFILE.openTo}</dd></div>
        </dl>
      </div>

      <Lightbox index={open} onClose={close} onNav={nav} />
    </section>
  );
}
