// Grades the search against GOLDEN. Runs in the tests (which fail if a score drops) and live in
// the page, in the visitor's own browser.

import { search } from './corpus';
import { GOLDEN } from './golden';

export const K = 6;

export type EvalRow = { q: string; want: string[]; got: string[]; rank: number; ok: boolean };
export type EvalReport = { rows: EvalRow[]; n: number; answerable: number; hit: number; recall: number; mrr: number; miss: number; ms: number };

export function runEvals(): EvalReport {
  const t0 = performance.now();
  const rows = GOLDEN.map(({ q, want }): EvalRow => {
    const got = search(q, K).hits.map((h) => h.c.id);
    const rank = got.findIndex((id) => want.includes(id)) + 1; // 0 when none came back
    return { q, want, got, rank, ok: want.length ? rank > 0 : got.length === 0 };
  });
  const yes = rows.filter((r) => r.want.length);
  const no = rows.filter((r) => !r.want.length);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 1);
  return {
    rows,
    n: rows.length,
    answerable: yes.length,
    hit: mean(yes.map((r) => (r.rank ? 1 : 0))), // at least one right chunk in the top K
    recall: mean(yes.map((r) => r.want.filter((id) => r.got.includes(id)).length / Math.min(r.want.length, K))),
    mrr: mean(yes.map((r) => (r.rank ? 1 / r.rank : 0))),
    miss: mean(no.map((r) => (r.ok ? 1 : 0))), // said "nothing" when there was nothing
    ms: performance.now() - t0,
  };
}
