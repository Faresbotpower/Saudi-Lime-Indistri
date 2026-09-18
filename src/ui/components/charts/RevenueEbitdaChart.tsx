import '../analytics.css'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { planData } from '../../../data'
import type { PlanResult } from '../../../engine'
import { strings } from '../../../strings'
import { sarm } from '../../format'
import { chartAnimation, axisProps, chart } from './theme'
import { ChartTooltip } from './ChartTooltip'

export function RevenueEbitdaChart({ plan, isBase }: { plan: PlanResult; isBase: boolean }) {
  const L = strings.financials.legend
  const history = planData.assumptions.history
  const previous = planData.assumptions.previousPlan
  const past = history
    ? history.years
        .map((year, i) => ({
          year,
          historyRevenue: history.revenue[i],
          historyEbitda: history.ebitda[i],
        }))
        .filter((h) => h.year < plan.years[0])
    : []
  const data = [
    ...past,
    ...plan.years.map((year, i) => ({
      year,
      revenue: plan.financials.revenue[i],
      ebitda: plan.financials.ebitda[i],
      baseRevenue: plan.baseCase.revenue[i],
      baseEbitda: plan.baseCase.ebitda[i],
      // The history lines end on the actual base year; the plan line starts from the pro forma on gas.
      ...(i === 0 && history
        ? {
            historyRevenue: plan.financials.revenue[0],
            historyEbitda: plan.financials.ebitda[0],
            ebitda: plan.proForma2026.ebitda,
          }
        : {}),
    })),
  ]
  return (
    <div
      className="analytics-chart h-[320px] w-full"
      data-testid="chart-revenue-ebitda"
      data-history-years={past.length}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: 320 }}
      >
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={chart.line} vertical={false} strokeDasharray="3 5" />
          <XAxis dataKey="year" {...axisProps} padding={{ left: 12, right: 12 }} />
          <YAxis
            {...axisProps}
            width={56}
            tickFormatter={(v: number) => sarm(v)}
            domain={[0, 'auto']}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.line }} />
          {previous && (
            <ReferenceDot
              x={previous.year}
              y={previous.targets.revenue2024}
              r={5}
              fill="none"
              stroke={chart.muted}
              strokeDasharray="2 2"
              label={{
                value: L.previousPlan,
                position: 'top',
                fill: chart.muted,
                fontSize: 11,
              }}
            />
          )}
          {previous && (
            <ReferenceDot
              x={previous.year}
              y={previous.targets.ebitda2024}
              r={5}
              fill="none"
              stroke={chart.muted}
              strokeDasharray="2 2"
            />
          )}
          {history && (
            <ReferenceDot
              x={plan.years[0]}
              y={plan.proForma2026.ebitda}
              r={5}
              fill={chart.teal}
              stroke="#fff"
              label={{ value: L.proForma2026, position: 'right', fill: chart.teal, fontSize: 11 }}
            />
          )}
          {past.length > 0 && (
            <ReferenceLine
              x={plan.years[0]}
              stroke={chart.muted}
              strokeDasharray="2 4"
              label={{
                value: strings.financials.baseline,
                position: 'insideTopLeft',
                fill: chart.muted,
                fontSize: 11,
              }}
            />
          )}
          {past.length > 0 && (
            <Line
              dataKey="historyRevenue"
              name={L.historyRevenue}
              stroke={chart.muted}
              strokeWidth={2}
              strokeOpacity={0.6}
              dot={{ r: 2, fill: chart.muted, strokeWidth: 0 }}
              {...chartAnimation(250)}
            />
          )}
          {past.length > 0 && (
            <Line
              dataKey="historyEbitda"
              name={L.historyEbitda}
              stroke={chart.muted}
              strokeWidth={2}
              strokeOpacity={0.6}
              dot={{ r: 2, fill: chart.muted, strokeWidth: 0 }}
              {...chartAnimation(250)}
            />
          )}
          {!isBase && (
            <Line
              dataKey="baseRevenue"
              name={L.baseRevenue}
              stroke={chart.muted}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              {...chartAnimation(250)}
            />
          )}
          {!isBase && (
            <Line
              dataKey="baseEbitda"
              name={L.baseEbitda}
              stroke={chart.muted}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              {...chartAnimation(250)}
            />
          )}
          <Line
            dataKey="revenue"
            name={L.revenue}
            stroke={chart.navy}
            strokeWidth={3}
            dot={{ r: 3, fill: chart.navy, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            {...chartAnimation(250)}
          />
          <Line
            dataKey="ebitda"
            name={L.ebitda}
            stroke={chart.teal}
            strokeWidth={3}
            dot={{ r: 3, fill: chart.teal, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            {...chartAnimation(250)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
