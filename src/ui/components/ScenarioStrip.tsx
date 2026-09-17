import './analytics.css'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { scenarioOrder } from '../../data'
import { presetPlans, useData } from '../../state/plan'
import { strings } from '../../strings'
import { sarm, signed } from '../format'
import { Slash } from './Slash'
import { CountUp } from './CountUp'

/** The four presets side by side; a Custom row appears when the levers leave the presets. */
export function ScenarioStrip({ plan }: { plan: PlanResult }) {
  const reduced = useReducedMotion()
  const presets = presetPlans(useData())
  const rows = scenarioOrder.map((id) => ({ id, name: strings.scenarios[id], p: presets[id] }))
  if (plan.scenarioName === 'custom')
    rows.push({ id: 'custom' as never, name: strings.scenarios.custom, p: plan })
  const C = strings.financials.stripCols
  const last = plan.years.length - 1
  return (
    <div
      data-testid="scenario-strip"
      className="analytics-table-scroll scenariostrip rounded-lg border border-line"
      tabIndex={0}
      role="region"
      aria-label={strings.financials.stripCols.scenario}
    >
      <table className="w-full text-[16px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {C.scenario}
            </th>
            <th scope="col" className="label px-3 py-2 text-right font-medium text-muted">
              {C.revenue}
            </th>
            <th scope="col" className="label px-3 py-2 text-right font-medium text-muted">
              {C.ebitda}
            </th>
            <th scope="col" className="label px-3 py-2 text-right font-medium text-muted">
              {C.fcf}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const current = r.id === plan.scenarioName
            return (
              <motion.tr
                key={r.id}
                layout={!reduced}
                aria-current={current ? 'true' : undefined}
                transition={{ duration: reduced ? 0.12 : 0.35 }}
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
                <td className="num px-3 py-2 text-right">
                  <CountUp value={r.p.financials.revenue[last]} format={sarm} />
                  {r.id !== 'base' && (
                    <span className="scenario-base-delta">
                      {signed(r.p.financials.revenue[last] - presets.base.financials.revenue[last])}{' '}
                      {strings.financials.vsBase}
                    </span>
                  )}
                </td>
                <td className="num px-3 py-2 text-right">
                  <CountUp value={r.p.financials.ebitda[last]} format={sarm} />
                  {r.id !== 'base' && (
                    <span className="scenario-base-delta">
                      {signed(r.p.financials.ebitda[last] - presets.base.financials.ebitda[last])}{' '}
                      {strings.financials.vsBase}
                    </span>
                  )}
                </td>
                <td
                  className={`num px-3 py-2 text-right ${r.p.financials.cumulativeFcf[last] < 0 ? 'text-coral' : ''}`}
                >
                  <CountUp value={r.p.financials.cumulativeFcf[last]} format={sarm} />
                  {r.id !== 'base' && (
                    <span className="scenario-base-delta">
                      {signed(
                        r.p.financials.cumulativeFcf[last] -
                          presets.base.financials.cumulativeFcf[last],
                      )}{' '}
                      {strings.financials.vsBase}
                    </span>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
