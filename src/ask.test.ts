import { describe, expect, it } from 'vitest';
import { parseAnswer } from './ask';
import type { Seg } from './corpus';

const ids = ['a', 'b', 'c'];
const flat = (segs: Seg[]) => segs.map((s) => (typeof s === 'string' ? s : 'b' in s ? `<${s.b}>` : `[${s.cite}]`)).join('');

describe('parseAnswer', () => {
  it('keeps cited claims and maps numbers to chunk ids', () => {
    const p = parseAnswer('**I build RAG systems** [1]. I also work at Dr. Reddy’s Foundation [2][3].', ids)!;
    expect(flat(p.segs)).toBe('<I build RAG systems> [a]. I also work at Dr. Reddy’s Foundation [b][c].');
    expect(p).toMatchObject({ kept: 2, total: 2, sources: 3 });
  });
  it('drops a claim whose citation was never retrieved', () => {
    const p = parseAnswer('I use Redis [1]. I have ten years of experience [9]. I like Java [2].', ids)!;
    expect(flat(p.segs)).toBe('I use Redis [a]. I like Java [b].');
    expect(p).toMatchObject({ kept: 2, total: 3 });
  });
  it('drops text after the last citation', () => {
    const p = parseAnswer('I use Redis [1]. I am also the best engineer alive.', ids)!;
    expect(flat(p.segs)).toBe('I use Redis [a].');
    expect(p).toMatchObject({ kept: 1, total: 2 });
  });
  it('reads grouped and spaced citations', () => {
    expect(flat(parseAnswer('Both builds shipped [1, 2].', ids)!.segs)).toBe('Both builds shipped [a][b].');
    expect(flat(parseAnswer('Both builds shipped [1] [2].', ids)!.segs)).toBe('Both builds shipped [a][b].');
  });
  it('returns null when nothing is cited, on NO_ANSWER and on empty text', () => {
    expect(parseAnswer('I am a great engineer with many skills.', ids)).toBeNull();
    expect(parseAnswer('NO_ANSWER', ids)).toBeNull();
    expect(parseAnswer('  ', ids)).toBeNull();
    expect(parseAnswer('Sure [7].', ids)).toBeNull();
  });
  it('strips list markers and line breaks', () => {
    expect(flat(parseAnswer('- I use Redis [1].\n- I use Java [2].', ids)!.segs)).toBe('I use Redis [a]. I use Java [b].');
  });
});
