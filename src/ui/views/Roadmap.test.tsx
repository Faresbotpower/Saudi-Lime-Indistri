import { render, screen, fireEvent, within } from '@testing-library/react'
import { Roadmap } from './Roadmap'
import { LeverRail } from '../shell/LeverRail'
import { useLevers } from '../../state/levers'
import { runPlan } from '../../engine'
import { planData, scenarioPresets } from '../../data'
import { strings } from '../../strings'

describe('Roadmap view', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders the five layers in order with a bar per funded initiative and a ghost per capital-deferred one', () => {
    render(<Roadmap />)
    const p = runPlan(scenarioPresets.base, planData)
    const layers = screen.getAllByTestId('layer')
    expect(layers.map((l) => l.getAttribute('data-layer'))).toEqual(
      planData.initiatives.layers.map((l) => l.id),
    )
    const inCount = p.initiatives.filter((i) => i.status === 'in').length
    const ghostCount = p.initiatives.filter(
      (i) => i.status === 'deferred' && i.reason === 'capital',
    ).length
    expect(screen.getAllByTestId('bar')).toHaveLength(inCount)
    expect(screen.queryAllByTestId('ghost')).toHaveLength(ghostCount)
  })

  it('positions bars on the quarter grid from start year to ramp completion with a milestone', () => {
    render(<Roadmap />)
    const p = runPlan(scenarioPresets.base, planData)
    const item = p.roadmap.layers.flatMap((l) => l.items).find((i) => i.id === 'alkharj_kiln')!
    const bar = screen.getByTestId('bar-alkharj_kiln')
    expect(bar).toHaveAttribute('data-start', String(item.start))
    expect(bar).toHaveAttribute('data-end', String(item.end))
    expect(within(bar.parentElement!).getByTestId('milestone-alkharj_kiln')).toBeInTheDocument()
  })

  it('labels ghost bars with the extra envelope they need', () => {
    render(<Roadmap />)
    const p = runPlan(scenarioPresets.base, planData)
    const ghost = p.roadmap.layers.flatMap((l) => l.items).find((i) => i.status === 'deferred')!
    expect(screen.getByTestId(`ghost-${ghost.id}`)).toHaveTextContent(
      strings.roadmap.needs(String(ghost.needsCapital)),
    )
  })

  it('draws dependency lines and marks the critical path once the PCC plant is funded', () => {
    render(
      <>
        <LeverRail />
        <Roadmap />
      </>,
    )
    fireEvent.change(screen.getByLabelText('Capital envelope'), { target: { value: '1500' } })
    const p = runPlan({ ...scenarioPresets.base, L3: 1500 }, planData)
    expect(screen.getAllByTestId('dependency-line')).toHaveLength(p.roadmap.links.length)
    for (const id of p.roadmap.criticalPath)
      expect(screen.getByTestId(`bar-${id}`)).toHaveAttribute('data-critical', 'true')
    expect(p.roadmap.criticalPath).toContain('pcc_plant')
  })
})

describe('Roadmap projects', () => {
  beforeEach(() => useLevers.getState().reset())

  it('draws the projects as thin bars under their initiative header bar', () => {
    render(<Roadmap />)
    const p = runPlan(scenarioPresets.base, planData)
    const onRoadmap = new Set(p.roadmap.layers.flatMap((l) => l.items.map((i) => i.id)))
    const expected = p.plans
      .flatMap((x) => x.projects)
      .filter((pr) => onRoadmap.has(pr.initiativeId))
    expect(screen.getAllByTestId('project-bar')).toHaveLength(expected.length)
    const first = expected[0]
    expect(screen.getByTestId(`project-bar-${first.id}`)).toHaveAttribute(
      'data-start',
      String(first.startYear),
    )
  })
})
