import { useState } from 'react'
import { planData } from '../../data'
import { useLevers } from '../../state/levers'
import { usePlan, useTrackedPlan } from '../../state/plan'
import { strings } from '../../strings'
import { fmtKpi } from '../kpiFormat'
import { triggerSentence } from '../triggerText'
import { Card } from './Card'

const TRACKED: string[] = ['L1', 'L2', 'L6']

/** Pick a quarter: the KPIs due, the triggers evaluated on the typed actuals, and the decisions due. */
export function QuarterlyReview() {
  const T = strings.tracker.quarterly
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const L3 = useLevers((s) => s.levers.L3)
  const first = planData.assumptions.tracker.editableYear
  const quarters = [first, first + 1].flatMap((y) => [1, 2, 3, 4].map((q) => ({ y, q })))
  const [pick, setPick] = useState(quarters[0])
  const yi = plan.years.indexOf(pick.y)
  const due = plan.scorecard.filter((k) => k.cadence === 'quarterly' || pick.q === 4)
  const inits = planData.initiatives.initiatives
  const fired = Object.fromEntries(tracked.triggersFired.map((t) => [t.id, t]))
  const evaluated = inits
    .filter((i) => i.rules.some((r) => TRACKED.includes(r.leverId)))
    .map((i) => ({
      id: i.id,
      name: i.name,
      rule: i.rules.find((r) => TRACKED.includes(r.leverId))!,
      now: tracked.initiatives.find((x) => x.id === i.id)!,
      fired: fired[i.id],
    }))
  const starting = tracked.plans
    .flatMap((p) => p.projects)
    .filter((p) => p.status === 'in' && p.startYear === pick.y && pick.q === 1)
  const decisions = [
    ...tracked.triggersFired.map((t) => ({
      id: `fired-${t.id}`,
      who: inits.find((i) => i.id === t.id)?.name ?? t.id,
      text: strings.tracker.decisions[t.to],
    })),
    ...starting.map((p) => ({
      id: `start-${p.id}`,
      who: `${p.initiativeName}, ${p.owner}`,
      text: `${p.name} ${T.starts} ${p.startYear}`,
    })),
  ]
  const name = Object.fromEntries(inits.map((i) => [i.id, i.name]))
  void name

  return (
    <div data-testid="quarterly-review" data-tour="quarterly">
      <p className="mb-4 text-[14px] text-navy">{T.lead}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="label mr-2 text-muted">{T.quarter}</span>
        <span role="radiogroup" aria-label={T.quarter} className="scorecard-years">
          {quarters.map((qq) => {
            const active = qq.y === pick.y && qq.q === pick.q
            return (
              <button
                key={`${qq.y}-${qq.q}`}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPick(qq)}
                className={`num ${active ? 'is-active' : ''}`}
              >
                Q{qq.q} {qq.y}
              </button>
            )
          })}
        </span>
      </div>
      <div className="quarterly-grid">
        <Card title={T.kpisDue} testId="kpis-due">
          {due.length === 0 ? (
            <p className="text-[13px] text-muted">{T.noKpis}</p>
          ) : (
            <ul className="space-y-1.5 text-[13px] text-navy">
              {due.map((k) => {
                const target = k.targets[String(pick.y)]
                const live = k.live && yi >= 0 ? k.live[yi] : undefined
                return (
                  <li
                    key={k.id}
                    data-testid="kpi-due"
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span>
                      <span className="num mr-1.5 text-[11px] text-muted">{k.id}</span>
                      {k.name}
                      <span className="ml-1.5 text-[11px] text-muted">
                        {k.cadence === 'quarterly' ? T.quarterlyTag : T.annualTag}
                      </span>
                    </span>
                    <span className="num whitespace-nowrap text-muted">
                      {live !== undefined ? fmtKpi(live, k.unit) : ''}
                      {target !== undefined ? ` / ${fmtKpi(target, k.unit)}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        <Card title={T.triggersEvaluated} testId="triggers-evaluated">
          {evaluated.length === 0 ? (
            <p className="text-[13px] text-muted">{T.noTriggers}</p>
          ) : (
            <ul className="space-y-2 text-[13px] text-navy">
              {evaluated.map((e) => (
                <li key={e.id} data-testid="trigger-evaluated">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-heading text-ink">{e.name}</span>
                    <span className={`label ${e.fired ? 'text-coral' : 'text-teal-dim'}`}>
                      {e.fired ? T.fires : T.holds}
                    </span>
                  </div>
                  <div className="text-muted">
                    {e.rule.leverId} {T.reads} {e.rule.label} · {triggerSentence(e.now, L3)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={T.decisionsDue} testId="decisions-due">
          {decisions.length === 0 ? (
            <p className="text-[13px] text-muted">{T.noDecisions}</p>
          ) : (
            <ul className="space-y-1.5 text-[13px] text-navy">
              {decisions.map((d) => (
                <li key={d.id} className="flex gap-2">
                  <span className="text-teal-dim">/</span>
                  <span>
                    <span className="font-heading text-ink">{d.who}</span>
                    <br />
                    <span>{d.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
