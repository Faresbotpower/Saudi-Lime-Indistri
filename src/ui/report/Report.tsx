import { planData, leverDefs } from '../../data'
import { usePlan, useTrackedPlan, useData, presetPlans } from '../../state/plan'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { planCards } from '../plans'
import { fmtKpi } from '../kpiFormat'
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
  const cards = planCards(plan, base, tracked)
  const today = new Date().toISOString().slice(0, 10)
  const shifts = planData.objectives.shifts
  const objectiveById = Object.fromEntries(plan.objectives.map((o) => [o.id, o]))
  const kpiName = (k: string) =>
    planData.objectives.scorecard.kpis.find((x) => x.id === k)?.name ?? k
  const projectsOf: Record<string, (typeof plan.plans)[number]['projects']> = {}
  for (const p of plan.plans.flatMap((x) => x.projects)) (projectsOf[p.initiativeId] ??= []).push(p)

  return (
    <div id="report" data-testid="report" className="report">
      <header className="mb-4 border-b-2 border-ink pb-3">
        <div className="flex items-center justify-between">
          <div className="font-heading text-[22px] tracking-[0.12em] text-ink">STRATA</div>
          <img src={logo} alt="Sia" style={{ height: 24 }} />
        </div>
        <h1 className="mt-2 text-[18px] text-ink">{R.title}</h1>
        <p className="text-[11px] text-muted">{R.subtitle}</p>
        <ol className="report-steps" aria-label={R.approach}>
          {strings.approach.steps.map((step, i) => (
            <li key={step} data-phase={i < 4 ? 1 : 2}>
              <span className="num">{i + 1}</span> {step}
            </li>
          ))}
          <li data-phase="3">
            <span>/</span> {strings.app.name}: {strings.approach.landing}
          </li>
        </ol>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 text-[11px]">
          <span className="whitespace-nowrap">
            <span className="label mr-2">{R.scenario}</span>
            <span className="font-heading text-ink">{strings.scenarios[plan.scenarioName]}</span>
          </span>
          <span className="whitespace-nowrap">
            <span className="label mr-2">{R.generated}</span>
            <span className="num">{today}</span>
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[11px]">
          <span className="label mr-1">{R.levers}</span>
          {leverDefs.map((d) => (
            <span key={d.id} className="whitespace-nowrap">
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
        <h3>{R.shifts}</h3>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.shift}</th>
              <th className={th}>{strings.cascade.pathway}</th>
              <th className={th}>{C.objective}</th>
              <th className={th}>{C.owner}</th>
              <th className={th}>{C.status}</th>
            </tr>
          </thead>
          <tbody>
            {shifts.flatMap((s) =>
              planData.objectives.objectives
                .filter((o) => o.shift === s.id)
                .map((o, i) => (
                  <tr key={o.id}>
                    <td className={td}>{i === 0 ? `${s.id} ${s.name}` : ''}</td>
                    <td className={td}>{i === 0 ? planData.objectives.pathways[s.pathway] : ''}</td>
                    <td className={td}>
                      {o.id} {o.name}
                    </td>
                    <td className={td}>{o.owner}</td>
                    <td className={td}>{strings.cascade.status[objectiveById[o.id].status]}</td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
        <h3>{strings.direction.table}</h3>
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
        <table>
          <thead>
            <tr>
              <th className={th}>{C.perspective}</th>
              <th className={th}>{C.kpi}</th>
              <th className={`${th} text-right`}>{C.baseline}</th>
              <th className={`${th} text-right`}>{C.target}</th>
              <th className={`${th} text-right`}>{C.live}</th>
            </tr>
          </thead>
          <tbody>
            {plan.scorecard.map((k) => (
              <tr key={k.id}>
                <td className={td}>{strings.scorecard.perspectives[k.perspective]}</td>
                <td className={td}>
                  {k.id} {k.name} <span className="text-muted">{k.unit}</span>
                  {k.lead ? ` · ${strings.scorecard.lead}` : ''}
                </td>
                <td className={`${td} ${num}`}>{fmtKpi(k.baseline2026, k.unit)}</td>
                <td className={`${td} ${num}`}>
                  {k.targets['2031'] !== undefined ? fmtKpi(k.targets['2031'], k.unit) : ''}
                </td>
                <td className={`${td} ${num}`}>
                  {k.live ? fmtKpi(k.live[last], k.unit) : strings.scorecard.entered}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. {R.sections[2]}</h2>
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
              <th className={th}>{C.objective}</th>
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
                <td className={td}>
                  {byId[i.id].name}
                  <div className="text-[10px] text-muted">
                    {strings.portfolio.layers[byId[i.id].layer]} · {C.projects}:{' '}
                    {byId[i.id].projects.map((p) => p.name).join('; ')}
                  </div>
                </td>
                <td className={td}>{byId[i.id].objectives.join(', ')}</td>
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
        <h2>4. {R.sections[3]}</h2>
        <table>
          <thead>
            <tr>
              <th className={th}>{C.function}</th>
              <th className={th}>{C.project}</th>
              <th className={th}>{C.status}</th>
              <th className={`${th} text-right`}>{C.start}</th>
              <th className={`${th} text-right`}>{strings.portfolio.card.capex}</th>
              <th className={th}>{C.needs}</th>
            </tr>
          </thead>
          {cards.map((c) => (
            <tbody key={c.id} className="function-block">
              {c.rollup.projects.map((p, i) => (
                <tr key={p.id}>
                  <td className={td}>
                    {i === 0 && (
                      <>
                        <div className="font-heading text-ink">{c.name}</div>
                        <div className="text-[10px] text-muted">
                          {C.deliverable} {c.deliverable} · {strings.plans.headcount}{' '}
                          {signed(c.rollup.headcountDelta)}
                        </div>
                      </>
                    )}
                  </td>
                  <td className={td}>
                    {p.name}
                    <div className="text-[10px] text-muted">{p.initiativeName}</div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {strings.portfolio.columns[p.status]}
                  </td>
                  <td className={`${td} ${num}`}>{p.status === 'out' ? '' : p.startYear}</td>
                  <td className={`${td} ${num}`}>{sarm(p.capex)}</td>
                  <td className={td}>
                    {i === 0 &&
                      [...c.rollup.requirements.people, ...c.rollup.requirements.systems].map(
                        (x) => <div key={x}>{x}</div>,
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </section>

      <section>
        <h2>5. {R.sections[4]}</h2>
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
        <p className="text-[10px] text-navy">
          {strings.financials.proForma.actual}: EBITDA {sarm(plan.financials.ebitda[0])} ·{' '}
          {strings.financials.proForma.proForma}: EBITDA {sarm(plan.proForma2026.ebitda)} ·{' '}
          {strings.financials.proForma.energy}{' '}
          {Math.round(plan.proForma2026.energyCostPerTonLimeActual)} to{' '}
          {Math.round(plan.proForma2026.energyCostPerTonLimeOnGas)} SAR/t.
          {plan.envelopeDerivation &&
            ` ${strings.financials.envelope.envelope}: SAR ${sarm(plan.envelopeDerivation.envelope)}m derived from the plan.`}
        </p>
        {planData.assumptions.history && (
          <p className="text-[10px] text-muted">
            {strings.financials.legend.history}:{' '}
            {planData.assumptions.history.years
              .map(
                (y, i) =>
                  `${y} ${sarm(planData.assumptions.history!.revenue[i])} / ${sarm(planData.assumptions.history!.ebitda[i])}`,
              )
              .join(' · ')}{' '}
            (SAR m, revenue / EBITDA). {strings.financials.deliverable}.
          </p>
        )}
        <p className="text-[10px] text-muted">{strings.common.illustrativeFootnote}</p>
      </section>

      <section>
        <h2>6. {R.sections[5]}</h2>
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
        <h2>7. {R.sections[6]}</h2>
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
              l.items.flatMap((it) => [
                <tr key={it.id}>
                  <td className={td}>{l.label}</td>
                  <td className={`${td} font-heading text-ink`}>{it.name}</td>
                  <td className={td}>
                    {it.status === 'in'
                      ? strings.roadmap.funded
                      : `${strings.roadmap.ghost}${it.needsCapital !== undefined ? `, ${strings.roadmap.needs(sarm(it.needsCapital))}` : ''}`}
                  </td>
                  <td className={`${td} ${num}`}>{it.start}</td>
                  <td className={`${td} ${num}`}>{it.end}</td>
                </tr>,
                ...(projectsOf[it.id] ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className={td} />
                    <td className={`${td} pl-4`}>/ {p.name}</td>
                    <td className={td}>{p.owner}</td>
                    <td className={`${td} ${num}`}>{p.startYear}</td>
                    <td className={`${td} ${num}`}>{p.endYear}</td>
                  </tr>
                )),
              ]),
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2>8. {R.sections[7]}</h2>
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
        <p className="text-[10px] text-muted">
          {strings.scorecard.lead}:{' '}
          {plan.scorecard
            .filter((k) => k.lead)
            .map((k) => kpiName(k.id))
            .join(', ')}
          .
        </p>
      </section>

      <footer className="mt-4 border-t border-line pt-2 text-[10px] text-muted">
        {strings.app.illustrativeLong} · {strings.app.owners.model} {strings.app.owners.tracker}{' '}
        {strings.app.hosting} · {R.poweredBy}
      </footer>
    </div>
  )
}
