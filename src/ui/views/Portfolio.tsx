import { LayoutGroup } from 'framer-motion'
import { ViewFrame } from '../components/ViewFrame'
import { CapitalStrip } from '../components/CapitalStrip'
import { InitiativeCard } from '../components/InitiativeCard'
import { InitiativeSheet } from '../components/InitiativeSheet'
import { usePlan } from '../../state/plan'
import { useLevers } from '../../state/levers'
import { planData } from '../../data'
import { strings } from '../../strings'
import './portfolio.css'

const STATUSES = ['in', 'deferred', 'out'] as const

export function Portfolio() {
  const plan = usePlan()
  const openId = useLevers((s) => s.openInitiativeId)
  const setOpenId = useLevers((s) => s.openInitiative)
  const closeInitiative = useLevers((s) => s.closeInitiative)
  const byId = Object.fromEntries(planData.initiatives.initiatives.map((i) => [i.id, i]))
  const planById = Object.fromEntries(plan.initiatives.map((i) => [i.id, i]))

  const columns = STATUSES.map((status) => ({
    status,
    items: plan.initiatives
      .filter((i) => i.status === status)
      .sort((a, b) => {
        if (status === 'in')
          return (
            (a.startYear ?? 0) - (b.startYear ?? 0) ||
            b.npv / Math.max(1, b.capex) - a.npv / Math.max(1, a.capex)
          )
        if (status === 'deferred')
          return (
            (a.reason === 'capital' ? 0 : 1) - (b.reason === 'capital' ? 0 : 1) || b.npv - a.npv
          )
        return a.id.localeCompare(b.id)
      }),
  }))

  return (
    <ViewFrame id="portfolio">
      <CapitalStrip plan={plan} />
      <nav className="portfolio-index" aria-label="Jump to initiative status">
        {columns.map((col) => (
          <a
            key={col.status}
            href={`#portfolio-${col.status}`}
            className={`portfolio-index--${col.status}`}
          >
            <span>{strings.portfolio.columns[col.status]}</span>
            <strong>{col.items.length}</strong>
            <span aria-hidden="true">↓</span>
          </a>
        ))}
      </nav>
      <LayoutGroup>
        <div data-tour="columns" className="portfolio-board mt-6 grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <section
              key={col.status}
              id={`portfolio-${col.status}`}
              data-testid={`column-${col.status}`}
              className={`portfolio-lane portfolio-lane--${col.status} min-w-0`}
            >
              <header className="mb-3 flex items-baseline gap-2">
                <h2 className="text-[20px] text-ink">{strings.portfolio.columns[col.status]}</h2>
                <span className="num text-[13px] text-muted">{col.items.length}</span>
              </header>
              <p className="mb-3 text-[13px] text-muted">
                {strings.portfolio.columnLead[col.status]}
              </p>
              <div className="portfolio-initiatives">
                {col.items.map((p) => (
                  <InitiativeCard key={p.id} init={byId[p.id]} plan={p} onOpen={setOpenId} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </LayoutGroup>
      <InitiativeSheet
        init={openId ? byId[openId] : null}
        plan={openId ? planById[openId] : null}
        onClose={closeInitiative}
      />
    </ViewFrame>
  )
}
