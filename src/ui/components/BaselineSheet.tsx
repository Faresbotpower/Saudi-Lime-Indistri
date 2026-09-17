import { planData } from '../../data'
import { useLevers } from '../../state/levers'
import { usePlan } from '../../state/plan'
import { strings } from '../../strings'
import { pct1, sarm } from '../format'
import { SideSheet } from './SideSheet'

/** The 2026 actuals the model is calibrated to, with the five-year history behind them. */
export function BaselineSheet() {
  const open = useLevers((s) => s.baselineOpen)
  const setOpen = useLevers((s) => s.setBaselineOpen)
  const setInputsOpen = useLevers((s) => s.setInputsOpen)
  const plan = usePlan()
  const a = planData.assumptions
  const S = strings.financials.baselineSheet
  const history = a.history
  const price = plan.trace['calibration']?.find((t) => t.assumptionKey === 'calibration.price')
  const cost = plan.trace['calibration']?.find((t) => t.assumptionKey === 'calibration.cost')
  const rows: [string, string, string][] = [
    ['revenue', `${sarm(a.baseCase.revenue)}`, 'SAR m'],
    ['ebitda', `${sarm(a.baseCase.ebitda)}`, 'SAR m'],
    ['capex', `${sarm(a.baseCase.capex)}`, 'SAR m'],
    ['headcount', `${sarm(a.baseCase.headcount)}`, ''],
    ['saudization', `${Math.round(a.baseCase.saudization * 100)}`, '%'],
  ]
  return (
    <SideSheet open={open} title={S.title} subtitle={S.lead} onClose={() => setOpen(false)}>
      <div className="mb-5">
        <div className="label mb-1 text-muted">{S.actuals}</div>
        <dl className="num grid grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
          {rows.map(([id, v, unit]) => (
            <div key={id} className="contents">
              <dt className="text-muted">{S.rows[id as keyof typeof S.rows]}</dt>
              <dd data-testid={`baseline-${id}`} className="text-ink">
                {v}
                {unit && <span className="ml-1 text-[12px] text-muted">{unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[12px] text-muted">{strings.financials.deliverable}</p>
      </div>
      {history && (
        <div className="mb-5">
          <div className="label mb-1 text-muted">{S.history}</div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left">
                <th className="label font-medium text-muted">{S.cols.year}</th>
                <th className="label text-right font-medium text-muted">{S.cols.revenue}</th>
                <th className="label text-right font-medium text-muted">{S.cols.ebitda}</th>
                <th className="label text-right font-medium text-muted">{S.cols.margin}</th>
              </tr>
            </thead>
            <tbody className="num">
              {history.years.map((y, i) => (
                <tr key={y} className="border-t border-line">
                  <td className="py-1 text-navy">{y}</td>
                  <td className="py-1 text-right text-navy">{sarm(history.revenue[i])}</td>
                  <td className="py-1 text-right text-navy">{sarm(history.ebitda[i])}</td>
                  <td className="py-1 text-right text-navy">
                    {pct1(history.ebitda[i] / history.revenue[i])}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-5">
        <div className="label mb-1 text-muted">{S.calibration}</div>
        <p className="text-[13px] text-navy">{S.calibrationLead}</p>
        {(price || cost) && (
          <p className="num mt-1 text-[13px] text-muted">
            {price &&
              `${strings.explain.rules['calibration.price']}: ${Number(price.value).toFixed(3)}`}
            {price && cost && ' · '}
            {cost &&
              `${strings.explain.rules['calibration.cost']}: ${Number(cost.value).toFixed(3)}`}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setInputsOpen('base', true)
          setOpen(false)
          window.dispatchEvent(
            new CustomEvent('strata:tour-focus', { detail: '[data-testid="inputs-base"]' }),
          )
          window.setTimeout(
            () => window.dispatchEvent(new CustomEvent('strata:tour-focus', { detail: null })),
            50,
          )
        }}
        className="rounded-full border border-line px-4 py-1.5 font-heading text-[13px] text-navy transition-colors duration-150 hover:border-ink"
      >
        {S.edit}
      </button>
    </SideSheet>
  )
}
