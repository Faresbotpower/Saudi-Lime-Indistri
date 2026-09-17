import { ViewFrame } from '../components/ViewFrame'
import { Card } from '../components/Card'
import { ChartLegend } from '../components/ChartLegend'
import { TrackerTable } from '../components/TrackerTable'
import { TriggersFired } from '../components/TriggersFired'
import { TrackedChart } from '../components/charts/TrackedChart'
import { chart } from '../components/charts/theme'
import { usePlan, useTrackedPlan } from '../../state/plan'
import { planData } from '../../data'
import { strings } from '../../strings'

export function Tracker() {
  const plan = usePlan()
  const tracked = useTrackedPlan()
  const T = strings.tracker
  const year = planData.assumptions.tracker.editableYear
  return (
    <ViewFrame id="tracker">
      <p className="tracker-note mb-4 text-[14px] text-navy">{T.lead(year)}</p>
      <div className="tracker-comparison grid grid-cols-5 gap-6">
        <div className="col-span-3" data-tour="tracker">
          <TrackerTable />
        </div>
        <div className="col-span-2" data-tour="triggers">
          <TriggersFired plan={tracked} />
        </div>
      </div>
      <Card title={T.chart} lead={T.chartLead} className="tracker-outlook mt-6">
        <TrackedChart plan={plan} tracked={tracked} year={year} />
        <div className="mt-3">
          <ChartLegend
            items={[
              { label: T.legend.revenue, color: chart.navy },
              { label: T.legend.ebitda, color: chart.teal },
              { label: T.legend.planRevenue, color: chart.muted, dashed: true },
              { label: T.legend.planEbitda, color: chart.muted, dashed: true },
            ]}
          />
        </div>
      </Card>
    </ViewFrame>
  )
}
