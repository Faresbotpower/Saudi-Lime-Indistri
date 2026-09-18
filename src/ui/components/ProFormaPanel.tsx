import type { PlanResult } from '../../engine'
import { strings } from '../../strings'
import { pct1, sarm, signed } from '../format'
import { ExplainButton } from './ExplainButton'

/** Two views of 2026: the actual on diesel and crude, and the pro forma on gas the plan starts from. */
export function ProFormaPanel({ plan }: { plan: PlanResult }) {
  const P = strings.financials.proForma
  const pf = plan.proForma2026
  const actual = { ebitda: plan.financials.ebitda[0], revenue: plan.financials.revenue[0] }
  const cols: { id: string; label: string; ebitda: number; energy: number }[] = [
    { id: 'actual', label: P.actual, ebitda: actual.ebitda, energy: pf.energyCostPerTonLimeActual },
    { id: 'proforma', label: P.proForma, ebitda: pf.ebitda, energy: pf.energyCostPerTonLimeOnGas },
  ]
  return (
    <section data-testid="pro-forma" className="pro-forma" data-tour="pro-forma">
      <div className="pro-forma-heading">
        <div>
          <h2 className="flex items-center gap-2 text-[20px] text-ink">
            {P.title}
            <ExplainButton traceKey="proForma2026" />
          </h2>
          <p className="mt-0.5 text-[14px] text-muted">{P.lead}</p>
        </div>
      </div>
      <div className="pro-forma-grid num">
        {cols.map((c) => (
          <div key={c.id} data-testid={`pro-forma-${c.id}`} className="pro-forma-col">
            <div className="label text-muted">{c.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading text-[32px] leading-none text-ink">
                {sarm(c.ebitda)}
              </span>
              <span className="text-[13px] text-muted">{P.ebitda}, SAR m</span>
            </div>
            <div className="mt-1 text-[13px] text-navy">
              {P.margin} <span className="text-ink">{pct1(c.ebitda / actual.revenue)}%</span>
            </div>
            <div className="text-[13px] text-navy">
              {P.energy} <span className="text-ink">{Math.round(c.energy)} SAR/t</span>
            </div>
          </div>
        ))}
        <div className="pro-forma-col pro-forma-saving">
          <div className="label text-muted">{P.saving}</div>
          <div className="mt-2 font-heading text-[32px] leading-none text-teal-dim">
            {signed(pf.energySaving)}
            <span className="ml-1 text-[13px] font-normal text-muted">SAR m</span>
          </div>
        </div>
      </div>
    </section>
  )
}
