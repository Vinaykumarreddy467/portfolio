import { useEffect, useRef } from 'react';
import { PROFILE } from '../data';
import { reducedMotion } from '../hooks';
import { EmbeddingField } from './EmbeddingField';
import { Arrow, Cite, Lines } from './ui';

export function Hero({ theme, onCopy }: { theme: string; onCopy: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);

  // Parallax: the copy lifts and fades as the hero scrolls away.
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, scrollY / innerHeight);
        if (wrap.current) {
          wrap.current.style.transform = `translate3d(0, ${p * -90}px, 0)`;
          wrap.current.style.opacity = `${1 - p * 0.9}`;
        }
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="hero" id="top" aria-label="Introduction">
      <EmbeddingField theme={theme} />
      <div className="wrap" ref={wrap}>
        <div className="hero-meta">
          <p className="mono mute">
            <Lines lines={[PROFILE.name, `${PROFILE.role} · ${PROFILE.location}`]} base={0.1} />
          </p>
          <span className="status mono" data-reveal>
            <span className="dot" aria-hidden="true" /> Open to {PROFILE.openTo}
          </span>
        </div>

        <h1 className="hero-title">
          <Lines
            base={0.2}
            step={0.1}
            lines={[
              <>I build LLM systems</>,
              <span className="ln2">that <span className="serif">cite</span> their</span>,
              <>sources.<Cite id="profile" /></>,
            ]}
          />
        </h1>

        <div className="hero-foot">
          <p data-reveal style={{ ['--d' as string]: '0.6s' }}>
            Hybrid-search RAG, <strong>LangGraph</strong> multi-agent pipelines and <strong>MCP</strong> servers,
            with Spring Boot and FastAPI backends behind them. Currently <strong>{PROFILE.current}</strong>.
          </p>
          <div className="hero-cta" data-reveal style={{ ['--d' as string]: '0.7s' }}>
            <a className="btn solid" href="#work" data-cursor="view" data-magnetic>See the work <Arrow /></a>
            <button className="btn" onClick={onCopy} data-cursor="copy" data-magnetic>Copy email</button>
          </div>
          <div className="hero-legend" data-reveal style={{ ['--d' as string]: '0.8s' }}>
            <span className="scroll-cue"><span className="line" /> <span>
              <i>fig. 0</i> Move your cursor: it's a query vector. The lines are its nearest neighbours.
            </span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
