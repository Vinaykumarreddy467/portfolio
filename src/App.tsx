import { useCallback, useEffect, useRef, useState } from 'react';
import { PROFILE, TEES } from './data';
import { reducedMotion, useRevealAll } from './hooks';
import { Corpus } from './components/Corpus';
import { Cursor } from './components/Cursor';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Loader } from './components/Loader';
import { Nav } from './components/Nav';
import { Palette } from './components/Palette';

const seenIntro = () => {
  try { return sessionStorage.getItem('vkr-intro') === '1'; } catch { return false; }
};

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [tee, setTee] = useState(() => document.documentElement.dataset.tee || 'crimson');
  const [loading, setLoading] = useState(() => !seenIntro() && !reducedMotion());
  const [ready, setReady] = useState(false);
  const [palette, setPalette] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1013' : '#f4f1ea');
    try { localStorage.setItem('vkr-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  // The tee colour drives the accent: data-tee swaps the tokens, @property animates them.
  useEffect(() => {
    document.documentElement.dataset.tee = tee;
    try { localStorage.setItem('vkr-tee', tee); } catch { /* storage unavailable */ }
  }, [tee]);

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

  const teeNow = useRef(tee);
  teeNow.current = tee;
  const dye = useCallback((id: string) => {
    if (teeNow.current === id) return;
    setTee(id);
    notify(`Tee dyed ${TEES.find((t) => t.id === id)?.name.toLowerCase()}. The site followed.`);
  }, [notify]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem('vkr-intro', '1'); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  return (
    <div className={ready ? 'ready' : ''}>
      <a className="skip" href="#corpus">Skip to the work</a>
      <div className="progress" ref={bar} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {loading && <Loader onDone={finishIntro} />}
      <Cursor />
      <Nav theme={theme} onTheme={toggleTheme} onPalette={() => setPalette(true)} />

      <main>
        <Hero tee={tee} onTee={dye} onCopy={copyEmail} ready={ready} />
        <Corpus tee={tee} onCopy={copyEmail} />
      </main>
      <Footer onPalette={() => setPalette(true)} tee={tee} />

      <Palette open={palette} onClose={() => setPalette(false)} onCopy={copyEmail} onTheme={toggleTheme} onTee={dye} />
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />{toast}
      </div>
    </div>
  );
}
