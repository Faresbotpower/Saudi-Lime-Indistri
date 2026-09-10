import { ViewFrame } from '../components/ViewFrame'
import { Card } from '../components/Card'
import { Gantt } from '../components/Gantt'
import { usePlan } from '../../state/plan'
import { strings } from '../../strings'

export function Roadmap() {
  const plan = usePlan()
  const R = strings.roadmap
  return (
    <ViewFrame id="roadmap">
      <Card lead={R.lead} tour="gantt">
        <Gantt plan={plan} />
        <div className="mt-4 flex flex-wrap gap-5 text-[13px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded bg-ink" /> {R.funded}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded bg-teal" /> {R.critical}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded border border-dashed border-amber bg-amber/10" />{' '}
            {R.ghost}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rotate-45 bg-ink" /> {R.milestone}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t border-dashed border-teal-dim" />{' '}
            {R.dependency}
          </span>
        </div>
      </Card>
    </ViewFrame>
  )
}
