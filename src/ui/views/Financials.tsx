import { ViewFrame } from '../components/ViewFrame'
import { KpiTile } from '../components/KpiTile'
import { Card } from '../components/Card'
import { ChartLegend } from '../components/ChartLegend'
import { ScenarioStrip } from '../components/ScenarioStrip'
import { RevenueEbitdaChart } from '../components/charts/RevenueEbitdaChart'
import { CapexFcfChart } from '../components/charts/CapexFcfChart'
import { chart } from '../components/charts/theme'
import { usePlan } from '../../state/plan'
import { strings } from '../../strings'
import { pct1, sarm, signed, signedPts } from '../format'

const sum = (xs: number[]) => xs.slice(1).reduce((s, x) => s + x, 0)

export function Financials() {
  const plan = usePlan()
  const f = plan.financials
  const b = plan.baseCase
  const last = plan.years.length - 1
  const S = strings.financials
  const isBase = plan.scenarioName === 'base'

  return (
    <ViewFrame id="financials">
      <div className="grid grid-cols-4 gap-6">
        <KpiTile
          label={S.kpi.revenue2031}
          value={f.revenue[last]}
          base={b.revenue[last]}
          unit={S.units.sarm}
          format={sarm}
          formatDelta={signed}
          traceKey="financials.revenue"
          index={0}
        />
        <KpiTile
          label={S.kpi.margin2031}
          value={f.ebitdaMargin[last]}
          base={b.ebitdaMargin[last]}
          unit={S.units.pct}
          format={pct1}
          formatDelta={signedPts}
          traceKey="financials.ebitdaMargin"
          index={1}
        />
        <KpiTile
          label={S.kpi.cumCapex}
          value={sum(f.capex)}
          base={sum(b.capex)}
          unit={S.units.sarm}
          format={sarm}
          formatDelta={signed}
          goodWhenUp={false}
          note={S.units.plan}
          traceKey="financials.capex"
          index={2}
        />
        <KpiTile
          label={S.kpi.cumFcf}
          value={f.cumulativeFcf[last]}
          base={b.cumulativeFcf[last]}
          unit={S.units.sarm}
          format={sarm}
          formatDelta={signed}
          note={S.units.plan}
          traceKey="financials.cumulativeFcf"
          index={3}
        />
      </div>

      <Card title={S.mainChart} lead={S.mainChartLead} className="mt-6">
        <RevenueEbitdaChart plan={plan} isBase={isBase} />
        <div className="mt-3">
          <ChartLegend
            items={[
              { label: S.legend.revenue, color: chart.navy },
              { label: S.legend.ebitda, color: chart.teal },
              ...(isBase
                ? []
                : [
                    { label: S.legend.baseRevenue, color: chart.muted, dashed: true },
                    { label: S.legend.baseEbitda, color: chart.muted, dashed: true },
                  ]),
            ]}
          />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-5 gap-6">
        <Card title={S.secondChart} lead={S.secondChartLead} className="col-span-3">
          <CapexFcfChart plan={plan} />
          <div className="mt-3">
            <ChartLegend
              items={[
                { label: S.legend.capexBase, color: chart.muted },
                { label: S.legend.capexInitiatives, color: chart.ink },
                { label: S.legend.fcf, color: chart.teal },
              ]}
            />
          </div>
        </Card>
        <Card title={S.strip} lead={S.stripLead} className="col-span-2">
          <ScenarioStrip plan={plan} />
        </Card>
      </div>

      <p className="mt-6 text-[13px] text-muted">{strings.common.illustrativeFootnote}</p>
    </ViewFrame>
  )
}
