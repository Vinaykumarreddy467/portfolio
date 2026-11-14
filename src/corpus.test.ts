import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHUNKS, CLUSTERS, DOTS, chunk, freeAnswer, search } from './corpus';
import { PROFILE, SOURCES } from './data';

describe('corpus', () => {
  it('has unique chunk ids, each on the map exactly once', () => {
    const ids = CHUNKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DOTS.map((d) => d.id).sort()).toEqual([...ids].sort());
    expect(CLUSTERS.flatMap((c) => c.kinds).length).toBe(new Set(CLUSTERS.flatMap((c) => c.kinds)).size);
  });
  it('points every source reference at a real source', () => {
    const known = new Set(SOURCES.map((s) => s.id));
    CHUNKS.filter((c) => c.src).forEach((c) => expect(known.has(c.src!), `${c.id} -> ${c.src}`).toBe(true));
  });
  it('resolves every card and citation in the guided questions, and cites only its own cards', () => {
    CHAPTERS.forEach((ch) => {
      ch.cards.forEach((id) => expect(() => chunk(id)).not.toThrow());
      ch.answer.forEach((s) => {
        if (typeof s === 'object' && 'cite' in s) expect(ch.cards, `${ch.id} cites ${s.cite}`).toContain(s.cite);
      });
    });
  });
  it('keeps the private phone number out of every chunk', () => {
    const digits = PROFILE.phone.replace(/\D/g, '').slice(-10);
    expect(JSON.stringify(CHUNKS).replace(/\D/g, '')).not.toContain(digits);
  });
});

describe('search', () => {
  const top = (q: string) => search(q).hits[0]?.c.id;
  it.each([
    ['redis rate limiting', 'pr-redis'],
    ['context layer memory', 'pr-context-layer'],
    ['accessibility', 'jr-e04b6ac'],
    ['neo4j', 'ct-0'],
    ['email', 'c-email'],
  ])('%s -> %s', (q, id) => {
    expect(search(q).hits.map((h) => h.c.id)).toContain(id);
  });
  it('puts the obvious project first', () => {
    expect(search('redis rate limiting ddos', 3).hits.map((h) => h.c.id)).toContain('pr-redis');
    expect(top('rate limiting ddos protection')).toBe('pr-redis');
  });
  it('finds nothing for nonsense, and says so', () => {
    const r = search('zxqvw plomb');
    expect(r.hits).toEqual([]);
    expect(JSON.stringify(freeAnswer(r))).toContain('Nothing in the corpus');
  });
  it('cites every chunk it mentions in a free answer', () => {
    const r = search('langgraph');
    const cites = freeAnswer(r).filter((s) => typeof s === 'object' && 'cite' in s);
    expect(cites.length).toBe(Math.min(r.hits.length, 5));
  });
});
