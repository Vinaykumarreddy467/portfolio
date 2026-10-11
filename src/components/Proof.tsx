import { PROFILE, PROOF } from '../data';
import { ArrowUpRight, Cite, SectionHead } from './ui';

export function Proof() {
  return (
    <section className="section" id="proof" aria-labelledby="proof-title">
      <div className="wrap">
        <SectionHead
          idx="05"
          kicker="Proof"
          lede="Hackathons shipped, certifications earned, and a lot of Bengaluru evenings spent in rooms full of people building with AI."
        >
          <span id="proof-title">Out in the <span className="serif">wild.</span></span>
        </SectionHead>

        <div className="proof">
          <article className="card c-wins" data-reveal>
            <h3><span>Built &amp; volunteered</span><span>{PROOF.wins.length}</span></h3>
            {PROOF.wins.map((w, i) => (
              <div className="win" key={w.title}>
                <b>{w.title}<Cite id={w.src} sm /></b>
                <p>{w.text}</p>
                <span className="trophy" aria-hidden="true">{['i', 'ii', 'iii', 'iv'][i]}</span>
              </div>
            ))}
          </article>

          <article className="card c-certs" data-reveal style={{ ['--d' as string]: '0.08s' }}>
            <h3><span>Credentials</span><span>{PROOF.certs.length}</span></h3>
            {PROOF.certs.map((c, i) => (
              <div className={`cert${i === 0 ? ' star' : ''}`} key={c.title}>
                <b>{c.title}</b><span>{c.by}</span>
              </div>
            ))}
            <p className="cert-note">“{PROOF.certs[0].note}”</p>
          </article>

          <article className="card c-rooms" data-reveal>
            <h3><span>Rooms I keep showing up in</span><span>{PROOF.rooms.length}</span></h3>
            <div className="rooms">{PROOF.rooms.map((r) => <span key={r}>{r}</span>)}</div>
          </article>

          <article className="card c-write" data-reveal style={{ ['--d' as string]: '0.08s' }}>
            <h3><span>Learning in public</span><span>39 posts</span></h3>
            <p className="big">I write up what I learn, <span className="serif">honestly.</span></p>
            <ul>{PROOF.writing.map((w) => <li key={w}>{w}</li>)}</ul>
            <a className="btn" href={PROFILE.linkedinPosts} target="_blank" rel="noreferrer" data-cursor="read" data-magnetic>
              Read on LinkedIn <ArrowUpRight />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
