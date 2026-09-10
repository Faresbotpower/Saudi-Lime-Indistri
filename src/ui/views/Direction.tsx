import { ViewFrame } from '../components/ViewFrame'
import { Card } from '../components/Card'
import { StrataReveal } from '../components/StrataReveal'
import { WhereToPlay } from '../components/WhereToPlay'
import { ClassificationTable } from '../components/ClassificationTable'
import { usePlan } from '../../state/plan'
import { strings } from '../../strings'

export function Direction() {
  const plan = usePlan()
  const D = strings.direction
  return (
    <ViewFrame id="direction">
      <StrataReveal plan={plan} />
      <div className="mt-6 grid grid-cols-5 gap-6">
        <Card title={D.matrix} lead={D.matrixLead} className="col-span-2" tour="matrix">
          <WhereToPlay plan={plan} />
        </Card>
        <Card title={D.table} lead={D.tableLead} className="col-span-3" tour="class-table">
          <ClassificationTable plan={plan} />
        </Card>
      </div>
    </ViewFrame>
  )
}
