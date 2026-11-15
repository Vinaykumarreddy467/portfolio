import { describe, expect, it } from 'vitest';
import { CHUNKS } from './corpus';
import { runEvals } from './evals';
import { GOLDEN } from './golden';

describe('retrieval evals', () => {
  const r = runEvals();
  it('only names chunks that exist', () => {
    const ids = new Set(CHUNKS.map((c) => c.id));
    GOLDEN.flatMap((g) => g.want).forEach((id) => expect(ids.has(id), id).toBe(true));
  });
  // Floors, a little under today's scores (hit 1.00, recall 0.97, MRR 0.87, no-answer 1.00). A change that drops below fails the build.
  it('finds a right chunk in the top 6', () => expect(r.hit).toBeGreaterThanOrEqual(0.96));
  it('recalls most of what it should', () => expect(r.recall).toBeGreaterThanOrEqual(0.93));
  it('ranks the right chunk near the top', () => expect(r.mrr).toBeGreaterThanOrEqual(0.85));
  it('returns nothing when there is nothing', () => expect(r.miss).toBeGreaterThanOrEqual(0.9));
});
