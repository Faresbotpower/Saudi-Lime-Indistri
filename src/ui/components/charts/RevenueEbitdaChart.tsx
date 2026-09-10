import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PlanResult } from '../../../engine'
import { strings } from '../../../strings'
import { sarm } from '../../format'
import { animation, axisProps, chart } from './theme'
import { ChartTooltip } from './ChartTooltip'

export function RevenueEbitdaChart({ plan, isBase }: { plan: PlanResult; isBase: boolean }) {
  const L = strings.financials.legend
  const data = plan.years.map((year, i) => ({
    year,
    revenue: plan.financials.revenue[i],
    ebitda: plan.financials.ebitda[i],
    baseRevenue: plan.baseCase.revenue[i],
    baseEbitda: plan.baseCase.ebitda[i],
  }))
  return (
    <div className="h-[320px] w-full" data-testid="chart-revenue-ebitda">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: 320 }}
      >
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={chart.line} vertical={false} />
          <XAxis dataKey="year" {...axisProps} padding={{ left: 12, right: 12 }} />
          <YAxis
            {...axisProps}
            width={44}
            tickFormatter={(v: number) => sarm(v)}
            domain={[0, 'auto']}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.line }} />
          {!isBase && (
            <Line
              dataKey="baseRevenue"
              name={L.baseRevenue}
              stroke={chart.muted}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              {...animation}
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
              {...animation}
            />
          )}
          <Line
            dataKey="revenue"
            name={L.revenue}
            stroke={chart.navy}
            strokeWidth={2.5}
            dot={{ r: 3, fill: chart.navy, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            {...animation}
          />
          <Line
            dataKey="ebitda"
            name={L.ebitda}
            stroke={chart.teal}
            strokeWidth={2.5}
            dot={{ r: 3, fill: chart.teal, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            {...animation}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
