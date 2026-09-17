import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { PlanResult } from '../../engine'
import { planData } from '../../data'
import { useLevers } from '../../state/levers'
import { useTrackedPlan } from '../../state/plan'
import { strings } from '../../strings'
import { buildGraph, litPath, type Hover } from '../strataGraph'
import { sarm } from '../format'
import { ExplainButton } from './ExplainButton'
import { Slash } from './Slash'

const statusTone: Record<string, string> = {
  on_track: 'bg-teal/15 text-teal-dim',
  at_risk: 'bg-amber/20 text-[#8a5a00]',
  unfunded: 'bg-coral/12 text-coral',
}

const fmtTarget = (metric: string, value: number) => {
  const kpi = planData.objectives.scorecard.kpis.find((k) => k.id === metric)
  if (!kpi) return String(value)
  return `${kpi.name} ${value} ${kpi.unit}`
}

/** The shift agenda and the objectives it cascades into, above the strata. Hover a shift to light what it reaches. */
export function CascadeBand({ plan }: { plan: PlanResult }) {
  const C = strings.cascade
  const hoveredLever = useLevers((s) => s.hoveredLever)
  const hoveredShift = useLevers((s) => s.hoveredShift)
  const setHoveredShift = useLevers((s) => s.setHoveredShift)
  const tracked = useTrackedPlan()
  const open = useLevers((s) => s.openShift)
  const setOpen = useLevers((s) => s.setOpenShift)
  const graph = useMemo(() => buildGraph(planData, plan), [plan])
  const hover = useMemo<Hover | null>(
    () =>
      hoveredShift
        ? { kind: 'shift', id: hoveredShift }
        : hoveredLever
          ? { kind: 'lever', id: hoveredLever }
          : null,
    [hoveredShift, hoveredLever],
  )
  const lit = useMemo(() => litPath(graph, hover), [graph, hover])
  const anyLit = hover !== null
  const shifts = planData.objectives.shifts
  const byObjective = Object.fromEntries(plan.objectives.map((o) => [o.id, o]))
  const counts = {
    on_track: plan.objectives.filter((o) => o.status === 'on_track').length,
    at_risk: plan.objectives.filter((o) => o.status === 'at_risk').length,
    unfunded: plan.objectives.filter((o) => o.status === 'unfunded').length,
  }
  const openShift = open ? shifts.find((s) => s.id === open) : null
  const objectives = openShift
    ? planData.objectives.objectives.filter((o) => o.shift === openShift.id)
    : []
  const count = (s: string) => plan.initiatives.filter((i) => i.status === s).length
  const initName = Object.fromEntries(planData.initiatives.initiatives.map((i) => [i.id, i.name]))

  return (
    <section data-testid="cascade-band" data-tour="cascade" className="cascade-band">
      <div className="cascade-heading">
        <div>
          <h2 className="flex items-center gap-2 text-[20px] text-ink">
            <Slash size={16} />
            {C.title}
          </h2>
          <p className="mt-0.5 text-[14px] text-muted">{C.lead}</p>
        </div>
        <p className="num shrink-0 text-[13px] text-muted" aria-live="polite">
          {C.summary(
            shifts.length,
            plan.objectives.length,
            counts.on_track,
            counts.at_risk,
            counts.unfunded,
          )}
        </p>
      </div>

      <ol className="cascade-shifts" aria-label={C.shifts}>
        {shifts.map((s, i) => {
          const isLit = lit.shifts.includes(s.id)
          const isOpen = open === s.id
          return (
            <li key={s.id} data-testid="shift">
              <button
                type="button"
                data-testid={`shift-${s.id}`}
                data-lit={isLit ? 'true' : 'false'}
                data-open={isOpen ? 'true' : 'false'}
                aria-expanded={isOpen}
                aria-controls="cascade-objectives"
                className={`cascade-shift${isLit ? ' is-lit' : anyLit ? ' is-dim' : ''}${isOpen ? ' is-open' : ''}`}
                onMouseEnter={() => setHoveredShift(s.id)}
                onMouseLeave={() => setHoveredShift(null)}
                onFocus={() => setHoveredShift(s.id)}
                onBlur={() => setHoveredShift(null)}
                onClick={() => setOpen(isOpen ? null : s.id)}
              >
                <span className="cascade-shift-index num">{String(i + 1).padStart(2, '0')}</span>
                <span className="cascade-shift-name">{s.name}</span>
                <span className="cascade-shift-meta">
                  <span>{planData.objectives.pathways[s.pathway]}</span>
                  <span className="num">{s.levers.join(' ')}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div id="cascade-objectives" aria-live="polite">
        {openShift && (
          <motion.div
            key={openShift.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="cascade-objectives"
          >
            <div className="cascade-driver">
              <span className="label text-muted">{C.driver}</span>
              <p>{openShift.driver}</p>
              <span className="label text-muted">{C.evidence}</span>
              <p>{openShift.evidence.join(', ')}</p>
            </div>
            <div className="cascade-objective-grid">
              {objectives.map((o) => {
                const r = byObjective[o.id]
                return (
                  <article
                    key={o.id}
                    data-testid={`objective-${o.id}`}
                    data-lit={lit.objectives.includes(o.id) ? 'true' : 'false'}
                    className="cascade-objective"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="num text-[11px] text-muted">{o.id}</div>
                      <span className="flex items-center gap-1.5">
                        <ExplainButton traceKey={`objective.${o.id}`} />
                        <span className={`label rounded-full px-2 py-0.5 ${statusTone[r.status]}`}>
                          {C.status[r.status]}
                        </span>
                      </span>
                    </div>
                    <h3 className="mt-1 font-heading text-[15px] leading-snug text-ink">
                      {o.name}
                    </h3>
                    <dl className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-0.5 text-[13px]">
                      <dt className="label text-muted">{C.owner}</dt>
                      <dd className="text-navy">{o.owner}</dd>
                      <dt className="label text-muted">{C.target}</dt>
                      <dd className="num text-navy">
                        {fmtTarget(o.target.metric, o.target.value)} by {o.target.year}
                      </dd>
                      <dt className="label text-muted">{C.initiatives}</dt>
                      <dd className="text-navy">
                        {r.initiatives.map((i) => (
                          <span key={i.id} className="mr-1 inline-flex items-center gap-1">
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${
                                i.status === 'in'
                                  ? 'bg-teal'
                                  : i.status === 'deferred'
                                    ? 'bg-amber'
                                    : 'bg-coral'
                              }`}
                            />
                            {initName[i.id]}
                          </span>
                        ))}
                      </dd>
                    </dl>
                  </article>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      <div data-testid="board-view" className="cascade-board">
        <div className="cascade-board-title">
          <span className="label text-muted">{C.board}</span>
          <span className="text-[13px] text-muted">{C.boardLead}</span>
        </div>
        <dl className="cascade-board-kpis num">
          {(
            [
              ['inPlan', count('in'), ''],
              ['deferred', count('deferred'), ''],
              ['out', count('out'), ''],
              ['headroom', plan.capital.headroom, 'SAR m'],
              ['diversification', Math.round(plan.diversificationShare2031 * 100), '%'],
            ] as [string, number, string][]
          ).map(([id, v, unit]) => (
            <div key={id}>
              <dt className="label text-muted">{C.boardKpis[id]}</dt>
              <dd data-testid={`board-${id}`} className="font-heading text-[20px] text-ink">
                {sarm(v)}
                {unit && <span className="ml-1 text-[12px] text-muted">{unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
        <div className="cascade-board-decisions">
          <span className="label text-muted">{C.decisions}</span>
          {tracked.triggersFired.length === 0 ? (
            <p className="text-[13px] text-muted">{C.noDecisions}</p>
          ) : (
            <ul className="text-[13px] text-navy">
              {tracked.triggersFired.map((t) => (
                <li key={t.id}>
                  {initName[t.id]}: {strings.portfolio.columns[t.from]} to{' '}
                  {strings.portfolio.columns[t.to]}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
