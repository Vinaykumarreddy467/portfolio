import { PROFILE, SOURCES } from '../data';

export function Footer({ onPalette }: { onPalette: () => void }) {
  return (
    <footer className="footer" id="references">
      <div className="wrap">
        <div className="refs-grid">
          <h2>References <span className="serif">({SOURCES.length})</span></h2>
          <ol className="refs">
            {SOURCES.map((s, i) => (
              <li key={s.id} id={`ref-${i + 1}`}>
                <span>[{i + 1}]</span>
                <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              </li>
            ))}
          </ol>
        </div>

        <div className="giant" aria-hidden="true">Vinay <span className="serif">Reddy</span></div>

        <div className="colophon mono mute">
          <span>© {new Date().getFullYear()} {PROFILE.name}</span>
          <span>Inter Tight · Instrument Serif · JetBrains Mono · React + Vite</span>
          <button onClick={onPalette}>Press ⌘K / Ctrl K for anything</button>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
