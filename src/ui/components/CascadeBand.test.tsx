import { render, screen, fireEvent, within } from '@testing-library/react'
import { Direction } from '../views/Direction'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

describe('From facts to objectives band', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().setHoveredLever(null)
    useLevers.getState().setHoveredShift(null)
  })

  it('lists every shift and expands one into its objectives with owner, target and status', () => {
    render(<Direction />)
    const shifts = planData.objectives.shifts
    expect(screen.getAllByTestId('shift')).toHaveLength(shifts.length)
    fireEvent.click(screen.getByTestId('shift-S1'))
    const plan = runPlan(scenarioPresets.base, planData)
    const o1 = plan.objectives.find((o) => o.id === 'O1')!
    const card = screen.getByTestId('objective-O1')
    expect(within(card).getByText(o1.owner)).toBeInTheDocument()
    expect(within(card).getByText(strings.cascade.status[o1.status])).toBeInTheDocument()
    expect(screen.queryByTestId('objective-O3')).toBeNull()
  })

  it('hovering a shift lights its objectives, initiatives and plan lines in the strata', () => {
    render(<Direction />)
    fireEvent.mouseEnter(screen.getByTestId('shift-S5'))
    expect(useLevers.getState().hoveredShift).toBe('S5')
    const inits = within(screen.getByTestId('band-initiatives'))
    expect(
      inits.getByText('Precipitated calcium carbonate plant').closest('[data-testid="chip"]'),
    ).toHaveAttribute('data-lit', 'true')
    expect(
      inits
        .getByText('Fleet outsourcing and logistics optimization')
        .closest('[data-testid="chip"]'),
    ).toHaveAttribute('data-lit', 'false')
    expect(screen.getByTestId('shift-S5')).toHaveAttribute('data-lit', 'true')
    fireEvent.mouseLeave(screen.getByTestId('shift-S5'))
    expect(useLevers.getState().hoveredShift).toBeNull()
  })

  it('carries the Board view with initiative counts and headroom', () => {
    render(<Direction />)
    const plan = runPlan(scenarioPresets.base, planData)
    const board = screen.getByTestId('board-view')
    expect(within(board).getByTestId('board-headroom')).toHaveTextContent(
      String(Math.round(plan.capital.headroom)),
    )
    expect(within(board).getByTestId('board-inPlan')).toHaveTextContent(
      String(plan.initiatives.filter((i) => i.status === 'in').length),
    )
  })
})
