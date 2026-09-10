import type { ActualInputs } from '../../state/levers'
import { leverDefs, planData, type LeverId } from '../../data'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { leverValueLabel } from '../triggerText'
import { DeltaChip } from './DeltaChip'

const FIELD: Partial<Record<LeverId, keyof ActualInputs>> = {
  L1: 'L1multiplier',
  L2: 'L2',
  L6: 'L6',
}

/** Six levers: plan assumption, an actual for the tracked fields, and a status. */
export function TrackerTable() {
  const T = strings.tracker
  const levers = useLevers((s) => s.levers)
  const actuals = useLevers((s) => s.actuals)
  const setActual = useLevers((s) => s.setActual)
  const clearActuals = useLevers((s) => s.clearActuals)
  const year = planData.assumptions.tracker.editableYear
  const tracked = new Set(planData.assumptions.tracker.fields)

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th className="label px-3 py-2 font-medium text-muted">{T.cols.lever}</th>
            <th className="label px-3 py-2 font-medium text-muted">{T.cols.plan}</th>
            <th className="label px-3 py-2 font-medium text-muted">{T.cols.actual(year)}</th>
            <th className="label px-3 py-2 font-medium text-muted">{T.cols.status}</th>
          </tr>
        </thead>
        <tbody>
          {leverDefs.map((def) => {
            const field = FIELD[def.id]
            const editable = !!field && tracked.has(def.id === 'L1' ? 'L1.multiplier' : def.id)
            const planValue = def.id === 'L1' ? levers.L1.multiplier : (levers[def.id] as number)
            const actual = field ? actuals[field] : undefined
            const delta = actual !== undefined ? actual - planValue : 0
            const status = !editable
              ? ''
              : actual === undefined
                ? T.awaiting
                : Math.abs(delta) < 1e-9
                  ? T.onPlan
                  : delta > 0
                    ? T.above
                    : T.below
            const goodWhenUp = def.id === 'L1'
            return (
              <tr
                key={def.id}
                data-testid={`tracker-row-${def.id}`}
                className="border-t border-line align-middle text-navy"
              >
                <td className="px-3 py-2.5" data-testid="tracker-row">
                  <span className="label mr-2 text-muted">{def.id}</span>
                  <span className="font-heading text-ink">{def.name}</span>
                </td>
                <td className="num px-3 py-2.5">{leverValueLabel(def.id, planValue)}</td>
                <td className="px-3 py-2.5">
                  {editable && field ? (
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        aria-label={`Actual ${def.id}`}
                        inputMode="decimal"
                        step={def.id === 'L1' ? 0.05 : def.id === 'L6' ? 40 : 5}
                        min={def.id === 'L1' ? 0.7 : def.id === 'L6' ? 0 : 80}
                        max={def.id === 'L1' ? 1.3 : def.id === 'L6' ? 120 : 160}
                        value={actual ?? ''}
                        onChange={(e) =>
                          setActual(
                            field,
                            e.target.value === '' ? undefined : Number(e.target.value),
                          )
                        }
                        className="num w-24 rounded-md border border-line bg-white px-2 py-1 text-[14px] text-ink outline-none transition-colors duration-150 focus:border-teal-dim"
                      />
                      <span className="text-[11px] text-muted">{T.inputHint[field]}</span>
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted">{T.notTracked}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span data-testid="status" className="flex items-center gap-2">
                    <span className={actual === undefined ? 'text-muted' : 'text-ink'}>
                      {status}
                    </span>
                    {actual !== undefined && Math.abs(delta) > 1e-9 && (
                      <DeltaChip
                        delta={delta}
                        format={(d) =>
                          def.id === 'L1'
                            ? `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}x`
                            : `${d > 0 ? '+' : '−'}${Math.abs(d)}`
                        }
                        goodWhenUp={goodWhenUp}
                        label=""
                      />
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-line bg-sand-2/50 px-3 py-2 text-[12px] text-muted">
        <span>{T.ownership}</span>
        <button
          type="button"
          onClick={clearActuals}
          className="rounded-full border border-line px-3 py-1 font-heading text-[12px] text-navy transition-colors duration-150 hover:border-ink"
        >
          {T.clear}
        </button>
      </div>
    </div>
  )
}
