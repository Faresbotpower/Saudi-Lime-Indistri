import type { PlanResult } from '../../engine'
import { strings } from '../../strings'
import { sarm } from '../format'
import { Card } from './Card'
import { ExplainButton } from './ExplainButton'

/** The three-line derivation of a capital envelope, shown when L3 is set to Derived. */
export function EnvelopeCard({ plan }: { plan: PlanResult }) {
  const E = strings.financials.envelope
  const d = plan.envelopeDerivation
  if (!d)
    return (
      <Card title={E.title} lead={E.lead} className="envelope-card" testId="envelope-card">
        <p className="text-[13px] text-muted">{E.hint}</p>
      </Card>
    )
  const rows: [string, number, string][] = [
    [E.cash, d.cashGenerated, 'cash'],
    [E.committed, -d.committed, 'committed'],
    [E.available, d.available, 'available'],
  ]
  return (
    <Card title={E.title} lead={E.lead} className="envelope-card" testId="envelope-card">
      <div className="mb-2 flex items-center gap-2">
        <ExplainButton traceKey="envelope" />
      </div>
      <table className="num w-full text-[14px]">
        <tbody>
          {rows.map(([label, v, id]) => (
            <tr key={id} data-testid={`envelope-${id}`} className="border-t border-line">
              <td className="py-1.5 pr-2 text-navy">
                {label}
                {id === 'available' && (
                  <span className="ml-2 text-[12px] text-muted">
                    {E.debt} {sarm(d.debtCapacity)}
                  </span>
                )}
              </td>
              <td className="py-1.5 text-right font-heading text-[16px] text-ink">
                {v < 0 ? '−' : ''}
                {sarm(Math.abs(v))}
              </td>
            </tr>
          ))}
          <tr className="border-t border-ink">
            <td className="py-1.5 pr-2 font-heading text-ink">{E.envelope}</td>
            <td
              data-testid="envelope-value"
              className="py-1.5 text-right font-heading text-[20px] text-ink"
            >
              SAR {sarm(d.envelope)}m
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}
