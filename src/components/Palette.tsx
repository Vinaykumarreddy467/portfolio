import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { PROFILE, PROJECTS } from '../data';
import { SECTIONS } from './Nav';

type Cmd = { group: string; label: string; hint: string; run: () => void };

type Props = { open: boolean; onClose: () => void; onCopy: () => void; onTheme: () => void };

const go = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export function Palette({ open, onClose, onCopy, onTheme }: Props) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  const cmds = useMemo<Cmd[]>(() => [
    ...SECTIONS.map((s) => ({ group: 'Go to', label: s.label, hint: `#${s.id}`, run: () => jump(s.id) })),
    { group: 'Actions', label: 'Copy email address', hint: PROFILE.email, run: onCopy },
    { group: 'Actions', label: 'Toggle light / dark', hint: 'theme', run: onTheme },
    { group: 'Actions', label: 'Open résumé', hint: 'google drive', run: () => go(PROFILE.resume) },
    { group: 'Elsewhere', label: 'GitHub', hint: '@Vinaykumarreddy467', run: () => go(PROFILE.github) },
    { group: 'Elsewhere', label: 'LinkedIn', hint: 'connect', run: () => go(PROFILE.linkedin) },
    { group: 'Elsewhere', label: 'LinkedIn posts', hint: 'learning in public', run: () => go(PROFILE.linkedinPosts) },
    ...PROJECTS.map((p) => ({ group: 'Projects', label: p.title, hint: 'source ↗', run: () => go(p.url) })),
  ], [onCopy, onTheme]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cmds;
    return cmds.filter((c) => `${c.group} ${c.label} ${c.hint}`.toLowerCase().includes(s));
  }, [q, cmds]);

  useEffect(() => {
    if (open) {
      restore.current = document.activeElement as HTMLElement;
      setQ('');
      setSel(0);
      requestAnimationFrame(() => input.current?.focus());
    } else restore.current?.focus?.();
  }, [open]);

  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const run = (c?: Cmd) => { if (!c) return; onClose(); setTimeout(c.run, 10); };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(list[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'Tab') e.preventDefault();
  };

  let lastGroup = '';
  return (
    <div className="pal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command menu" onKeyDown={onKey}>
        <div className="pal-input">
          <span aria-hidden="true">›</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sections, projects, actions…"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={list[sel] ? `pal-${sel}` : undefined}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="pal-list" id="pal-list" role="listbox">
          {list.length === 0 && <div className="pal-empty">No results. Even RAG can't retrieve what isn't indexed.</div>}
          {list.map((c, i) => {
            const head = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={`${c.group}-${c.label}`}>
                {head && <div className="pal-group">{head}</div>}
                <button
                  id={`pal-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  className="pal-item"
                  onMouseMove={() => setSel(i)}
                  onClick={() => run(c)}
                  tabIndex={-1}
                >
                  <span>{c.label}</span><small>{c.hint}</small>
                </button>
              </div>
            );
          })}
        </div>
        <div className="pal-foot"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></div>
      </div>
    </div>
  );
}
