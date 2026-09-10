import { render, screen, fireEvent, within } from '@testing-library/react'
import { Operations } from './Operations'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'

const plan = () => runPlan(useLevers.getState().levers, planData)

describe('Operations and people view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders the three site cards with utilization for the last plan year by default', () => {
    render(<Operations />)
    const p = plan()
    for (const s of p.sites) {
      const card = screen.getByTestId(`site-${s.id}`)
      expect(within(card).getByText(s.name)).toBeInTheDocument()
      expect(within(card).getByTestId('utilization')).toHaveTextContent(
        `${Math.round(s.utilization[5] * 100)}`,
      )
      expect(within(card).getByTestId('capacity')).toHaveTextContent(sarm(s.capacity[5]))
    }
  })

  it('moves every panel to the year picked on the scrubber', () => {
    render(<Operations />)
    const p = plan()
    fireEvent.click(screen.getByRole('radio', { name: '2027' }))
    expect(within(screen.getByTestId('site-jeddah')).getByTestId('utilization')).toHaveTextContent(
      `${Math.round(p.sites[2].utilization[1] * 100)}`,
    )
    expect(screen.getByTestId('headcount')).toHaveTextContent(sarm(p.people.headcount[1]))
    expect(screen.getByTestId('saudization')).toHaveTextContent(
      `${(p.people.saudization[1] * 100).toFixed(0)}`,
    )
    expect(screen.getByTestId('cost-per-ton')).toHaveTextContent(
      String(Math.round(p.people.costPerTon[1])),
    )
  })

  it('lists the selected initiatives at each site', () => {
    render(<Operations />)
    const p = plan()
    const alkharj = screen.getByTestId('site-alkharj')
    const expected = planData.initiatives.initiatives.filter(
      (i) => i.site === 'alkharj' && p.initiatives.find((x) => x.id === i.id)?.status === 'in',
    )
    for (const i of expected) expect(within(alkharj).getByText(i.name)).toBeInTheDocument()
  })

  it('shows the supply chain unit costs and moves energy cost with L2', () => {
    render(
      <>
        <LeverRail />
        <Operations />
      </>,
    )
    const before = screen.getByTestId('energy-cost').textContent
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    const p = runPlan({ ...scenarioPresets.base, L2: 140 }, planData)
    expect(screen.getByTestId('energy-cost')).toHaveTextContent(
      String(Math.round(p.supplyChain.energyCostPerTonLime)),
    )
    expect(screen.getByTestId('energy-cost').textContent).not.toBe(before)
    expect(screen.getByTestId('logistics-cost')).toHaveTextContent('65')
    expect(screen.getByTestId('carbon-cost')).toHaveTextContent('0')
  })

  it('names the workforce initiative status and the Nitaqat target', () => {
    render(<Operations />)
    expect(screen.getByTestId('workforce-status')).toHaveTextContent(strings.portfolio.columns.in)
    expect(screen.getByText(strings.operations.nitaqat, { exact: false })).toBeInTheDocument()
  })
})
