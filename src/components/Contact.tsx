import { PROFILE } from '../data';
import { useClock } from '../hooks';
import { ArrowUpRight, Lines } from './ui';

export function Contact({ onCopy }: { onCopy: () => void }) {
  const time = useClock(PROFILE.timezone);
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <p className="mono mute" style={{ marginBottom: 28 }}>(06) Contact · {PROFILE.openTo}</p>
        <h2 className="contact-title" id="contact-title">
          <span className="mask" data-mask><span>If your LLM needs</span></span>
          <span className="mask" data-mask><span style={{ ['--d' as string]: '0.08s' }}>to be <span className="serif">right,</span></span></span>
          <span className="mask" data-mask><span style={{ ['--d' as string]: '0.16s' }}>not just fluent.</span></span>
        </h2>

        <button className="mailer" onClick={onCopy} data-cursor="copy" aria-label={`Copy email address ${PROFILE.email}`}>
          <span className="addr">{PROFILE.email}</span>
          <span className="act"><span>Click to copy</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></svg>
          </span>
        </button>

        <div className="contact-grid">
          <a href={`mailto:${PROFILE.email}`} data-cursor="write"><span className="mono">Write</span><b>Send an email <ArrowUpRight /></b></a>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" data-cursor="connect"><span className="mono">LinkedIn</span><b>molakathala-vinay-kumar-reddy</b></a>
          <a href={PROFILE.github} target="_blank" rel="noreferrer" data-cursor="code"><span className="mono">GitHub</span><b>@Vinaykumarreddy467</b></a>
          <div><span className="mono">Local time</span><b style={{ fontWeight: 500 }}>
            <Lines lines={[`${time} IST · ${PROFILE.location}`]} />
          </b></div>
        </div>
      </div>
    </section>
  );
}
