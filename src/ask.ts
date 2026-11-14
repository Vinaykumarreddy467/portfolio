// "Ask Vinay": a typed question goes to a small model with only the retrieved chunks as context.
// The model's reply is not trusted. parseAnswer keeps a claim only if it cites a chunk that was
// actually retrieved, and anything else falls back to the retrieval-only answer.

import type { Seg } from './corpus';

export type Parsed = { segs: Seg[]; kept: number; total: number; sources: number };

const hasWords = (s: string) => /[a-z0-9]/i.test(s);

/**
 * Turns "**Lead.** Some claim [1]. Another [2][3]." into answer segments.
 * `ids` are the retrieved chunk ids, in card order: [1] is ids[0].
 * A claim is the text leading up to a citation. Claims whose citations are all invalid, and any
 * text left after the last citation, are dropped. Returns null when nothing survives.
 */
export function parseAnswer(raw: string, ids: string[]): Parsed | null {
  let text = raw.trim();
  if (!text || /NO_ANSWER/.test(text)) return null;
  text = text
    .replace(/【(\d+)】/g, '[$1]')
    .replace(/\[(\d+(?:\s*[,;]\s*\d+)+)\]/g, (_, list: string) => list.split(/[,;]/).map((n) => `[${n.trim()}]`).join(''))
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\s*\n+\s*/g, ' ');

  type Tok = { t: 'text'; v: string } | { t: 'b'; v: string } | { t: 'cite'; n: number };
  const toks: Tok[] = [];
  let last = 0;
  for (const m of text.matchAll(/\*\*(.+?)\*\*|\[(\d+)\]/g)) {
    if (m.index > last) toks.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[1] !== undefined) toks.push({ t: 'b', v: m[1] });
    else toks.push({ t: 'cite', n: Number(m[2]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) toks.push({ t: 'text', v: text.slice(last) });

  const segs: Seg[] = [];
  const used = new Set<string>();
  let buf: Seg[] = [];
  let kept = 0;
  let total = 0;
  let prevKept = false;
  const bufHasWords = () => buf.some((s) => (typeof s === 'string' ? hasWords(s) : 'b' in s && hasWords(s.b)));

  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok.t === 'b') { buf.push({ b: tok.v }); continue; }
    if (tok.t === 'text') {
      let v = tok.v;
      if (!buf.length) {
        // punctuation that closes the previous claim stays with it
        const lead = v.match(/^[\s.,;:!?)]+/)?.[0] ?? '';
        if (lead.trim() && prevKept) segs.push(lead.trim());
        v = v.slice(lead.length);
      }
      if (v) buf.push(v);
      continue;
    }
    // a run of citations closes the claim
    const nums = [tok.n];
    while (i + 1 < toks.length) {
      const next = toks[i + 1];
      if (next.t === 'cite') { nums.push(next.n); i++; } else if (next.t === 'text' && !next.v.trim() && toks[i + 2]?.t === 'cite') i++;
      else break;
    }
    if (!bufHasWords() && prevKept) {
      // a citation with no new text belongs to the claim before it
      nums.forEach((n) => { const id = ids[n - 1]; if (id && !used.has(id)) { segs.push({ cite: id }); used.add(id); } });
      buf = [];
      continue;
    }
    total += 1;
    const valid = [...new Set(nums.map((n) => ids[n - 1]).filter(Boolean))];
    if (valid.length && bufHasWords()) {
      kept += 1;
      const lastSeg = segs[segs.length - 1];
      if (segs.length && !(typeof lastSeg === 'string' && /\s$/.test(lastSeg))) segs.push(' ');
      const tail = buf[buf.length - 1];
      if (typeof tail === 'string' && !/\s$/.test(tail)) buf.push(' ');
      else if (typeof tail !== 'string') buf.push(' ');
      segs.push(...buf);
      valid.forEach((id) => { segs.push({ cite: id }); used.add(id); });
      prevKept = true;
    } else prevKept = false;
    buf = [];
  }
  if (bufHasWords()) total += 1; // text after the last citation has no source: dropped
  if (!kept) return null;
  const end = segs[segs.length - 1];
  if (typeof end === 'string' && !end.trim()) segs.pop();
  return { segs, kept, total, sources: used.size };
}

export type Reply = { text: string; ms: number; model: string };

let off = false; // the function said it isn't set up: stop asking for this visit

/** Asks the server for an answer. Null on any failure, so the caller can fall back to retrieval. */
export async function askModel(q: string, ids: string[]): Promise<Reply | null> {
  if (off) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  const t0 = performance.now();
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q, ids }),
      signal: ctl.signal,
    });
    if (res.status === 404 || res.status === 405 || res.status === 503) off = true;
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: unknown; model?: unknown };
    if (typeof data.text !== 'string') return null;
    return { text: data.text, ms: performance.now() - t0, model: typeof data.model === 'string' ? data.model : '' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
