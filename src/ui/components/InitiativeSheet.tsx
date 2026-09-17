import type { PlanInitiative } from '../../engine'
import type { Initiative } from '../../engine/types'
import { planData } from '../../data'
import { strings } from '../../strings'
import { sarm, signed } from '../format'
import { triggerSentence } from '../triggerText'
import { useLevers } from '../../state/levers'
import { SideSheet } from './SideSheet'

type Props = { init: Initiative | null; plan: PlanInitiative | null; onClose: () => void }

const nameOf = (id: string) => planData.initiatives.initiatives.find((i) => i.id === id)?.name ?? id
const kpiName = (id: string) =>
  planData.objectives.scorecard.kpis.find((k) => k.id === id)?.name ?? id

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="label mb-1 text-muted">{label}</div>
      <div className="text-[14px] leading-relaxed text-navy">{children}</div>
    </div>
  )
}

/** The full RFQ initiative card. */
export function InitiativeSheet({ init, plan, onClose }: Props) {
  const L3 = useLevers((s) => s.levers.L3)
  const S = strings.portfolio.sheet
  const open = !!init && !!plan
  const status = plan ? strings.portfolio.columns[plan.status] : ''
  const start = plan?.startYear ?? init?.startYearEarliest ?? 0
  const end = init ? start + Math.max(1, init.rampYears) - 1 : 0
  const capacity = init?.capacityAddKt
    ? Object.entries(init.capacityAddKt)
        .map(([p, kt]) => `${kt} kt ${p}`)
        .join(', ')
    : null

  return (
    <SideSheet
      open={open}
      title={init?.name ?? ''}
      subtitle={
        init ? `${strings.portfolio.layers[init.layer] ?? init.layer} · ${init.owner}` : undefined
      }
      onClose={onClose}
    >
      {init && plan && (
        <>
          <Field label={S.cascade}>
            <ol data-testid="cascade-breadcrumb" className="cascade-breadcrumb">
              {(() => {
                const objective = planData.objectives.objectives.find(
                  (o) => o.id === init.objectives[0],
                )
                const shift = objective
                  ? planData.objectives.shifts.find((x) => x.id === objective.shift)
                  : undefined
                return (
                  <>
                    {shift && (
                      <li>
                        <span className="label text-muted">{strings.explain.levels.shift}</span>
                        <span>{shift.name}</span>
                      </li>
                    )}
                    {init.objectives.map((oid) => (
                      <li key={oid}>
                        <span className="label text-muted">{strings.explain.levels.objective}</span>
                        <span>
                          {planData.objectives.objectives.find((o) => o.id === oid)?.name ?? oid}
                        </span>
                      </li>
                    ))}
                    <li>
                      <span className="label text-muted">{strings.explain.levels.initiative}</span>
                      <span className="font-heading text-ink">{init.name}</span>
                    </li>
                  </>
                )
              })()}
            </ol>
            <div className="mt-2 text-[13px] text-muted">
              {S.plan}:{' '}
              <span className="text-navy">{strings.plans.names[init.plan] ?? init.plan}</span>
            </div>
          </Field>
          <Field label={S.status}>
            <span className="font-heading text-ink">{status}</span>
            <span className="text-muted"> · {triggerSentence(plan, L3)}</span>
          </Field>
          <Field label={S.objective}>{init.objective}</Field>
          <Field label={S.rationale}>{init.rationale}</Field>
          <Field label={S.impact}>
            <dl className="num grid grid-cols-2 gap-x-6 gap-y-1">
              <dt className="text-muted">{S.revenue}</dt>
              <dd>{signed(init.revenueRunRate)} SAR m</dd>
              <dt className="text-muted">{S.ebitda}</dt>
              <dd>{signed(plan.ebitdaRunRate)} SAR m</dd>
              <dt className="text-muted">{S.headcount}</dt>
              <dd>{signed(init.headcountDelta)}</dd>
              {capacity && (
                <>
                  <dt className="text-muted">{S.capacity}</dt>
                  <dd>{capacity}</dd>
                </>
              )}
            </dl>
          </Field>
          <Field label={S.investment}>
            <span className="num">
              SAR {sarm(init.capex)}m capex, {strings.portfolio.card.npv} {signed(plan.npv)} SAR m
            </span>
          </Field>
          <Field label={S.complexity}>{strings.portfolio.complexity[init.complexity]}</Field>
          <Field label={S.timeline}>
            <span className="num">
              {S.earliest} {init.startYearEarliest} · {S.ramp} {init.rampYears} {S.years}
              {plan.status !== 'out' && ` · ${S.startYear} ${start}`}
            </span>
          </Field>
          <Field label={S.owner}>{init.owner}</Field>
          <Field label={S.milestones}>
            <ul className="num list-none space-y-1">
              <li>
                <span className="text-muted">{start}</span> {S.startYear}
              </li>
              <li>
                <span className="text-muted">{end}</span> {S.rampComplete}
              </li>
            </ul>
          </Field>
          <Field label={S.dependencies}>
            {init.dependencies.length ? init.dependencies.map(nameOf).join(', ') : S.none}
          </Field>
          <Field label={S.risks}>
            <ul className="list-none space-y-1">
              {init.risks.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-coral">/</span>
                  {r}
                </li>
              ))}
            </ul>
          </Field>
          <Field label={S.projects}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className="label font-medium text-muted">{S.projectCols.project}</th>
                  <th className="label text-right font-medium text-muted">{S.projectCols.start}</th>
                  <th className="label text-right font-medium text-muted">
                    {S.projectCols.quarters}
                  </th>
                  <th className="label text-right font-medium text-muted">{S.projectCols.capex}</th>
                </tr>
              </thead>
              <tbody>
                {init.projects.map((p) => {
                  const shift = start - init.startYearEarliest
                  return (
                    <tr
                      key={p.id}
                      data-testid="sheet-project"
                      className="border-t border-line align-top"
                    >
                      <td className="py-1.5 pr-2">
                        <div className="text-navy">{p.name}</div>
                        <div className="text-[11px] text-muted">
                          {p.owner} · {S.deliverable}: {p.deliverable}
                        </div>
                      </td>
                      <td className="num py-1.5 text-right text-navy">{p.startYear + shift}</td>
                      <td className="num py-1.5 text-right text-navy">{p.durationQuarters}</td>
                      <td className="num py-1.5 text-right text-navy">{sarm(p.capex)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Field>
          <Field label={S.requirements}>
            <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1">
              <dt className="label text-muted">{S.people}</dt>
              <dd>{init.requirements.people}</dd>
              <dt className="label text-muted">{S.systems}</dt>
              <dd>{init.requirements.systems}</dd>
              <dt className="label text-muted">{S.decisions}</dt>
              <dd>
                <ul className="list-none space-y-1">
                  {init.requirements.decisions.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="text-teal-dim">/</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </Field>
          <Field label={S.kpis}>
            <ul className="list-none space-y-1">
              {init.kpis.map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="text-teal-dim">/</span>
                  {kpiName(k)}
                </li>
              ))}
            </ul>
          </Field>
        </>
      )}
    </SideSheet>
  )
}
