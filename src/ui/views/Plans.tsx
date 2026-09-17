import { motion } from 'framer-motion'
import { ViewFrame } from '../components/ViewFrame'
import { DeltaChip } from '../components/DeltaChip'
import { ExplainButton } from '../components/ExplainButton'
import { Slash } from '../components/Slash'
import { SiteCard } from '../components/SiteCard'
import { PeoplePanel } from '../components/PeoplePanel'
import { SupplyPanel } from '../components/SupplyPanel'
import { usePlan, useTrackedPlan, useData, presetPlans } from '../../state/plan'
import { strings } from '../../strings'
import { planCards } from '../plans'
import { sarm, signed } from '../format'

const dot: Record<string, string> = { in: 'bg-teal', deferred: 'bg-amber', out: 'bg-coral' }

export function Plans() {
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const base = presetPlans(useData()).base
  const cards = planCards(plan, base, tracked)
  const P = strings.plans
  const last = plan.years.length - 1
  const years = plan.years.slice(1)
  return (
    <ViewFrame id="plans">
      <div className="functional-briefs grid gap-6" data-tour="plans">
        {cards.map((c, k) => (
          <motion.section
            key={c.id}
            data-testid={`plan-${c.id}`}
            className="functional-brief"
            initial={{ opacity: 1, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: k * 0.04 }}
          >
            <div className="functional-brief-heading flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[20px] text-ink">
                  <Slash size={16} />
                  {c.name}
                  <ExplainButton traceKey={`plan.${c.id}`} />
                </h2>
                <div className="mt-0.5 text-[13px] text-muted">
                  <span className="label mr-2">{P.deliverable}</span>
                  {c.deliverable}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1" title={P.levers}>
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

            <div className="plan-columns">
              <div className="functional-brief-metrics">
                <div className="label mt-4 mb-1 text-muted">{P.kpis}</div>
                <table className="w-full text-[14px]">
                  <tbody>
                    {c.kpis.map((kp) => (
                      <tr key={kp.id} className="border-t border-line">
                        <td className="py-1.5 pr-2 text-navy">{kp.label}</td>
                        <td className="num py-1.5 text-right font-heading text-[16px] text-ink">
                          {kp.format(kp.value)}
                        </td>
                        <td className="py-1.5 pl-3 text-right">
                          <DeltaChip
                            delta={kp.delta}
                            format={(d) => `${d > 0 ? '+' : '−'}${kp.format(Math.abs(d))}`}
                            goodWhenUp={kp.goodWhenUp}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="plan-figures num mt-4">
                  <div>
                    <div className="label text-muted">{P.capexByYear}</div>
                    <div className="plan-capex-years">
                      {years.map((y, i) => (
                        <span key={y}>
                          <span className="text-[11px] text-muted">{y}</span>
                          <span className="text-ink">{sarm(c.rollup.capexByYear[i + 1])}</span>
                        </span>
                      ))}
                      <span>
                        <span className="text-[11px] text-muted">
                          {strings.financials.units.plan}
                        </span>
                        <span data-testid="plan-capex" className="font-heading text-ink">
                          {sarm(c.rollup.capexTotal)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="label text-muted">{P.headcount}</div>
                    <div data-testid="plan-headcount" className="font-heading text-[20px] text-ink">
                      {signed(c.rollup.headcountDelta)}
                      <span className="ml-1 text-[12px] font-normal text-muted">
                        {P.headcountHint}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="label mt-4 mb-1 text-muted">{P.projects}</div>
                {c.rollup.projects.length === 0 ? (
                  <p className="text-[13px] text-muted">{P.noProjects}</p>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left">
                        <th className="label font-medium text-muted">{P.cols.project}</th>
                        <th className="label font-medium text-muted">{P.cols.status}</th>
                        <th className="label text-right font-medium text-muted">{P.cols.start}</th>
                        <th className="label text-right font-medium text-muted">{P.cols.capex}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rollup.projects.map((pr) => (
                        <tr
                          key={pr.id}
                          data-testid="project-row"
                          data-initiative={pr.initiativeId}
                          data-status={pr.status}
                          className="border-t border-line align-top"
                        >
                          <td className="py-1.5 pr-2">
                            <div className="text-navy">{pr.name}</div>
                            <div className="text-[11px] text-muted">{pr.initiativeName}</div>
                          </td>
                          <td className="py-1.5 pr-2 whitespace-nowrap text-navy">
                            <span
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dot[pr.status]}`}
                            />
                            {strings.portfolio.columns[pr.status]}
                          </td>
                          <td className="num py-1.5 text-right text-navy">
                            {pr.status === 'out' ? '' : pr.startYear}
                          </td>
                          <td className="num py-1.5 text-right text-navy">{sarm(pr.capex)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="plan-needs mt-4">
              <div className="label mb-1 text-muted">{P.needs}</div>
              {c.rollup.projects.every((p) => p.status !== 'in') ? (
                <p className="text-[13px] text-muted">{P.nothingFunded}</p>
              ) : (
                <div className="plan-needs-grid text-[13px] text-navy">
                  <div>
                    <div className="label mb-1 text-muted">{P.people}</div>
                    <ul className="space-y-1">
                      {c.rollup.requirements.people.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="label mb-1 text-muted">{P.systems}</div>
                    <ul className="space-y-1">
                      {c.rollup.requirements.systems.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="label mb-1 text-muted">{P.decisions}</div>
                    <ul className="space-y-1">
                      {c.rollup.requirements.decisions.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="text-teal-dim">/</span>
                          {x}
                        </li>
                      ))}
                      {c.decisions.map((d) => (
                        <li key={`due-${d.id}`} className="flex gap-2">
                          <span className="text-coral">/</span>
                          <span>
                            {d.name}: <span className="text-muted">{d.from} to </span>
                            {d.to}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {c.id === 'operations' && (
              <div className="mt-6">
                <div className="label mb-2 text-muted">{P.sites}</div>
                <div data-tour="sites" className="operations-sites grid grid-cols-3 gap-6">
                  {plan.sites.map((s) => (
                    <SiteCard key={s.id} site={s} plan={plan} index={last} />
                  ))}
                </div>
                <div className="mt-6">
                  <SupplyPanel plan={plan} />
                </div>
              </div>
            )}
            {c.id === 'hr' && (
              <div className="mt-6" data-tour="people">
                <PeoplePanel plan={plan} index={last} />
              </div>
            )}
          </motion.section>
        ))}
      </div>
    </ViewFrame>
  )
}
