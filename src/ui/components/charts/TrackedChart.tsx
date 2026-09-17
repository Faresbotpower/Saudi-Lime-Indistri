import '../analytics.css'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PlanResult } from '../../../engine'
import { strings } from '../../../strings'
import { sarm } from '../../format'
import { chartAnimation, axisProps, chart } from './theme'
import { ChartTooltip } from './ChartTooltip'

/** Tracked plan (solid) against the approved plan (dashed), revenue and EBITDA. */
export function TrackedChart({
  plan,
  tracked,
  year,
}: {
  plan: PlanResult
  tracked: PlanResult
  year: number
}) {
  const L = strings.tracker.legend
  const data = plan.years.map((y, i) => ({
    year: y,
    revenue: tracked.financials.revenue[i],
    ebitda: tracked.financials.ebitda[i],
    planRevenue: plan.financials.revenue[i],
    planEbitda: plan.financials.ebitda[i],
  }))
  return (
    <div className="analytics-chart h-[280px] w-full" data-testid="chart-tracked">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: 280 }}
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
          <ReferenceLine x={year} stroke={chart.amber} strokeDasharray="3 3" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.line }} />
          <Line
            dataKey="planRevenue"
            name={L.planRevenue}
            stroke={chart.muted}
            strokeDasharray="5 5"
            strokeWidth={1.5}
            dot={false}
            {...chartAnimation(250)}
          />
          <Line
            dataKey="planEbitda"
            name={L.planEbitda}
            stroke={chart.muted}
            strokeDasharray="5 5"
            strokeWidth={1.5}
            dot={false}
            {...chartAnimation(250)}
          />
          <Line
            dataKey="revenue"
            name={L.revenue}
            stroke={chart.navy}
            strokeWidth={3}
            dot={{ r: 3, fill: chart.navy, strokeWidth: 0 }}
            {...chartAnimation(250)}
          />
          <Line
            dataKey="ebitda"
            name={L.ebitda}
            stroke={chart.teal}
            strokeWidth={3}
            dot={{ r: 3, fill: chart.teal, strokeWidth: 0 }}
            {...chartAnimation(250)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
