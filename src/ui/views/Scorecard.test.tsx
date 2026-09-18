import { render, screen, fireEvent, within } from '@testing-library/react'
import { Scorecard } from './Scorecard'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

describe('Scorecard view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders every KPI under its perspective with baseline, targets and a live value where computed', () => {
    render(<Scorecard />)
    const plan = runPlan(scenarioPresets.base, planData)
    const kpis = planData.objectives.scorecard.kpis
    expect(screen.getAllByTestId('kpi-row')).toHaveLength(kpis.length)
    for (const p of planData.objectives.scorecard.perspectives)
      expect(screen.getByTestId(`perspective-${p}`)).toBeInTheDocument()
    const margin = screen.getByTestId('kpi-row-K1')
    expect(within(margin).getByTestId('kpi-live')).toHaveTextContent(
      (plan.financials.ebitdaMargin[5] * 100).toFixed(1),
    )
    expect(within(margin).getByTestId('kpi-baseline')).toHaveTextContent('20')
    expect(
      within(screen.getByTestId('kpi-row-K13')).getByText(strings.scorecard.entered),
    ).toBeInTheDocument()
  })

  it('marks lead indicators and lists the triggers that read them', () => {
    render(<Scorecard />)
    const energy = screen.getByTestId('kpi-row-K16')
    expect(within(energy).getByText(strings.scorecard.lead)).toBeInTheDocument()
    expect(within(energy).getByText('Precipitated calcium carbonate plant')).toBeInTheDocument()
  })

  it('reads the chosen year and moves the live value with a lever', () => {
    render(
      <>
        <LeverRail />
        <Scorecard />
      </>,
    )
    fireEvent.click(screen.getByRole('radio', { name: '2028' }))
    const plan = runPlan(scenarioPresets.base, planData)
    expect(within(screen.getByTestId('kpi-row-K2')).getByTestId('kpi-live')).toHaveTextContent(
      Math.round(plan.financials.revenue[2]).toLocaleString('en-US'),
    )
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    expect(within(screen.getByTestId('kpi-row-K16')).getByTestId('kpi-live')).toHaveTextContent(
      '140',
    )
  })

  it('lists the OKRs under every objective with its owner and status', () => {
    render(<Scorecard />)
    const plan = runPlan(scenarioPresets.base, planData)
    expect(screen.getAllByTestId('okr-objective')).toHaveLength(
      planData.objectives.objectives.length,
    )
    const o15 = screen.getByTestId('okr-O15')
    expect(
      within(o15).getByText(
        strings.cascade.status[plan.objectives.find((o) => o.id === 'O15')!.status],
      ),
    ).toBeInTheDocument()
    expect(within(o15).getByText('CEO')).toBeInTheDocument()
  })
})
