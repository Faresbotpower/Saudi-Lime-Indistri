import { useState } from 'react'
import { ViewFrame } from '../components/ViewFrame'
import { YearScrubber } from '../components/YearScrubber'
import { SiteCard } from '../components/SiteCard'
import { PeoplePanel } from '../components/PeoplePanel'
import { SupplyPanel } from '../components/SupplyPanel'
import { usePlan } from '../../state/plan'

export function Operations() {
  const plan = usePlan()
  const [index, setIndex] = useState(plan.years.length - 1)
  return (
    <ViewFrame id="operations">
      <div data-tour="scrubber">
        <YearScrubber years={plan.years} index={index} onChange={setIndex} />
      </div>
      <div data-tour="sites" className="mt-6 grid grid-cols-3 gap-6">
        {plan.sites.map((s) => (
          <SiteCard key={s.id} site={s} plan={plan} index={index} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-5 gap-6">
        <div className="col-span-3" data-tour="people">
          <PeoplePanel plan={plan} index={index} />
        </div>
        <div className="col-span-2">
          <SupplyPanel plan={plan} />
        </div>
      </div>
    </ViewFrame>
  )
}
