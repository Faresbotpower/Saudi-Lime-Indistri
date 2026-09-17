import { useState } from 'react'
import { ViewFrame } from '../components/ViewFrame'
import { Card } from '../components/Card'
import { DeltaChip } from '../components/DeltaChip'
import { ExplainButton } from '../components/ExplainButton'
import { Slash } from '../components/Slash'
import { usePlan } from '../../state/plan'
import { planData } from '../../data'
import { strings } from '../../strings'
import { fmtKpi, kpiDelta } from '../kpiFormat'
import type { ScorecardRow } from '../../engine'

const statusTone: Record<string, string> = {
  on_track: 'bg-teal/15 text-teal-dim',
  at_risk: 'bg-amber/20 text-[#8a5a00]',
  unfunded: 'bg-coral/12 text-coral',
}

/** Initiatives whose rules read the lever behind a lead KPI. */
function triggersReading(row: ScorecardRow) {
  const lever = row.computedFrom?.startsWith('levers.') ? row.computedFrom.slice(7) : null
  if (!lever) return []
  return planData.initiatives.initiatives
    .filter((i) => i.rules.some((r) => r.leverId === lever))
    .map((i) => ({
      id: i.id,
      name: i.name,
      label: i.rules.find((r) => r.leverId === lever)!.label,
    }))
}

export function Scorecard() {
  const plan = usePlan()
  const S = strings.scorecard
  const years = plan.years.slice(1)
  const [year, setYear] = useState(years[years.length - 1])
  const yi = plan.years.indexOf(year)
  const perspectives = planData.objectives.scorecard.perspectives
  const liveCount = plan.scorecard.filter((k) => k.live).length
  const objectives = planData.objectives.objectives
  const status = Object.fromEntries(plan.objectives.map((o) => [o.id, o]))

  return (
    <ViewFrame id="scorecard">
      <div className="scorecard-toolbar" data-tour="scorecard-year">
        <div>
          <span className="label mr-3 text-muted">{S.year}</span>
          <span role="radiogroup" aria-label={S.year} className="scorecard-years">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="radio"
                aria-checked={y === year}
                onClick={() => setYear(y)}
                className={`num ${y === year ? 'is-active' : ''}`}
              >
                {y}
              </button>
            ))}
          </span>
          <span className="ml-3 text-[13px] text-muted">{S.yearHint}</span>
        </div>
        <span className="num text-[13px] text-muted">
          {S.count(plan.scorecard.length, liveCount)}
        </span>
      </div>

      <div className="scorecard-grid" data-tour="scorecard">
        {perspectives.map((p) => (
          <section key={p} data-testid={`perspective-${p}`} className="scorecard-perspective">
            <h2 className="flex items-center gap-2 text-[20px] text-ink">
              <Slash size={14} />
              {S.perspectives[p]}
            </h2>
            <table className="scorecard-table w-full text-[14px]">
              <thead>
                <tr className="text-left">
                  <th className="label font-medium text-muted">{S.cols.kpi}</th>
                  <th className="label text-right font-medium text-muted">{S.cols.baseline}</th>
                  <th className="label text-right font-medium text-muted">{S.cols.targets}</th>
                  <th className="label text-right font-medium text-muted">{S.cols.live}</th>
                  <th className="label text-right font-medium text-muted">{S.cols.vsTarget}</th>
                </tr>
              </thead>
              <tbody>
                {plan.scorecard
                  .filter((k) => k.perspective === p)
                  .map((k) => {
                    const target = k.targets[String(year)]
                    const live = k.live ? k.live[yi] : undefined
                    const triggers = k.lead ? triggersReading(k) : []
                    return (
                      <tr
                        key={k.id}
                        data-testid={`kpi-row-${k.id}`}
                        className="border-t border-line align-top"
                      >
                        <td data-testid="kpi-row" className="py-2 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="num text-[11px] text-muted">{k.id}</span>
                            <span className="font-heading text-ink">{k.name}</span>
                            {k.lead && (
                              <span
                                className="label rounded-full bg-teal/15 px-2 py-0.5 text-teal-dim"
                                title={S.leadHint}
                              >
                                {S.lead}
                              </span>
                            )}
                            <ExplainButton traceKey={`kpi.${k.id}`} />
                          </div>
                          <div className="text-[12px] text-muted">{k.unit}</div>
                          {k.lead && (
                            <div className="mt-1 text-[12px] text-navy">
                              <span className="label mr-2 text-muted">{S.triggers}</span>
                              {triggers.length === 0
                                ? S.noTriggers
                                : triggers.map((t) => (
                                    <span key={t.id} className="mr-2 inline-block" title={t.label}>
                                      {t.name}
                                    </span>
                                  ))}
                            </div>
                          )}
                        </td>
                        <td data-testid="kpi-baseline" className="num py-2 text-right text-navy">
                          {fmtKpi(k.baseline2026, k.unit)}
                        </td>
                        <td className="num py-2 text-right">
                          <span className="scorecard-targets">
                            {years.map((y) => (
                              <span
                                key={y}
                                className={y === year ? 'is-active' : ''}
                                title={String(y)}
                              >
                                {k.targets[String(y)] !== undefined
                                  ? fmtKpi(k.targets[String(y)], k.unit)
                                  : '·'}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td
                          data-testid="kpi-live"
                          className="num py-2 text-right font-heading text-[16px] text-ink"
                        >
                          {live !== undefined ? (
                            fmtKpi(live, k.unit)
                          ) : (
                            <span
                              className="text-[12px] font-normal text-muted"
                              title={S.enteredHint}
                            >
                              {S.entered}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {live !== undefined && target !== undefined && (
                            <DeltaChip
                              delta={kpiDelta(live, target)}
                              format={(d) => `${d > 0 ? '+' : '−'}${fmtKpi(Math.abs(d), k.unit)}`}
                              goodWhenUp={k.direction === 'up'}
                              label={S.vsTargetChip}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <Card title={S.okrs} lead={S.okrsLead} className="mt-6" tour="okrs">
        <div className="okr-grid">
          {objectives.map((o) => {
            const r = status[o.id]
            return (
              <article key={o.id} data-testid="okr-objective" className="okr-objective">
                <div data-testid={`okr-${o.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="num text-[11px] text-muted">
                      {o.id} · {S.perspectives[o.perspective]}
                    </span>
                    <span className={`label rounded-full px-2 py-0.5 ${statusTone[r.status]}`}>
                      {strings.cascade.status[r.status]}
                    </span>
                  </div>
                  <h3 className="mt-1 font-heading text-[15px] leading-snug text-ink">{o.name}</h3>
                  <div className="mt-0.5 text-[13px] text-muted">{o.owner}</div>
                  <ul className="mt-2 space-y-1 text-[13px] text-navy">
                    {o.okrs.map((kr, i) => (
                      <li key={`${kr.kr}-${i}`} className="flex gap-2">
                        <span className="text-teal-dim">/</span>
                        <span>
                          {kr.kr}: <span className="num">{kr.target}</span> {S.by}{' '}
                          <span className="num">{kr.by}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </Card>
    </ViewFrame>
  )
}
