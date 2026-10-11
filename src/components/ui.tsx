import type { ReactNode } from 'react';
import { SOURCES, sourceIndex } from '../data';
import { Scramble } from './Scramble';

/** A footnote marker that links to the References list at the bottom of the page. */
export function Cite({ id, sm }: { id: string; sm?: boolean }) {
  const n = sourceIndex(id);
  const src = SOURCES[n - 1];
  return (
    <a className={`cite${sm ? ' sm' : ''}`} href={`#ref-${n}`} data-label={src.label} aria-label={`Source ${n}: ${src.label}`} data-cursor="cite">
      [{n}]
    </a>
  );
}

export function SectionHead({ idx, kicker, children, lede }: { idx: string; kicker: string; children: ReactNode; lede?: ReactNode }) {
  return (
    <header className="s-head">
      <div className="s-kicker">
        <span className="mono idx">({idx})</span>
        <Scramble className="mono mute" text={kicker} />
      </div>
      <div>
        <h2 className="s-title" data-reveal>{children}</h2>
        {lede && <p className="s-lede" data-reveal style={{ ['--d' as string]: '0.12s' }}>{lede}</p>}
      </div>
    </header>
  );
}

export const Arrow = ({ size = 14, className = 'arr' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpRight = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5 11l6-6M6 5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Splits text into masked lines that slide up on reveal. */
export function Lines({ lines, base = 0, step = 0.08 }: { lines: ReactNode[]; base?: number; step?: number }) {
  return (
    <>
      {lines.map((l, i) => (
        <span className="mask" key={i}>
          <span style={{ ['--d' as string]: `${base + i * step}s` }}>{l}</span>
        </span>
      ))}
    </>
  );
}
