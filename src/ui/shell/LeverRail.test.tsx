import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { leverDefs } from '../../data'
import { useLevers } from '../../state/levers'
import { LeverRail } from './LeverRail'

describe('scenario control rail', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().resetOverrides()
    useLevers.getState().setAllInputsOpen(false)
  })

  it('keeps all six decisions accessible while moving supporting copy into disclosures', async () => {
    render(<LeverRail />)
    const rail = screen.getByRole('complementary', { name: 'Scenario controls' })
    for (const def of leverDefs) {
      expect(within(rail).getByRole('heading', { name: def.name })).toBeInTheDocument()
      expect(within(rail).queryByText(def.description)).not.toBeInTheDocument()
    }
    expect(within(rail).getAllByRole('radiogroup')).toHaveLength(4)
    expect(within(rail).getAllByRole('slider')).toHaveLength(3)
    expect(within(rail).getByLabelText(/Exact value, energy index/)).toBeVisible()
    const energy = within(rail).getByTestId('inputs-L2')
    fireEvent.click(within(energy).getByRole('button'))
    await waitFor(() =>
      expect(
        within(energy).getByText(leverDefs.find((def) => def.id === 'L2')!.description),
      ).toBeVisible(),
    )
  })

  it('lets the walkthrough open energy assumptions directly through the store', () => {
    render(<LeverRail />)
    act(() => useLevers.getState().setInputsOpen('L2', true))
    const target = screen.getByTestId('inputs-L2')
    expect(target).toBeVisible()
    const disclosure = within(target).getByRole('button', { expanded: true })
    expect(disclosure).toHaveAttribute('aria-controls', 'assumptions-L2')
    expect(within(target).getByLabelText(/Natural gas/)).toBeInTheDocument()
    expect(document.querySelector('[data-tour="rail"]')).toBeVisible()
    expect(document.querySelector('[data-tour="presets"]')).toBeVisible()
    expect(document.querySelector('[data-tour="explain"]')).toBeVisible()
  })
})
