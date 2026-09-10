import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PlanResult } from '../../engine'
import { planData } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'
import { chartAnimation, axisProps, chart } from './charts/theme'
import { ChartTooltip } from './charts/ChartTooltip'
import { Card } from './Card'
import { CountUp } from './CountUp'
import { ExplainButton } from './ExplainButton'

export function PeoplePanel({ plan, index }: { plan: PlanResult; index: number }) {
  const O = strings.operations
  const target = planData.assumptions.people.nitaqatTarget
  const workforce = planData.initiatives.initiatives.find((i) => i.saudizationTarget !== undefined)
  const wfStatus = workforce
    ? plan.initiatives.find((i) => i.id === workforce.id)?.status
    : undefined
  const data = plan.years.map((year, i) => ({
    year,
    headcount: Math.round(plan.people.headcount[i]),
    saudization: Math.round(plan.people.saudization[i] * 1000) / 10,
    costPerTon: Math.round(plan.people.costPerTon[i]),
  }))
  const year = plan.years[index]

  return (
    <Card title={O.people} lead={O.people_lead}>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-muted">{O.headcount}</span>
            <ExplainButton traceKey="people.headcount" />
          </div>
          <div className="num mt-1 font-heading text-[28px] text-ink">
            <span data-testid="headcount">
              <CountUp value={plan.people.headcount[index]} format={sarm} />
            </span>
          </div>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 300, height: 120 }}
            >
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                barCategoryGap="30%"
              >
                <XAxis dataKey="year" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 50']} />
                <Tooltip content={<ChartTooltip unit="" />} cursor={{ fill: chart.sand2 }} />
                <Bar
                  dataKey="headcount"
                  name={O.headcount}
                  radius={[3, 3, 0, 0]}
                  {...chartAnimation(0)}
                >
                  {data.map((d) => (
                    <Cell key={d.year} fill={d.year === year ? chart.teal : chart.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-muted">{O.saudization}</span>
            <ExplainButton traceKey="people.saudization" />
          </div>
          <div className="num mt-1 font-heading text-[28px] text-ink">
            <span data-testid="saudization">
              <CountUp value={plan.people.saudization[index] * 100} format={(v) => v.toFixed(0)} />
            </span>
            <span className="text-[14px] text-muted">%</span>
            <span className="ml-2 text-[13px] text-muted">
              {O.nitaqat} {Math.round(target * 100)}%
            </span>
          </div>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 300, height: 120 }}
            >
              <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="year" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                <YAxis hide domain={[30, 60]} />
                <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: chart.line }} />
                <ReferenceLine y={target * 100} stroke={chart.amber} strokeDasharray="4 4" />
                <ReferenceLine x={year} stroke={chart.line} />
                <Line
                  dataKey="saudization"
                  name={O.saudization}
                  stroke={chart.teal}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: chart.teal, strokeWidth: 0 }}
                  {...chartAnimation(0)}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-muted">{O.costPerTon}</span>
            <ExplainButton traceKey="people.costPerTon" />
          </div>
          <div className="num mt-1 font-heading text-[28px] text-ink">
            <span data-testid="cost-per-ton">
              <CountUp value={plan.people.costPerTon[index]} format={sarm} />
            </span>
            <span className="ml-1 text-[13px] text-muted">{O.sarPerTon}</span>
          </div>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 300, height: 120 }}
            >
              <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="year" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip content={<ChartTooltip unit="SAR/t" />} cursor={{ stroke: chart.line }} />
                <ReferenceLine x={year} stroke={chart.line} />
                <Line
                  dataKey="costPerTon"
                  name={O.costPerTon}
                  stroke={chart.navy}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: chart.navy, strokeWidth: 0 }}
                  {...chartAnimation(0)}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {workforce && (
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[13px]">
          <span className="label text-muted">{O.workforce}</span>
          <span className="text-navy">{workforce.name}</span>
          <span
            data-testid="workforce-status"
            className={`label rounded-full px-2 py-0.5 ${
              wfStatus === 'in'
                ? 'bg-teal/15 text-teal-dim'
                : wfStatus === 'deferred'
                  ? 'bg-amber/20 text-[#8a5a00]'
                  : 'bg-coral/12 text-coral'
            }`}
          >
            {wfStatus ? strings.portfolio.columns[wfStatus] : ''}
          </span>
        </div>
      )}
    </Card>
  )
}
