import { render, screen, fireEvent, within } from '@testing-library/react'
import { Financials } from './Financials'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

const fmt0 = (x: number) => Math.round(x).toLocaleString('en-US')

describe('Financial plan view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders the four KPI tiles with the Base plan values', () => {
    render(<Financials />)
    const plan = runPlan(scenarioPresets.base, planData)
    const tiles = screen.getAllByTestId('kpi-tile')
    expect(tiles).toHaveLength(4)
    expect(within(tiles[0]).getByText(strings.financials.kpi.revenue2031)).toBeInTheDocument()
    expect(within(tiles[0]).getByTestId('kpi-value')).toHaveTextContent(
      fmt0(plan.financials.revenue[5]),
    )
    expect(within(tiles[1]).getByTestId('kpi-value')).toHaveTextContent(
      `${(plan.financials.ebitdaMargin[5] * 100).toFixed(1)}`,
    )
    expect(within(tiles[3]).getByTestId('kpi-value')).toHaveTextContent(
      fmt0(plan.financials.cumulativeFcf[5]),
    )
  })

  it('shows no delta chips on Base and coral chips once energy cost rises', () => {
    render(
      <>
        <LeverRail />
        <Financials />
      </>,
    )
    expect(screen.queryAllByTestId('delta-chip')).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    const plan = runPlan({ ...scenarioPresets.base, L2: 140 }, planData)
    const tiles = screen.getAllByTestId('kpi-tile')
    expect(within(tiles[1]).getByTestId('kpi-value')).toHaveTextContent(
      `${(plan.financials.ebitdaMargin[5] * 100).toFixed(1)}`,
    )
    const chips = screen.getAllByTestId('delta-chip')
    expect(chips.length).toBeGreaterThan(0)
    expect(within(tiles[1]).getByTestId('delta-chip')).toHaveAttribute('data-direction', 'down')
  })

  it('lists the four presets in the compare strip and highlights the current one', () => {
    render(<Financials />)
    const strip = screen.getByTestId('scenario-strip')
    for (const id of ['base', 'growth', 'upside', 'downside'] as const)
      expect(within(strip).getByText(strings.scenarios[id])).toBeInTheDocument()
    expect(within(strip).getByTestId('scenario-row-base')).toHaveAttribute('data-current', 'true')
    expect(within(strip).queryByTestId('scenario-row-custom')).toBeNull()
  })

  it('adds a Custom row to the strip when levers leave the presets', () => {
    render(
      <>
        <LeverRail />
        <Financials />
      </>,
    )
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '120' } })
    const strip = screen.getByTestId('scenario-strip')
    expect(within(strip).getByTestId('scenario-row-custom')).toHaveAttribute('data-current', 'true')
  })

  it('carries the illustrative footnote', () => {
    render(<Financials />)
    expect(screen.getByText(strings.common.illustrativeFootnote)).toBeInTheDocument()
  })
})

describe('Financial plan baseline and history', () => {
  beforeEach(() => useLevers.getState().reset())

  it('opens the 2026 actuals card from the Baseline chip with the five-year history', async () => {
    render(<Financials />)
    fireEvent.click(screen.getByRole('button', { name: strings.financials.baseline }))
    const sheet = screen.getByRole('dialog')
    const a = planData.assumptions
    expect(within(sheet).getByTestId('baseline-revenue')).toHaveTextContent(
      fmt0(a.baseCase.revenue),
    )
    expect(within(sheet).getByTestId('baseline-ebitda')).toHaveTextContent(fmt0(a.baseCase.ebitda))
    for (const y of a.history!.years) expect(within(sheet).getByText(String(y))).toBeInTheDocument()
    expect(within(sheet).getByText(strings.financials.deliverable)).toBeInTheDocument()
  })

  it('draws the history years before the divider', () => {
    render(<Financials />)
    const chart = screen.getByTestId('chart-revenue-ebitda')
    expect(chart).toHaveAttribute(
      'data-history-years',
      String(planData.assumptions.history!.years.length - 1),
    )
  })
})

describe('Financial plan under the gas transition', () => {
  beforeEach(() => useLevers.getState().reset())

  it('shows 2026 twice: the actual on diesel and crude and the pro forma on gas', () => {
    render(<Financials />)
    const plan = runPlan(scenarioPresets.base, planData)
    expect(
      within(screen.getByTestId('pro-forma-actual')).getByText(fmt0(plan.financials.ebitda[0])),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('pro-forma-proforma')).getByText(fmt0(plan.proForma2026.ebitda)),
    ).toBeInTheDocument()
    expect(plan.proForma2026.ebitda).toBeGreaterThan(plan.financials.ebitda[0])
    fireEvent.click(screen.getByRole('button', { name: strings.financials.baseline }))
    expect(screen.getByTestId('baseline-proforma-ebitda')).toHaveTextContent(
      fmt0(plan.proForma2026.ebitda),
    )
    expect(screen.getByText(strings.inputs.baseNote)).toBeInTheDocument()
  })

  it('derives the capital envelope from the plan when the lever is set to Derived', () => {
    render(
      <>
        <LeverRail />
        <Financials />
      </>,
    )
    expect(
      within(screen.getByTestId('envelope-card')).getByText(strings.financials.envelope.hint),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: strings.levers.L3.derived }))
    const plan = runPlan({ ...scenarioPresets.base, L3derived: true }, planData)
    expect(useLevers.getState().levers.L3derived).toBe(true)
    expect(useLevers.getState().scenario).toBe('custom')
    expect(screen.getByTestId('envelope-value')).toHaveTextContent(
      fmt0(plan.envelopeDerivation!.envelope),
    )
    expect(screen.getByTestId('envelope-cash')).toHaveTextContent(
      fmt0(plan.envelopeDerivation!.cashGenerated),
    )
    fireEvent.click(screen.getByRole('radio', { name: strings.levers.L3.set }))
    expect(useLevers.getState().levers.L3derived).toBeUndefined()
  })
})
