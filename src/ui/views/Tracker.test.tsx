import { render, screen, fireEvent, within } from '@testing-library/react'
import { Tracker } from './Tracker'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

describe('Tracker view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('lists the six levers with plan assumptions, editable actuals for the tracked fields only', () => {
    render(<Tracker />)
    expect(screen.getAllByTestId('tracker-row')).toHaveLength(6)
    expect(screen.getByLabelText('Actual L1')).toBeInTheDocument()
    expect(screen.getByLabelText('Actual L2')).toBeInTheDocument()
    expect(screen.getByLabelText('Actual L6')).toBeInTheDocument()
    expect(screen.queryByLabelText('Actual L3')).toBeNull()
    expect(screen.getAllByText(strings.tracker.notTracked)).toHaveLength(3)
    expect(screen.getAllByText(strings.tracker.awaiting)).toHaveLength(3)
    expect(screen.getByText(strings.tracker.none)).toBeInTheDocument()
  })

  it('marks the status when an actual is typed and lists the triggers fired', () => {
    render(<Tracker />)
    fireEvent.change(screen.getByLabelText('Actual L2'), { target: { value: '140' } })
    const row = screen.getByTestId('tracker-row-L2')
    expect(within(row).getByTestId('status')).toHaveTextContent(strings.tracker.above)
    const tracked = runPlan(scenarioPresets.base, planData, { actuals: { year: 2027, L2: 140 } })
    expect(tracked.triggersFired.length).toBeGreaterThan(0)
    const panel = screen.getByTestId('triggers-fired')
    expect(within(panel).getAllByTestId('trigger-fired')).toHaveLength(tracked.triggersFired.length)
    expect(within(panel).getByText('Precipitated calcium carbonate plant')).toBeInTheDocument()
    expect(within(panel).getByText(strings.tracker.decisions.out)).toBeInTheDocument()
  })

  it('shows on plan when the actual equals the plan assumption, and clears', () => {
    render(<Tracker />)
    fireEvent.change(screen.getByLabelText('Actual L2'), { target: { value: '100' } })
    expect(within(screen.getByTestId('tracker-row-L2')).getByTestId('status')).toHaveTextContent(
      strings.tracker.onPlan,
    )
    fireEvent.click(screen.getByRole('button', { name: strings.tracker.clear }))
    expect(screen.getAllByText(strings.tracker.awaiting)).toHaveLength(3)
    expect(useLevers.getState().actuals).toEqual({})
  })

  it('keeps the actuals in the store so other views see the tracked plan', () => {
    render(<Tracker />)
    fireEvent.change(screen.getByLabelText('Actual L1'), { target: { value: '0.8' } })
    expect(useLevers.getState().actuals).toEqual({ L1multiplier: 0.8 })
    expect(within(screen.getByTestId('tracker-row-L1')).getByTestId('status')).toHaveTextContent(
      strings.tracker.below,
    )
  })
})

describe('Tracker scorecard rows and quarterly review', () => {
  beforeEach(() => useLevers.getState().reset())

  it('lists every scorecard KPI against its 2027 target and types the lead indicators as actuals', () => {
    render(<Tracker />)
    const kpis = planData.objectives.scorecard.kpis
    expect(screen.getAllByTestId('kpi-row')).toHaveLength(kpis.length)
    fireEvent.change(screen.getByLabelText('Actual K16'), { target: { value: '140' } })
    expect(useLevers.getState().actuals).toEqual({ L2: 140 })
    fireEvent.change(screen.getByLabelText('Actual K7'), { target: { value: '90' } })
    expect(useLevers.getState().actuals.L1multiplier).toBeCloseTo(0.9, 6)
    expect(screen.queryByLabelText('Actual K1')).toBeNull()
  })

  it('runs the quarterly review: KPIs due, triggers evaluated and decisions due for a quarter', () => {
    render(<Tracker />)
    fireEvent.change(screen.getByLabelText('Actual L2'), { target: { value: '140' } })
    fireEvent.click(screen.getByRole('button', { name: strings.tracker.modes.quarterly }))
    fireEvent.click(screen.getByRole('radio', { name: 'Q2 2027' }))
    const due = screen.getByTestId('kpis-due')
    const quarterly = planData.objectives.scorecard.kpis.filter((k) => k.cadence === 'quarterly')
    expect(within(due).getAllByTestId('kpi-due')).toHaveLength(quarterly.length)
    const triggers = screen.getByTestId('triggers-evaluated')
    expect(within(triggers).getByText('Precipitated calcium carbonate plant')).toBeInTheDocument()
    const decisions = screen.getByTestId('decisions-due')
    expect(within(decisions).getByText(strings.tracker.decisions.out)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Q4 2027' }))
    expect(within(screen.getByTestId('kpis-due')).getAllByTestId('kpi-due')).toHaveLength(
      planData.objectives.scorecard.kpis.length,
    )
  })
})
