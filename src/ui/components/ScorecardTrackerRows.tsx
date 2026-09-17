import type { ActualInputs } from '../../state/levers'
import { planData } from '../../data'
import { useLevers } from '../../state/levers'
import { usePlan, useTrackedPlan } from '../../state/plan'
import { strings } from '../../strings'
import { fmtKpi } from '../kpiFormat'
import { DeltaChip } from './DeltaChip'

/** Lead KPIs map to the tracker's typed actuals; the scale converts the KPI reading to the lever value. */
const LEAD: Record<
  string,
  { field: keyof ActualInputs; toLever: (v: number) => number; toKpi: (v: number) => number }
> = {
  'levers.L1': { field: 'L1multiplier', toLever: (v) => v / 100, toKpi: (v) => v * 100 },
  'levers.L2': { field: 'L2', toLever: (v) => v, toKpi: (v) => v },
  'levers.L6': { field: 'L6', toLever: (v) => v, toKpi: (v) => v },
}

/** Every scorecard KPI against its target for the tracked year; lead indicators take a typed actual. */
export function ScorecardTrackerRows() {
  const T = strings.tracker
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const actuals = useLevers((s) => s.actuals)
  const setActual = useLevers((s) => s.setActual)
  const year = planData.assumptions.tracker.editableYear
  const yi = plan.years.indexOf(year)
  return (
    <div
      className="analytics-table-scroll trackertable mt-6 rounded-lg border border-line"
      data-tour="scorecard-rows"
    >
      <div className="border-b border-line bg-sand-2 px-3 py-2">
        <div className="font-heading text-[15px] text-ink">{T.scorecardRows}</div>
        <div className="text-[12px] text-muted">{T.scorecardLead(year)}</div>
      </div>
      <table className="w-full text-[16px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {T.kpiCols.kpi}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {T.kpiCols.target(year)}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {T.kpiCols.plan(year)}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {T.cols.actual(year)}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {T.cols.status}
            </th>
          </tr>
        </thead>
        <tbody>
          {plan.scorecard.map((k) => {
            const lead = k.computedFrom ? LEAD[k.computedFrom] : undefined
            const target = k.targets[String(year)]
            const planValue = k.live ? k.live[yi] : undefined
            const trackedValue = tracked.scorecard.find((x) => x.id === k.id)?.live?.[yi]
            const typed = lead ? actuals[lead.field] : undefined
            const actual = lead
              ? typed !== undefined
                ? lead.toKpi(typed)
                : undefined
              : trackedValue
            const ref = lead ? planValue : target
            const delta = actual !== undefined && ref !== undefined ? actual - ref : 0
            const status =
              actual === undefined || ref === undefined
                ? ''
                : Math.abs(delta) < 1e-9
                  ? T.onPlan
                  : delta > 0
                    ? T.above
                    : T.below
            return (
              <tr
                key={k.id}
                data-testid="kpi-row"
                className="border-t border-line align-middle text-navy"
              >
                <td className="px-3 py-2">
                  <span className="label mr-2 text-muted">{k.id}</span>
                  <span className="font-heading text-ink">{k.name}</span>
                  <span className="ml-2 text-[12px] text-muted">{k.unit}</span>
                  {k.lead && (
                    <span className="label ml-2 rounded-full bg-teal/15 px-2 py-0.5 text-teal-dim">
                      {T.leadTyped}
                    </span>
                  )}
                </td>
                <td className="num px-3 py-2">
                  {target !== undefined ? fmtKpi(target, k.unit) : ''}
                </td>
                <td className="num px-3 py-2">
                  {planValue !== undefined ? (
                    fmtKpi(planValue, k.unit)
                  ) : (
                    <span className="text-[13px] text-muted">{T.entered}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {lead ? (
                    <input
                      type="number"
                      aria-label={`Actual ${k.id}`}
                      inputMode="decimal"
                      step={
                        k.computedFrom === 'levers.L1' ? 5 : k.computedFrom === 'levers.L6' ? 40 : 5
                      }
                      value={actual !== undefined ? Math.round(actual * 100) / 100 : ''}
                      onChange={(e) =>
                        setActual(
                          lead.field,
                          e.target.value === '' ? undefined : lead.toLever(Number(e.target.value)),
                        )
                      }
                      className="num w-24 rounded-md border border-line bg-white px-2 py-1 text-[14px] text-ink outline-none transition-colors duration-150 focus:border-teal-dim"
                    />
                  ) : k.live ? (
                    <span className="num" title={T.readLive}>
                      {trackedValue !== undefined ? fmtKpi(trackedValue, k.unit) : ''}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted">{T.entered}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className={status ? 'text-ink' : 'text-muted'}>{status}</span>
                    {actual !== undefined && ref !== undefined && Math.abs(delta) > 1e-9 && (
                      <DeltaChip
                        delta={delta}
                        format={(d) => `${d > 0 ? '+' : '−'}${fmtKpi(Math.abs(d), k.unit)}`}
                        goodWhenUp={k.direction === 'up'}
                        label={
                          lead
                            ? strings.financials.vsBase.replace('Base', 'plan')
                            : T.kpiCols.target(year).toLowerCase()
                        }
                      />
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
