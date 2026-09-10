import type { PlanResult } from '../../engine'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { leverValueLabel } from '../triggerText'
import { Card } from './Card'
import { CountUp } from './CountUp'

export function SupplyPanel({ plan }: { plan: PlanResult }) {
  const O = strings.operations
  const levers = useLevers((s) => s.levers)
  const tiles = [
    {
      id: 'energy-cost',
      label: O.energy,
      value: plan.supplyChain.energyCostPerTonLime,
      lever: 'L2' as const,
      current: levers.L2,
    },
    {
      id: 'carbon-cost',
      label: O.carbon,
      value: plan.supplyChain.carbonCostPerTonLime,
      lever: 'L6' as const,
      current: levers.L6,
    },
    {
      id: 'logistics-cost',
      label: O.logistics,
      value: plan.supplyChain.exportLogisticsPerTon,
      lever: 'L5' as const,
      current: levers.L5,
    },
  ]
  return (
    <Card title={O.supply} lead={O.supply_lead}>
      <div className="grid gap-4">
        {tiles.map((t) => (
          <div
            key={t.id}
            className="flex items-end justify-between border-b border-line pb-3 last:border-b-0 last:pb-0"
          >
            <div>
              <div className="label text-muted">{t.label}</div>
              <div className="mt-1 text-[12px] text-muted">
                {O.under} {strings.levers.short[t.lever]}{' '}
                <span className="num text-navy">{leverValueLabel(t.lever, t.current)}</span>
              </div>
            </div>
            <div className="num text-right font-heading text-[28px] leading-none text-ink">
              <span data-testid={t.id}>
                <CountUp value={t.value} format={(v) => `${Math.round(v)}`} />
              </span>
              <span className="ml-1 text-[12px] text-muted">{O.sarPerTon}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
