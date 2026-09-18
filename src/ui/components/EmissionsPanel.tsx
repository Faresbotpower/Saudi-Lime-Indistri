import type { PlanResult } from '../../engine'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { leverValueLabel } from '../triggerText'
import { sarm } from '../format'
import { ExplainButton } from './ExplainButton'

const tone: Record<string, string> = {
  planned: 'bg-teal/15 text-teal-dim',
  in: 'bg-teal/15 text-teal-dim',
  deferred: 'bg-amber/20 text-[#8a5a00]',
  out: 'bg-coral/12 text-coral',
}

/** Emissions path from the 2025 baseline and the decarbonization roadmap, inside the Sustainability plan. */
export function EmissionsPanel({ plan }: { plan: PlanResult }) {
  const S = strings.plans.emissions
  const L6 = useLevers((s) => s.levers.L6)
  const e = plan.emissions
  const years = [e.baseline.year, ...plan.years]
  const intensity = [e.baseline.intensity, ...e.intensity]
  const total = [e.baseline.totalKtCo2, ...e.totalKt]
  const max = Math.max(...total)
  return (
    <section data-testid="emissions-panel" className="emissions-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-[16px] text-ink">
            {S.title}
            <ExplainButton traceKey="emissions" />
          </h3>
          <p className="text-[13px] text-muted">{S.lead}</p>
        </div>
        <div className="text-right text-[13px] text-navy">
          <div className="label text-muted">{S.carbon}</div>
          <div className="num font-heading text-[16px] text-ink">
            {sarm(e.carbonCostSarm[plan.years.length - 1])}{' '}
            <span className="text-[12px] font-normal text-muted">SAR m in 2031</span>
          </div>
          <div className="text-[12px] text-muted">{S.carbonHint(leverValueLabel('L6', L6))}</div>
        </div>
      </div>
      <div className="emissions-bars num" role="img" aria-label={S.title}>
        {years.map((y, i) => (
          <div key={y} className="emissions-bar" data-testid="emissions-year">
            <span className="emissions-bar-total">{sarm(total[i])}</span>
            <span
              className={`emissions-bar-fill ${i === 0 ? 'is-baseline' : ''}`}
              style={{ height: `${(total[i] / max) * 100}%` }}
            />
            <span className="emissions-bar-year">{y}</span>
            <span className="emissions-bar-intensity">{intensity[i].toFixed(2)}</span>
          </div>
        ))}
        <div className="emissions-legend">
          <span>{S.total}</span>
          <span>{S.intensity}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="label mb-1 text-muted">{S.roadmap}</div>
        <ol className="emissions-roadmap">
          {e.roadmap.map((r) => (
            <li key={r.id} data-testid="roadmap-step">
              <span className="num text-[11px] text-muted">{r.year ?? ''}</span>
              <span className="text-[13px] text-navy">{r.label}</span>
              <span className={`label rounded-full px-2 py-0.5 ${tone[r.status]}`}>
                {S.status[r.status]}
              </span>
              <span className="text-[12px] text-muted">{r.effect}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
