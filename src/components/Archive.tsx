import { useState } from 'react';
import { ARCHIVE, type ArchiveItem } from '../data';
import { ArrowUpRight, SectionHead } from './ui';

const KINDS: ('All' | ArchiveItem['kind'])[] = ['All', 'AI', 'Java', 'ML', 'Web'];

export function Archive() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>('All');
  const rows = kind === 'All' ? ARCHIVE : ARCHIVE.filter((a) => a.kind === kind);

  return (
    <section className="section" id="toolbox" aria-labelledby="toolbox-title">
      <div className="wrap">
        <SectionHead
          idx="04"
          kicker={`Toolbox · ${ARCHIVE.length} more builds`}
          lede="MCP servers, agent experiments, document pipelines, Spring Boot systems and the ML projects where it all started."
        >
          <span id="toolbox-title">The rest of the <span className="serif">workshop.</span></span>
        </SectionHead>

        <div className="filters" role="group" aria-label="Filter builds">
          {KINDS.map((k) => (
            <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k}<sup>{k === 'All' ? ARCHIVE.length : ARCHIVE.filter((a) => a.kind === k).length}</sup>
            </button>
          ))}
        </div>

        <ul className="archive" key={kind}>
          {rows.map((a, i) => (
            <li key={a.name} className="arch-row" style={{ animationDelay: `${i * 0.03}s` }}>
              <span className="nm">{a.name}</span>
              <span className="wt">{a.what}</span>
              <span className="st">{a.stack}</span>
              <span className="kd">{a.kind}</span>
              <span className="ln">
                {a.live && <a href={a.live} target="_blank" rel="noreferrer" data-cursor="live"><span className="dot" style={{ width: 6, height: 6 }} aria-hidden="true" />Live</a>}
                <a href={a.url} target="_blank" rel="noreferrer" data-cursor="source" aria-label={`${a.name} source on GitHub`}>Code <ArrowUpRight size={10} /></a>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
