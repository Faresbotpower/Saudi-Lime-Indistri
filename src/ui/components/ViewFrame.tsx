import type { ReactNode } from 'react'
import { strings, type ViewId } from '../../strings'
import { useLevers } from '../../state/levers'
import { viewOrder } from '../shell/viewOrder'
import '../views/compositions.css'
import '../views/reading-hierarchy.css'

const readingPath: Record<ViewId, [string, string, string]> = {
  direction: [
    'Follow the shifts into objectives',
    'Trace what moves the plan',
    'Compare market positions',
  ],
  scorecard: [
    'Read each perspective',
    'Compare live values with targets',
    'Check the OKRs under each objective',
  ],
  portfolio: [
    'Check available capital',
    'Review funded initiatives and projects',
    'Inspect what waits and why',
  ],
  plans: ['Find your plan', 'Read its projects and capex', 'Review what it needs to work'],
  financials: [
    'Start from the baseline',
    'Follow the growth trajectory',
    'Compare cash and scenarios',
  ],
  roadmap: [
    'Follow the funded sequence',
    'Read the projects under each bar',
    'Review deferred work',
  ],
  tracker: ['Enter actual performance', 'Review triggered decisions', 'Run the quarterly review'],
}

/** Each chapter has a distinct masthead; shared context stays in the same place. */
export function ViewFrame({ id, children }: { id: ViewId; children?: ReactNode }) {
  const v = strings.views[id]
  const scenario = useLevers((s) => s.scenario)
  const setView = useLevers((s) => s.setView)
  const next = viewOrder[(viewOrder.indexOf(id) + 1) % viewOrder.length]
  return (
    <div className={`view-frame view-${id}`}>
      <div className={`chapter-masthead chapter-masthead--${id}`}>
        <div className="chapter-context">
          <span>{strings.app.tagline}</span>
          <span className="chapter-period">2027 / 2031</span>
          <span className="chapter-scenario">
            <i aria-hidden="true" />
            {strings.scenarios[scenario]} {strings.app.scenario.toLowerCase()}
          </span>
        </div>
        <div className="chapter-heading">
          <h1>{v.title}</h1>
          <p>{v.lead}</p>
        </div>
      </div>
      <div className="chapter-reading-path" aria-label="How to read this chapter">
        <span className="reading-path-label">Reading path</span>
        <ol>
          {readingPath[id].map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">0{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="view-body">{children}</div>
      <div className="chapter-next">
        <span>Continue exploring</span>
        <button type="button" onClick={() => setView(next)}>
          {strings.views[next].title} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  )
}
