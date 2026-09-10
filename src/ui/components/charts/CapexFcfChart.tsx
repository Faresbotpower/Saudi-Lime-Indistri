import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
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

export function CapexFcfChart({ plan }: { plan: PlanResult }) {
  const L = strings.financials.legend
  const data = plan.years.map((year, i) => ({
    year,
    capexBase: plan.split.baseCapex[i],
    capexInitiatives: plan.split.initiativeCapex[i],
    fcf: plan.financials.fcf[i],
  }))
  return (
    <div className="h-[280px] w-full" data-testid="chart-capex-fcf">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 280 }}
      >
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
          barGap={4}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke={chart.line} vertical={false} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis {...axisProps} width={44} tickFormatter={(v: number) => sarm(v)} />
          <ReferenceLine y={0} stroke={chart.muted} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.sand2 }} />
          <Bar
            dataKey="capexBase"
            name={L.capexBase}
            stackId="capex"
            fill={chart.muted}
            {...animation}
          />
          <Bar
            dataKey="capexInitiatives"
            name={L.capexInitiatives}
            stackId="capex"
            fill={chart.ink}
            radius={[3, 3, 0, 0]}
            {...animation}
          />
          <Bar dataKey="fcf" name={L.fcf} radius={[3, 3, 0, 0]} {...animation}>
            {data.map((d) => (
              <Cell key={d.year} fill={d.fcf < 0 ? chart.coral : chart.teal} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
