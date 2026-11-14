import { useState } from 'react';
import { chunk } from '../corpus';
import { K, runEvals, type EvalRow } from '../evals';

const pct = (x: number) => `${Math.round(x * 100)}%`;

const verdict = (r: EvalRow) =>
  !r.want.length ? (r.ok ? 'nothing, correctly' : `returned ${r.got.length}, wanted none`) : r.rank ? `rank ${r.rank}` : 'missed';

/** The search graded against its test questions. It runs here, in the visitor's browser, on the same code that answers them. */
export function Evals() {
  const [report, setReport] = useState(runEvals);
  const [runs, setRuns] = useState(1);
  const none = report.n - report.answerable;
  const notFirst = report.rows.filter((r) => !r.ok || r.rank > 1).length;
  const tiles = [
    { v: pct(report.hit), k: `found in top ${K}`, d: 'a right chunk came back' },
    { v: pct(report.recall), k: `recall@${K}`, d: 'share of the right chunks found' },
    { v: report.mrr.toFixed(2), k: 'MRR', d: '1.00 means always ranked first' },
    { v: pct(report.miss), k: 'honest misses', d: `said nothing for the ${none} with no answer` },
  ];
  return (
    <section className="cevals wrap" id="evals" aria-labelledby="evals-title">
      <p className="mono c-kicker"><span>(03)</span> Measured, not claimed</p>
      <h3 id="evals-title">The search above, <span className="serif">graded.</span></h3>
      <p className="cevals-lede">
        {report.n} test questions, each with the chunks a good answer needs. {none} of them have no answer here, on purpose:
        the right result is nothing. This ran in your browser just now, on the same code that answered you.
      </p>
      <ul className="cevals-tiles" key={runs}>
        {tiles.map((t, i) => (
          <li key={t.k} style={{ ['--i' as string]: i }}>
            <b>{t.v}</b>
            <span className="mono">{t.k}</span>
            <small>{t.d}</small>
          </li>
        ))}
      </ul>
      <p className="mono cevals-run">
        <button onClick={() => { setReport(runEvals()); setRuns((n) => n + 1); }}>↻ run again</button>
        <span aria-live="polite">{report.n} questions in {report.ms.toFixed(1)} ms · run {runs}</span>
      </p>
      <details className="cevals-all">
        <summary className="mono">every question · {notFirst} not ranked first</summary>
        <ol>
          {report.rows.map((r) => (
            <li key={r.q} className={r.ok ? (r.rank > 1 ? 'low' : '') : 'bad'}>
              <span className="q">{r.q}</span>
              <span className="mono want">{r.want.length ? r.want.slice(0, 2).map((id) => chunk(id).title).join(' · ') : 'no answer'}</span>
              <span className="mono res">{verdict(r)}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
