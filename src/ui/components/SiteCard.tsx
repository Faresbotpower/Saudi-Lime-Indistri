import type { PlanResult, SiteResult } from '../../engine'
import { planData } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'
import { CountUp } from './CountUp'
import { Gauge } from './Gauge'
import { Sparkline } from './Sparkline'
import { ExplainButton } from './ExplainButton'

type Props = { site: SiteResult; plan: PlanResult; index: number }

const dot: Record<string, string> = { in: 'bg-teal', deferred: 'bg-amber', out: 'bg-coral' }

export function SiteCard({ site, plan, index }: Props) {
  const O = strings.operations
  const region = planData.assumptions.sites.find((s) => s.id === site.id)?.region ?? ''
  const status = Object.fromEntries(plan.initiatives.map((i) => [i.id, i.status]))
  const touching = planData.initiatives.initiatives.filter(
    (i) => i.site === site.id && status[i.id] !== 'out',
  )
  const util = site.utilization[index]
  return (
    <div data-testid={`site-${site.id}`} className="rounded-card bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[20px] text-ink">
            {site.name}
            <ExplainButton traceKey={`sites.${site.id}`} />
          </h3>
          <div className="text-[13px] text-muted">{region}</div>
        </div>
        <Gauge value={util} />
      </div>
      <dl className="num mt-3 grid grid-cols-2 gap-3 text-[14px]">
        <div>
          <dt className="label text-muted">{O.capacity}</dt>
          <dd className="text-ink">
            <span data-testid="capacity">
              <CountUp value={site.capacity[index]} format={sarm} />
            </span>{' '}
            <span className="text-muted">{O.kt}</span>
          </dd>
        </div>
        <div>
          <dt className="label text-muted">{O.utilization}</dt>
          <dd className="text-ink">
            <span data-testid="utilization">{Math.round(util * 100)}</span>
            <span className="text-muted">%</span>
            {util >= 0.97 && <span className="ml-2 text-[11px] text-[#8a5a00]">{O.saturated}</span>}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="label text-muted">{O.capexPhasing}</span>
          <span className="num text-[13px] text-navy">
            SAR {sarm(site.capex[index])}m · {plan.years[index]}
          </span>
        </div>
        <div className="mt-1">
          <Sparkline values={site.capex} index={index} />
        </div>
      </div>
      <div className="mt-4">
        <div className="label mb-1 text-muted">{O.touching}</div>
        {touching.length === 0 ? (
          <p className="text-[13px] text-muted">{O.noneTouching}</p>
        ) : (
          <ul className="space-y-1 text-[13px] text-navy">
            {touching.map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot[status[i.id]]}`} />
                {i.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
