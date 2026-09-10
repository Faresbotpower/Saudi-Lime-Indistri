import { planData, leverDefs } from '../../data'
import { usePlan, useTrackedPlan, useData, presetPlans } from '../../state/plan'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { functionImpacts } from '../functions'
import { pct1, sarm, signed } from '../format'
import { leverValueLabel, triggerSentence } from '../triggerText'
import { categoryChip } from '../components/categoryColors'
import logo from '../../../assets/sia_logo.png'

const th =
  'border-b border-line py-1 pr-3 text-left text-[10px] uppercase tracking-wider text-muted'
const td = 'border-b border-line/60 py-1 pr-3 align-top text-[11px] text-navy'
const num = 'num text-right'

/** The whole plan for the current levers and inputs, laid out for print. Hidden on screen. */
export function Report() {
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const data = useData()
  const base = presetPlans(data).base
  const levers = useLevers((s) => s.levers)
  const overrides = useLevers((s) => s.overrides)
  const actuals = useLevers((s) => s.actuals)
  const R = strings.report
  const C = R.cols
  const last = plan.years.length - 1
  const list = planData.initiatives.initiatives
  const byId = Object.fromEntries(list.map((i) => [i.id, i]))
  const cards = functionImpacts(plan, base, tracked)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div id="report" data-testid="report" className="report">
      <header className="mb-4 border-b-2 border-ink pb-3">
        <div className="flex items-center justify-between">
          <div className="font-heading text-[22px] tracking-[0.12em] text-ink">STRATA</div>
          <img src={logo} alt="Sia" style={{ height: 24 }} />
        </div>
        <h1 className="mt-2 text-[18px] text-ink">{R.title}</h1>
        <p className="text-[11px] text-muted">{R.subtitle}</p>
        <div className="mt-2 grid grid-cols-3 gap-4 text-[11px]">
          <div>
            <span className="label mr-2">{R.scenario}</span>
            <span className="font-heading text-ink">{strings.scenarios[plan.scenarioName]}</span>
            <span className="label ml-4 mr-2">{R.generated}</span>
            <span className="num">{today}</span>
          </div>
          <div className="col-span-2">
            <span className="label mr-2">{R.levers}</span>
            {leverDefs.map((d) => (
              <span key={d.id} className="mr-3">
                {d.name}:{' '}
                <span className="num text-ink">
                  {leverValueLabel(
                    d.id,
                    d.id === 'L1' ? levers.L1.multiplier : (levers[d.id] as number),
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 text-[11px]">
          <span className="label mr-2">{R.inputs}</span>
          {Object.keys(overrides).length === 0
            ? R.noInputs
            : Object.entries(overrides)
                .map(([k, v]) => `${k} = ${v}`)
                .join('; ')}
        </div>
      </header>

      <section>
        <h2>1. {R.sections[0]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{strings.direction.cols.cell}</th>
              <th className={th}>{strings.direction.cols.category}</th>
              <th className={th}>{strings.direction.cols.rationale}</th>
            </tr>
          </thead>
          <tbody>
            {plan.classification.map((c) => (
              <tr key={c.id}>
                <td className={td}>{c.label}</td>
                <td className={td}>
                  <span className={`label rounded-full px-1.5 ${categoryChip[c.category]}`}>
                    {strings.direction.categories[c.category]}
                  </span>
                </td>
                <td className={td}>{c.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>2. {R.sections[1]}</h2>
        <p className="text-[11px] text-muted">
          {strings.portfolio.strip.envelope} SAR {sarm(plan.capital.envelope)}m ·{' '}
          {strings.portfolio.strip.committed} SAR {sarm(plan.capital.committed)}m ·{' '}
          {strings.portfolio.strip.diversification}{' '}
          {Math.round(plan.diversificationShare2031 * 100)}%
        </p>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.initiative}</th>
              <th className={th}>{C.layer}</th>
              <th className={th}>{C.owner}</th>
              <th className={th}>{C.status}</th>
              <th className={`${th} text-right`}>{strings.portfolio.card.capex}</th>
              <th className={`${th} text-right`}>{C.npv}</th>
              <th className={`${th} text-right`}>{C.start}</th>
              <th className={th}>{C.trigger}</th>
            </tr>
          </thead>
          <tbody>
            {plan.initiatives.map((i) => (
              <tr key={i.id}>
                <td className={td}>{byId[i.id].name}</td>
                <td className={td}>{strings.portfolio.layers[byId[i.id].layer]}</td>
                <td className={td}>{byId[i.id].owner}</td>
                <td className={td}>{strings.portfolio.columns[i.status]}</td>
                <td className={`${td} ${num}`}>{sarm(i.capex)}</td>
                <td className={`${td} ${num}`}>{signed(i.npv)}</td>
                <td className={`${td} ${num}`}>{i.status !== 'out' ? i.startYear : ''}</td>
                <td className={td}>{triggerSentence(i, levers.L3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. {R.sections[2]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.year}</th>
              {plan.years.map((y) => (
                <th key={y} className={`${th} text-right`}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                [C.revenue, plan.financials.revenue, sarm],
                [C.ebitda, plan.financials.ebitda, sarm],
                [C.margin, plan.financials.ebitdaMargin, (v: number) => `${pct1(v)}%`],
                [C.capex, plan.financials.capex, sarm],
                [C.fcf, plan.financials.fcf, sarm],
                [C.cumFcf, plan.financials.cumulativeFcf, sarm],
                [C.baseRevenue, plan.baseCase.revenue, sarm],
                [C.baseEbitda, plan.baseCase.ebitda, sarm],
              ] as [string, number[], (v: number) => string][]
            ).map(([label, series, f]) => (
              <tr key={label}>
                <td className={td}>{label}</td>
                {series.map((v, k) => (
                  <td key={k} className={`${td} ${num}`}>
                    {f(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-muted">{strings.common.illustrativeFootnote}</p>
      </section>

      <section>
        <h2>4. {R.sections[3]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.site}</th>
              <th className={`${th} text-right`}>{C.capacity}</th>
              <th className={`${th} text-right`}>{C.utilization}</th>
              <th className={`${th} text-right`}>{C.siteCapex}</th>
            </tr>
          </thead>
          <tbody>
            {plan.sites.map((s) => (
              <tr key={s.id}>
                <td className={td}>{s.name}</td>
                <td className={`${td} ${num}`}>{sarm(s.capacity[last])} kt</td>
                <td className={`${td} ${num}`}>{Math.round(s.utilization[last] * 100)}%</td>
                <td className={`${td} ${num}`}>
                  SAR {sarm(s.capex.slice(1).reduce((a, b) => a + b, 0))}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.metric}</th>
              {plan.years.map((y) => (
                <th key={y} className={`${th} text-right`}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>{strings.operations.headcount}</td>
              {plan.people.headcount.map((v, k) => (
                <td key={k} className={`${td} ${num}`}>
                  {sarm(v)}
                </td>
              ))}
            </tr>
            <tr>
              <td className={td}>{strings.operations.saudization}</td>
              {plan.people.saudization.map((v, k) => (
                <td key={k} className={`${td} ${num}`}>
                  {Math.round(v * 100)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className={td}>{strings.operations.costPerTon}</td>
              {plan.people.costPerTon.map((v, k) => (
                <td key={k} className={`${td} ${num}`}>
                  {Math.round(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. {R.sections[4]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.layer}</th>
              <th className={th}>{C.initiative}</th>
              <th className={th}>{C.status}</th>
              <th className={`${th} text-right`}>{C.start}</th>
              <th className={`${th} text-right`}>{C.end}</th>
            </tr>
          </thead>
          <tbody>
            {plan.roadmap.layers.flatMap((l) =>
              l.items.map((it) => (
                <tr key={it.id}>
                  <td className={td}>{l.label}</td>
                  <td className={td}>{it.name}</td>
                  <td className={td}>
                    {it.status === 'in'
                      ? strings.roadmap.funded
                      : `${strings.roadmap.ghost}${it.needsCapital !== undefined ? `, ${strings.roadmap.needs(sarm(it.needsCapital))}` : ''}`}
                  </td>
                  <td className={`${td} ${num}`}>{it.start}</td>
                  <td className={`${td} ${num}`}>{it.end}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2>6. {R.sections[5]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{strings.tracker.cols.lever}</th>
              <th className={th}>{C.plan}</th>
              <th className={th}>{C.actual}</th>
            </tr>
          </thead>
          <tbody>
            {(['L1', 'L2', 'L6'] as const).map((id) => {
              const planValue = id === 'L1' ? levers.L1.multiplier : levers[id]
              const key = id === 'L1' ? 'L1multiplier' : id
              const actual = actuals[key as keyof typeof actuals]
              return (
                <tr key={id}>
                  <td className={td}>{leverDefs.find((d) => d.id === id)?.name}</td>
                  <td className={`${td} ${num}`}>{leverValueLabel(id, planValue)}</td>
                  <td className={`${td} ${num}`}>
                    {actual !== undefined ? leverValueLabel(id, actual) : strings.tracker.awaiting}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-[11px] text-navy">
          <span className="label mr-2">{strings.tracker.fired}</span>
          {tracked.triggersFired.length === 0
            ? strings.tracker.none
            : tracked.triggersFired
                .map(
                  (t) =>
                    `${byId[t.id].name}: ${strings.portfolio.columns[t.from]} → ${strings.portfolio.columns[t.to]}`,
                )
                .join('; ')}
        </p>
      </section>

      <section>
        <h2>7. {R.sections[6]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.function}</th>
              <th className={th}>{C.kpi}</th>
              <th className={`${th} text-right`}>{C.value}</th>
              <th className={`${th} text-right`}>{C.base}</th>
              <th className={th}>{strings.functions.initiatives}</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  <div className="font-heading text-ink">{c.name}</div>
                  <div className="text-[10px] text-muted">{c.rfq}</div>
                </td>
                <td className={td}>
                  {c.kpis.map((k) => (
                    <div key={k.id}>{k.label}</div>
                  ))}
                </td>
                <td className={`${td} ${num}`}>
                  {c.kpis.map((k) => (
                    <div key={k.id}>{k.format(k.value)}</div>
                  ))}
                </td>
                <td className={`${td} ${num}`}>
                  {c.kpis.map((k) => (
                    <div key={k.id}>{k.format(k.base)}</div>
                  ))}
                </td>
                <td className={td}>
                  {c.initiatives.map((i) => (
                    <div key={i.id}>
                      {i.name} · {strings.portfolio.columns[i.status]}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-4 border-t border-line pt-2 text-[10px] text-muted">
        {strings.app.illustrativeLong} · {R.poweredBy}
      </footer>
    </div>
  )
}
