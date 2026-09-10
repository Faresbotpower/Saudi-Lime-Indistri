import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { Direction } from './Direction'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

const plan = () => runPlan(useLevers.getState().levers, planData)

describe('Strategic direction view', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().setHoveredLever(null)
  })

  it('renders the three bands with assumption, initiative and plan chips', () => {
    render(<Direction />)
    expect(within(screen.getByTestId('band-assumptions')).getAllByTestId('chip')).toHaveLength(10)
    expect(within(screen.getByTestId('band-initiatives')).getAllByTestId('chip')).toHaveLength(
      planData.initiatives.initiatives.length,
    )
    expect(within(screen.getByTestId('band-plan')).getAllByTestId('chip')).toHaveLength(5)
    expect(screen.getByText(strings.direction.idle)).toBeInTheDocument()
  })

  it('lights the path top to bottom when a lever in the rail is hovered', () => {
    render(<Direction />)
    act(() => useLevers.getState().setHoveredLever('L3'))
    const lit = (band: string) =>
      within(screen.getByTestId(`band-${band}`))
        .getAllByTestId('chip')
        .filter((c) => c.getAttribute('data-lit') === 'true')
        .map((c) => c.getAttribute('data-id'))
    expect(lit('assumptions')).toEqual(['portfolio', 'capex', 'roadmap'])
    const p = plan()
    const expected = p.initiatives
      .filter((i) => i.status === 'in' || (i.status === 'deferred' && i.reason === 'capital'))
      .map((i) => i.id)
    expect(lit('initiatives').sort()).toEqual(expected.sort())
    expect(lit('plan')).toEqual(expect.arrayContaining(['capex', 'fcf', 'cumulativeFcf']))
    expect(screen.queryByText(strings.direction.idle)).toBeNull()
  })

  it('lights a path from a chip on hover and clears on leave', () => {
    render(<Direction />)
    const chip = within(screen.getByTestId('band-initiatives')).getByText(
      'Red Sea export corridor, Jeddah',
    )
    fireEvent.mouseEnter(chip)
    const litAssumptions = within(screen.getByTestId('band-assumptions'))
      .getAllByTestId('chip')
      .filter((c) => c.getAttribute('data-lit') === 'true')
    expect(litAssumptions.length).toBeGreaterThan(0)
    fireEvent.mouseLeave(chip)
    expect(screen.getByText(strings.direction.idle)).toBeInTheDocument()
  })

  it('draws one bubble per classification cell and one table row per cell', () => {
    render(<Direction />)
    const p = plan()
    expect(screen.getAllByTestId('bubble')).toHaveLength(p.classification.length)
    expect(screen.getAllByTestId('class-row')).toHaveLength(p.classification.length)
  })

  it('shows the category change against Base only where it differs', () => {
    render(
      <>
        <LeverRail />
        <Direction />
      </>,
    )
    expect(screen.queryAllByTestId('class-delta')).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    const now = runPlan({ ...scenarioPresets.base, L2: 140 }, planData)
    const base = runPlan(scenarioPresets.base, planData)
    const changed = now.classification.filter(
      (c) => base.classification.find((b) => b.id === c.id)?.category !== c.category,
    )
    expect(screen.getAllByTestId('class-delta')).toHaveLength(changed.length)
    expect(changed.length).toBeGreaterThan(0)
  })
})
