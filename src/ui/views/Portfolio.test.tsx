import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { Portfolio } from './Portfolio'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

const plan = () => runPlan(useLevers.getState().levers, planData)

describe('Growth portfolio view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders three columns whose card counts match the plan', () => {
    render(<Portfolio />)
    const p = plan()
    for (const status of ['in', 'deferred', 'out'] as const) {
      const col = screen.getByTestId(`column-${status}`)
      expect(within(col).getAllByTestId('initiative-card')).toHaveLength(
        p.initiatives.filter((i) => i.status === status).length,
      )
    }
  })

  it('shows the capital strip with committed, headroom, counts and diversification', () => {
    render(<Portfolio />)
    const p = plan()
    const strip = screen.getByTestId('capital-strip')
    expect(within(strip).getByTestId('committed')).toHaveTextContent(
      String(Math.round(p.capital.committed)),
    )
    expect(within(strip).getByTestId('headroom')).toHaveTextContent(
      String(Math.round(p.capital.headroom)),
    )
    expect(within(strip).getByTestId('diversification')).toHaveTextContent(
      `${Math.round(p.diversificationShare2031 * 100)}`,
    )
  })

  it('moves the Jeddah terminal from Out to In when export ambition is extended', () => {
    render(
      <>
        <LeverRail />
        <Portfolio />
      </>,
    )
    expect(
      within(screen.getByTestId('column-out')).getByTestId('card-jeddah_export_terminal'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: strings.levers.L5.options.extended }))
    expect(
      within(screen.getByTestId('column-in')).getByTestId('card-jeddah_export_terminal'),
    ).toBeInTheDocument()
  })

  it('phrases the trigger point for out, capital-deferred and in cards', () => {
    render(<Portfolio />)
    const p = runPlan(scenarioPresets.base, planData)
    const jeddah = screen.getByTestId('card-jeddah_export_terminal')
    expect(within(jeddah).getByTestId('trigger')).toHaveTextContent(
      strings.portfolio.trigger.becomesViable,
    )
    expect(within(jeddah).getByTestId('trigger')).toHaveTextContent(
      strings.levers.L5.options.extended,
    )
    const pcc = screen.getByTestId('card-pcc_plant')
    const need = p.initiatives.find((i) => i.id === 'pcc_plant')!.trigger!.threshold
    expect(within(pcc).getByTestId('trigger')).toHaveTextContent(
      strings.portfolio.trigger.fundedOnce,
    )
    expect(within(pcc).getByTestId('trigger')).toHaveTextContent(String(need))
    const dololime = screen.getByTestId('card-dololime_line')
    expect(within(dololime).getByTestId('trigger')).toHaveTextContent(
      strings.portfolio.trigger.staysIn,
    )
  })

  it('opens the initiative sheet with the RFQ fields on click and closes it', async () => {
    render(<Portfolio />)
    fireEvent.click(within(screen.getByTestId('card-pcc_plant')).getByRole('button'))
    const sheet = screen.getByRole('dialog')
    const init = planData.initiatives.initiatives.find((i) => i.id === 'pcc_plant')!
    expect(within(sheet).getByText(init.objective)).toBeInTheDocument()
    expect(within(sheet).getByText(init.rationale)).toBeInTheDocument()
    const kpiName = (k: string) =>
      planData.objectives.scorecard.kpis.find((x) => x.id === k)?.name ?? k
    for (const k of init.kpis) expect(within(sheet).getByText(kpiName(k))).toBeInTheDocument()
    for (const r of init.risks) expect(within(sheet).getByText(r)).toBeInTheDocument()
    expect(within(sheet).getByText(strings.portfolio.sheet.milestones)).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: strings.portfolio.sheet.close }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('Growth portfolio cascade', () => {
  beforeEach(() => useLevers.getState().reset())

  it('shows the objectives served and the project count on the card', () => {
    render(<Portfolio />)
    const card = screen.getByTestId('card-pcc_plant')
    const init = planData.initiatives.initiatives.find((i) => i.id === 'pcc_plant')!
    for (const o of init.objectives) expect(within(card).getByText(o)).toBeInTheDocument()
    expect(
      within(card).getByText(strings.portfolio.card.projects(init.projects.length)),
    ).toBeInTheDocument()
  })

  it('opens the sheet with the cascade breadcrumb, the projects and the requirements', () => {
    render(<Portfolio />)
    fireEvent.click(within(screen.getByTestId('card-pcc_plant')).getByRole('button'))
    const sheet = screen.getByRole('dialog')
    const init = planData.initiatives.initiatives.find((i) => i.id === 'pcc_plant')!
    const objective = planData.objectives.objectives.find((o) => o.id === init.objectives[0])!
    const shift = planData.objectives.shifts.find((s) => s.id === objective.shift)!
    const crumb = within(sheet).getByTestId('cascade-breadcrumb')
    expect(crumb).toHaveTextContent(shift.name)
    expect(crumb).toHaveTextContent(objective.name)
    expect(within(sheet).getAllByTestId('sheet-project')).toHaveLength(init.projects.length)
    for (const p of init.projects) expect(within(sheet).getByText(p.name)).toBeInTheDocument()
    expect(within(sheet).getByText(init.requirements.people)).toBeInTheDocument()
    for (const d of init.requirements.decisions)
      expect(within(sheet).getByText(d)).toBeInTheDocument()
    expect(within(sheet).getByText('Revenue from new products and markets')).toBeInTheDocument()
  })
})
