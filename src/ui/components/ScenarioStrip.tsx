import { motion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { scenarioOrder } from '../../data'
import { presetPlans, useData } from '../../state/plan'
import { strings } from '../../strings'
import { sarm } from '../format'
import { Slash } from './Slash'

/** The four presets side by side; a Custom row appears when the levers leave the presets. */
export function ScenarioStrip({ plan }: { plan: PlanResult }) {
  const presets = presetPlans(useData())
  const rows = scenarioOrder.map((id) => ({ id, name: strings.scenarios[id], p: presets[id] }))
  if (plan.scenarioName === 'custom')
    rows.push({ id: 'custom' as never, name: strings.scenarios.custom, p: plan })
  const C = strings.financials.stripCols
  const last = plan.years.length - 1
  return (
    <div data-testid="scenario-strip" className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-[16px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th className="label px-3 py-2 font-medium text-muted">{C.scenario}</th>
            <th className="label px-3 py-2 text-right font-medium text-muted">{C.revenue}</th>
            <th className="label px-3 py-2 text-right font-medium text-muted">{C.ebitda}</th>
            <th className="label px-3 py-2 text-right font-medium text-muted">{C.fcf}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const current = r.id === plan.scenarioName
            return (
              <motion.tr
                key={r.id}
                layout
                data-testid={`scenario-row-${r.id}`}
                data-current={current ? 'true' : 'false'}
                className={`border-t border-line ${current ? 'bg-teal/8 text-ink' : 'text-navy'}`}
              >
                <td className="px-3 py-2 font-heading">
                  <span className="flex items-center gap-2">
                    {current ? <Slash size={12} /> : <span className="inline-block w-[7px]" />}
                    {r.name}
                  </span>
                </td>
                <td className="num px-3 py-2 text-right">{sarm(r.p.financials.revenue[last])}</td>
                <td className="num px-3 py-2 text-right">{sarm(r.p.financials.ebitda[last])}</td>
                <td
                  className={`num px-3 py-2 text-right ${r.p.financials.cumulativeFcf[last] < 0 ? 'text-coral' : ''}`}
                >
                  {sarm(r.p.financials.cumulativeFcf[last])}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
