import { render, screen, fireEvent, within } from '@testing-library/react'
import { Plans } from './Plans'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan, PLAN_IDS } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'

describe('Plans and requirements view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders the five plans with their projects, capex by year and requirements', () => {
    render(<Plans />)
    const plan = runPlan(scenarioPresets.base, planData)
    for (const id of PLAN_IDS) {
      const card = screen.getByTestId(`plan-${id}`)
      const rollup = plan.plans.find((p) => p.id === id)!
      expect(within(card).getByText(strings.plans.names[id])).toBeInTheDocument()
      expect(
        within(card).getByText(strings.plans.deliverables[id], { exact: false }),
      ).toBeInTheDocument()
      expect(within(card).getAllByTestId('project-row')).toHaveLength(rollup.projects.length)
      expect(within(card).getByTestId('plan-capex')).toHaveTextContent(sarm(rollup.capexTotal))
      expect(within(card).getByTestId('plan-headcount')).toHaveTextContent(
        String(Math.abs(rollup.headcountDelta)),
      )
      expect(within(card).getByText(strings.plans.needs)).toBeInTheDocument()
    }
    expect(screen.queryByText('Executive and Board')).toBeNull()
  })

  it('keeps the site gauges and the people panel inside the operations and HR plans', () => {
    render(<Plans />)
    const plan = runPlan(scenarioPresets.base, planData)
    const ops = screen.getByTestId('plan-operations')
    for (const s of plan.sites) expect(within(ops).getByTestId(`site-${s.id}`)).toBeInTheDocument()
    expect(within(ops).getByTestId('energy-cost')).toHaveTextContent(
      String(Math.round(plan.supplyChain.energyCostPerTonLime)),
    )
    const hr = screen.getByTestId('plan-hr')
    expect(within(hr).getByTestId('headcount')).toHaveTextContent(sarm(plan.people.headcount[5]))
    expect(within(hr).getByText(strings.operations.nitaqat, { exact: false })).toBeInTheDocument()
  })

  it('drops the PCC projects from the operations plan when energy passes 130', () => {
    render(
      <>
        <LeverRail />
        <Plans />
      </>,
    )
    const ops = () => screen.getByTestId('plan-operations')
    const pccRows = () =>
      within(ops())
        .getAllByTestId('project-row')
        .filter((r) => r.getAttribute('data-initiative') === 'pcc_plant')
    expect(pccRows()[0]).toHaveAttribute('data-status', 'deferred')
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    expect(pccRows()[0]).toHaveAttribute('data-status', 'out')
  })
})

describe('Sustainability plan emissions path', () => {
  beforeEach(() => useLevers.getState().reset())

  it('shows the emissions path from the 2025 baseline and the decarbonization roadmap', () => {
    render(<Plans />)
    const plan = runPlan(scenarioPresets.base, planData)
    const panel = within(screen.getByTestId('plan-sustainability')).getByTestId('emissions-panel')
    expect(within(panel).getAllByTestId('emissions-year')).toHaveLength(plan.years.length + 1)
    expect(within(panel).getByText('2025')).toBeInTheDocument()
    expect(within(panel).getAllByTestId('roadmap-step').length).toBe(plan.emissions.roadmap.length)
    expect(within(panel).getByText('Gas at Riyadh')).toBeInTheDocument()
  })
})
