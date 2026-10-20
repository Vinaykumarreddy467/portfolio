import { useEffect, useState } from 'react';
import { PROFILE, asset } from '../data';
import { useClock } from '../hooks';

export const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'method', label: 'Method' },
  { id: 'journey', label: 'Journey' },
  { id: 'toolbox', label: 'Toolbox' },
  { id: 'proof', label: 'Proof' },
  { id: 'contact', label: 'Contact' },
];

type Props = { theme: string; onTheme: () => void; onPalette: () => void };

export function Nav({ theme, onTheme, onPalette }: Props) {
  const time = useClock(PROFILE.timezone);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 600 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <header className={`nav${scrolled ? ' scrolled' : ''}${hidden && !open ? ' hidden' : ''}`}>
        <div className="wrap nav-in">
          <a href="#top" className="brand" aria-label="Back to top" data-cursor="top">
            <img className="brand-mark" src={asset('img/avatar.webp')} alt="" width="38" height="38" />
            <span className="brand-txt">
              <b>{PROFILE.short}</b>
              <span>{PROFILE.role}</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Sections">
            {SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''}>
                {s.label}<sup>0{i + 1}</sup>
              </a>
            ))}
          </nav>

          <div className="nav-tools">
            <span className="clock" aria-label={`Local time in Bengaluru ${time}`}>BLR <b>{time}</b> IST</span>
            <button className="icon-btn k-btn" onClick={onPalette} aria-label="Open command menu">
              <span className="kbd">{isMac ? '⌘' : 'Ctrl'} K</span>
            </button>
            <button className="icon-btn" onClick={onTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" strokeLinecap="round" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" strokeLinejoin="round" /></svg>
              )}
            </button>
            <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu">
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu${open ? ' open' : ''}`} aria-hidden={!open}>
        <nav aria-label="Mobile sections">
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <span>0{i + 1}</span>{s.label}
            </a>
          ))}
        </nav>
        <div className="mono mute">{PROFILE.location} · {time} IST</div>
      </div>
    </>
  );
}
