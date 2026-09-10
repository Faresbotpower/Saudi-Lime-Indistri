import { motion } from 'framer-motion'
import { ViewFrame } from '../components/ViewFrame'
import { DeltaChip } from '../components/DeltaChip'
import { Slash } from '../components/Slash'
import { usePlan, useTrackedPlan, useData, presetPlans } from '../../state/plan'
import { strings } from '../../strings'
import { functionImpacts } from '../functions'
import { signed } from '../format'

const dot: Record<string, string> = { in: 'bg-teal', deferred: 'bg-amber', out: 'bg-coral' }

export function Functions() {
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const base = presetPlans(useData()).base
  const cards = functionImpacts(plan, base, tracked)
  const F = strings.functions
  return (
    <ViewFrame id="functions">
      <div className="grid grid-cols-2 gap-6" data-tour="functions">
        {cards.map((c, k) => (
          <motion.section
            key={c.id}
            data-testid={`function-${c.id}`}
            className="rounded-card bg-white p-5 shadow-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: k * 0.04 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[20px] text-ink">
                  <Slash size={16} />
                  {c.name}
                </h2>
                <div className="mt-0.5 text-[13px] text-muted">
                  <span className="label mr-2">{F.rfq}</span>
                  {c.rfq}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {c.levers.map((l) => (
                  <span
                    key={l}
                    className="rounded-chip bg-sand-2 px-1.5 py-0.5 text-[11px] text-navy"
                    title={strings.levers.short[l]}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="label mt-4 mb-1 text-muted">{F.kpis}</div>
            <table className="w-full text-[14px]">
              <tbody>
                {c.kpis.map((k) => (
                  <tr key={k.id} className="border-t border-line">
                    <td className="py-1.5 pr-2 text-navy">{k.label}</td>
                    <td className="num py-1.5 text-right font-heading text-[16px] text-ink">
                      {k.format(k.value)}
                    </td>
                    <td className="py-1.5 pl-3 text-right">
                      <DeltaChip
                        delta={k.delta}
                        format={(d) =>
                          k.format === signed
                            ? signed(d)
                            : `${d > 0 ? '+' : '−'}${k.format(Math.abs(d))}`
                        }
                        goodWhenUp={k.goodWhenUp}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="label mb-1 text-muted">{F.initiatives}</div>
                {c.initiatives.length === 0 ? (
                  <p className="text-[13px] text-muted">{F.noInitiatives}</p>
                ) : (
                  <ul className="space-y-1 text-[13px] text-navy">
                    {c.initiatives.map((i) => (
                      <li key={i.id} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot[i.status]}`}
                        />
                        <span>
                          {i.name}
                          <span className="text-muted">
                            {' '}
                            · {strings.portfolio.columns[i.status]}
                            {i.startYear && i.status !== 'out' ? ` ${i.startYear}` : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="label mb-1 text-muted">{F.decisions}</div>
                {c.decisions.length === 0 ? (
                  <p className="text-[13px] text-muted">{F.noDecisions}</p>
                ) : (
                  <ul className="space-y-1 text-[13px] text-navy">
                    {c.decisions.map((d) => (
                      <li key={d.id}>
                        {d.name}: <span className="text-muted">{d.from} → </span>
                        {d.to}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.section>
        ))}
      </div>
    </ViewFrame>
  )
}
