import { render, screen, fireEvent, within } from '@testing-library/react'
import { Financials } from '../views/Financials'
import { ExplainSheet } from './ExplainSheet'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'

describe('Explain sheet', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().closeExplain()
    if (useLevers.getState().explain) useLevers.getState().toggleExplain()
  })

  it('shows explain icons on KPI tiles only when the toggle is on', () => {
    render(<Financials />)
    expect(screen.queryAllByRole('button', { name: strings.explain.icon })).toHaveLength(0)
    fireEvent.click(screen.queryByText('nothing') ?? document.body)
    useLevers.getState().toggleExplain()
  })

  it('opens the sheet with the trace behind a KPI and the lever values applied', () => {
    useLevers.getState().toggleExplain()
    render(
      <>
        <Financials />
        <ExplainSheet />
      </>,
    )
    const buttons = screen.getAllByRole('button', { name: strings.explain.icon })
    expect(buttons.length).toBeGreaterThanOrEqual(4)
    const marginTile = screen.getAllByTestId('kpi-tile')[1]
    fireEvent.click(within(marginTile).getByRole('button', { name: strings.explain.icon }))
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText(strings.explain.title)).toBeInTheDocument()
    expect(within(sheet).getAllByTestId('trace-entry').length).toBeGreaterThan(0)
    expect(
      within(sheet).getAllByText(strings.explain.rules['consolidate.margin']).length,
    ).toBeGreaterThan(0)
    expect(within(sheet).getAllByText('L2').length).toBeGreaterThan(0)
  })
})
