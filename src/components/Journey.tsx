import { JOURNEY } from '../data';
import { SectionHead } from './ui';

export function Journey() {
  return (
    <section className="section" id="journey" aria-labelledby="journey-title">
      <div className="wrap">
        <SectionHead
          idx="04"
          kicker="Journey"
          lede="From data science to accessible front ends to full-stack Java to Gen AI. Every step added a layer the next one stands on."
        >
          <span id="journey-title">The commit <span className="serif">history.</span></span>
        </SectionHead>

        <div className="term" data-reveal>
          <div className="term-bar">
            <i /><i /><i />
            <span>vinay@bengaluru: ~/career</span>
          </div>
          <div className="term-body">
            <p className="prompt"><b>vinay@bengaluru</b>:~/career$ git log --graph --author="vinay"<span className="caret" aria-hidden="true" /></p>
            <ol className="commits">
              {JOURNEY.map((c) => (
                <li key={c.hash} className={`commit${c.head ? ' head' : ''}`} data-reveal>
                  <span className="node" aria-hidden="true" />
                  <span className="hash">{c.hash}<small>{c.from ? `${c.from} → ` : '→ '}{c.to}</small></span>
                  <div className="content">
                    <h3>
                      {c.role} <span className="serif">at</span> {c.org}
                      {c.head && <span className="refs"><span>HEAD → now</span><span className="b">open to roles</span></span>}
                    </h3>
                    {c.where && <p className="meta">{c.where}</p>}
                    {c.notes.length > 0 && <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
