import { useLevers } from '../../state/levers'
import { usePlan } from '../../state/plan'
import { strings } from '../../strings'
import { leverValueLabel } from '../triggerText'
import { SideSheet } from './SideSheet'
import { cascadeFor } from '../cascade'
import { planData } from '../../data'

const humanize = (rule: string) =>
  strings.explain.rules[rule] ?? rule.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const fmtValue = (v: number | string): string =>
  typeof v === 'number'
    ? Number.isInteger(v)
      ? String(v)
      : Math.abs(v) < 10
        ? v.toFixed(2)
        : v.toFixed(1)
    : v

/** Lists the trace entries behind one number, with the lever values applied. */
export function ExplainSheet() {
  const key = useLevers((s) => s.explainKey)
  const close = useLevers((s) => s.closeExplain)
  const levers = useLevers((s) => s.levers)
  const plan = usePlan()
  const E = strings.explain
  const entries = key ? (plan.trace[key] ?? []) : []
  const chain = key ? cascadeFor(key, planData, plan) : []
  return (
    <SideSheet
      open={!!key}
      title={E.title}
      subtitle={key ? `${E.lead} ${key}` : undefined}
      onClose={close}
    >
      {chain.length > 0 && (
        <div className="mb-5" data-testid="explain-cascade">
          <div className="font-heading text-[14px] text-ink">{E.cascade}</div>
          <p className="mb-2 text-[12px] text-muted">{E.cascadeLead}</p>
          <ol className="cascade-breadcrumb">
            {chain.map((n, i) => (
              <li key={`${n.level}-${n.id}-${i}`} data-level={n.level}>
                <span className="label text-muted">{E.levels[n.level]}</span>
                <span
                  className={
                    n.id === key?.split('.').slice(1).join('.') ? 'font-heading text-ink' : ''
                  }
                >
                  {n.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {entries.length === 0 ? (
        <p className="text-[14px] text-muted">{E.none}</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((t, i) => (
            <li
              key={`${t.rule}-${t.assumptionKey}-${i}`}
              data-testid="trace-entry"
              className="rounded-lg border border-line p-3"
            >
              <div className="font-heading text-[14px] text-ink">{humanize(t.rule)}</div>
              <dl className="num mt-1 grid grid-cols-[90px_1fr] gap-x-3 gap-y-0.5 text-[13px]">
                <dt className="label text-muted">{E.assumption}</dt>
                <dd className="break-all text-navy">{t.assumptionKey}</dd>
                {t.leverId && (
                  <>
                    <dt className="label text-muted">{E.lever}</dt>
                    <dd>
                      <span className="rounded-chip bg-teal/15 px-1.5 py-0.5 text-[13px] text-teal-dim">
                        {t.leverId}
                      </span>
                      <span className="ml-2 text-navy">
                        {leverValueLabel(
                          t.leverId,
                          t.leverId === 'L1' ? levers.L1.multiplier : (levers[t.leverId] as number),
                        )}
                      </span>
                    </dd>
                  </>
                )}
                <dt className="label text-muted">{E.value}</dt>
                <dd className="text-ink">{fmtValue(t.value)}</dd>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </SideSheet>
  )
}
