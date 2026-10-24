import { SOURCES, sourceIndex } from '../data';

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
