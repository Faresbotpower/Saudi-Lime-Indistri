import { render, screen, fireEvent, within } from '@testing-library/react'
import { LeverRail } from '../shell/LeverRail'
import { TopBar } from '../shell/TopBar'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { planData } from '../../data'
import { indexFromFuel } from '../inputSpecs'

const openInputs = (id: string) => {
  const box = screen.getByTestId(`inputs-${id}`)
  fireEvent.click(within(box).getByRole('button', { name: new RegExp(strings.inputs.toggle) }))
  return box
}

describe('typed inputs under the levers', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().resetOverrides()
  })

  it('the exact lever value is always visible and writes the lever', () => {
    render(<LeverRail />)
    expect(screen.getByLabelText(/Exact value, energy index/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Natural gas/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Exact value, energy index/), {
      target: { value: '137' },
    })
    expect(useLevers.getState().levers.L2).toBe(137)
    expect(screen.getByText('137')).toBeInTheDocument()
  })

  it('fuel prices set the energy index through the base prices in the data', () => {
    render(<LeverRail />)
    openInputs('L2')
    fireEvent.change(screen.getByLabelText(/Natural gas/), { target: { value: '9' } })
    const base = planData.assumptions.energy.fuel!
    expect(useLevers.getState().levers.L2).toBe(
      indexFromFuel(9, base.dieselSarPerLitre, base.gasShare, base),
    )
    expect(useLevers.getState().overrides['energy.fuel.gasSarPerMmbtu']).toBe(9)
  })

  it('an underlying assumption becomes an override in the store, shown as edited, and resets', () => {
    render(
      <>
        <TopBar />
        <LeverRail />
      </>,
    )
    const box = openInputs('L1')
    const growth = within(box).getByLabelText(/Steel and iron, Growth/)
    expect(growth).toHaveValue(4.5)
    fireEvent.change(growth, { target: { value: '6' } })
    expect(useLevers.getState().overrides['sectors.steel.growth']).toBeCloseTo(0.06, 9)
    expect(within(box).getByText(strings.inputs.edited(1))).toBeInTheDocument()
    expect(screen.getByTestId('inputs-chip')).toHaveTextContent(strings.inputs.editedChip(1))
    fireEvent.click(within(box).getByRole('button', { name: strings.inputs.reset }))
    expect(useLevers.getState().overrides).toEqual({})
  })

  it('percent fields display percentages and store ratios', () => {
    render(<LeverRail />)
    const box = openInputs('L3')
    const dr = within(box).getByLabelText(/Discount rate/)
    expect(dr).toHaveValue(10)
    fireEvent.change(dr, { target: { value: '12' } })
    expect(useLevers.getState().overrides['discountRate']).toBeCloseTo(0.12, 9)
  })

  it('the base year card exposes 2026 actuals, prices, capacity and people', () => {
    render(<LeverRail />)
    const box = openInputs('base')
    expect(within(box).getByLabelText(/^Revenue/)).toHaveValue(612)
    expect(within(box).getByLabelText(/Quicklime and hydrated lime, List price/)).toHaveValue(420)
    expect(within(box).getByLabelText(/Riyadh, Quicklime and hydrated lime/)).toHaveValue(520)
    expect(within(box).getByLabelText(/Nitaqat target/)).toHaveValue(50)
  })

  it('open all inputs expands every card, close all folds them', () => {
    render(<LeverRail />)
    fireEvent.click(screen.getByRole('button', { name: strings.inputs.openAll }))
    expect(screen.getByLabelText(/Natural gas/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nitaqat target/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.inputs.closeAll }))
    expect(screen.queryByLabelText(/Natural gas/)).toBeNull()
  })

  it('risk appetite has no numeric inputs and says so', () => {
    render(<LeverRail />)
    const box = openInputs('L4')
    expect(within(box).getByText(strings.inputs.none)).toBeInTheDocument()
  })
})
