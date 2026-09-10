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
          <Field label={S.kpis}>
            <ul className="list-none space-y-1">
              {init.kpis.map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="text-teal-dim">/</span>
                  {k}
                </li>
              ))}
            </ul>
          </Field>
        </>
      )}
    </SideSheet>
  )
}
