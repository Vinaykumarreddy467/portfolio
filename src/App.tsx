import { useCallback, useEffect, useRef, useState } from 'react';
import { PROFILE } from './data';
import { reducedMotion, useRevealAll } from './hooks';
import { Archive } from './components/Archive';
import { Contact } from './components/Contact';
import { Cursor } from './components/Cursor';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Journey } from './components/Journey';
import { Loader } from './components/Loader';
import { Marquee } from './components/Marquee';
import { Method } from './components/Method';
import { Metrics } from './components/Metrics';
import { Nav } from './components/Nav';
import { Palette } from './components/Palette';
import { Proof } from './components/Proof';
import { Work } from './components/Work';

const seenIntro = () => {
  try { return sessionStorage.getItem('vkr-intro') === '1'; } catch { return false; }
};

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [loading, setLoading] = useState(() => !seenIntro() && !reducedMotion());
  const [ready, setReady] = useState(false);
  const [palette, setPalette] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a09' : '#efece4');
    try { localStorage.setItem('vkr-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  useEffect(() => {
    if (!loading) requestAnimationFrame(() => setReady(true));
  }, [loading]);

  useRevealAll(ready);

  // Scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  // ⌘K / Ctrl+K / "/" opens the palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]');
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      notify('Email copied. Talk soon.');
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  }, [notify]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem('vkr-intro', '1'); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  return (
    <div className={ready ? 'ready' : ''}>
      <a className="skip" href="#work">Skip to work</a>
      <div className="progress" ref={bar} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {loading && <Loader onDone={finishIntro} />}
      <Cursor />
      <Nav theme={theme} onTheme={toggleTheme} onPalette={() => setPalette(true)} />

      <main>
        <Hero theme={theme} onCopy={copyEmail} />
        <Marquee />
        <Work />
        <Metrics />
        <Method />
        <Journey />
        <Archive />
        <Proof />
        <Contact onCopy={copyEmail} />
      </main>
      <Footer onPalette={() => setPalette(true)} />

      <Palette open={palette} onClose={() => setPalette(false)} onCopy={copyEmail} onTheme={toggleTheme} />
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />{toast}
      </div>
    </div>
  );
}
