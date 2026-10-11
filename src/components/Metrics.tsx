import { useRef } from 'react';
import { METRICS } from '../data';
import { useCountUp, useInView } from '../hooks';
import { Cite } from './ui';

function Metric({ m, go }: { m: (typeof METRICS)[number]; go: boolean }) {
  const v = useCountUp(m.value, go);
  return (
    <div className="metric">
      <strong>{v.toLocaleString('en-IN')}<em>{m.suffix}</em></strong>
      <p><span>{m.label}</span><Cite id={m.src} sm /></p>
    </div>
  );
}

export function Metrics() {
  const ref = useRef<HTMLDivElement>(null);
  const go = useInView(ref, { threshold: 0.25 });
  return (
    <section className="section" aria-label="By the numbers" style={{ paddingTop: 0, paddingBottom: 'clamp(72px, 9vw, 130px)' }}>
      <div className="wrap">
        <div className="metrics" ref={ref}>
          {METRICS.map((m) => <Metric key={m.label} m={m} go={go} />)}
        </div>
      </div>
    </section>
  );
}
