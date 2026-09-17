import { render, screen, within } from '@testing-library/react'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { sarm, signed } from '../format'
import { ScenarioStrip } from './ScenarioStrip'

describe('ScenarioStrip', () => {
  it('keeps the custom case current and compares each metric with the same Base metric', () => {
    const base = runPlan(scenarioPresets.base, planData)
    const custom = runPlan({ ...scenarioPresets.base, L2: 140 }, planData)
    render(<ScenarioStrip plan={custom} />)
    const current = screen.getByTestId('scenario-row-custom')
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('scenario-row-base')).not.toHaveAttribute('aria-current')
    const cells = within(current).getAllByRole('cell')
    const last = custom.years.length - 1
    for (const [index, metric] of (['revenue', 'ebitda', 'cumulativeFcf'] as const).entries()) {
      expect(cells[index + 1]).toHaveTextContent(sarm(custom.financials[metric][last]))
      expect(cells[index + 1]).toHaveTextContent(
        `${signed(custom.financials[metric][last] - base.financials[metric][last])} vs Base`,
      )
    }
    expect(screen.getByRole('region')).toHaveAttribute('tabIndex', '0')
  })
})
