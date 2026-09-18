import { buildGraph, litPath, PLAN_LINES } from './strataGraph'
import { runPlan } from '../engine'
import { planData, scenarioPresets } from '../data'

const plan = runPlan(scenarioPresets.base, planData)
const g = buildGraph(planData, plan)

describe('strata graph', () => {
  it('lists the assumption keys as the union of what the levers move, in lever order', () => {
    expect(g.assumptions).toEqual([
      'demand',
      'utilization',
      'priceIndex',
      'costPerTon',
      'ebitda',
      'portfolio',
      'capex',
      'roadmap',
      'sites',
      'classification',
    ])
    expect(PLAN_LINES).toEqual(['revenue', 'ebitda', 'capex', 'fcf', 'cumulativeFcf'])
  })

  it('links a lever to the initiatives whose rules or scaling reference it', () => {
    expect(g.leverInitiatives.L5).toEqual(
      expect.arrayContaining(['jeddah_export_terminal', 'gcc_export_sales']),
    )
    expect(g.leverInitiatives.L4).toEqual(
      expect.arrayContaining(['pcc_plant', 'western_quarry_acq', 'bolt_on_acquisition']),
    )
    expect(g.leverInitiatives.L2).toEqual(expect.arrayContaining(['pcc_plant', 'kiln_efficiency']))
    expect(g.leverInitiatives.L6).toEqual(expect.arrayContaining(['carbon_capture_pilot']))
  })

  it('links the envelope lever to every funded or capital-deferred initiative', () => {
    const inOrCapital = plan.initiatives
      .filter((i) => i.status === 'in' || (i.status === 'deferred' && i.reason === 'capital'))
      .map((i) => i.id)
    for (const id of inOrCapital) expect(g.leverInitiatives.L3).toContain(id)
    expect(g.leverInitiatives.L3).not.toContain('jeddah_export_terminal')
  })

  it('maps each initiative to the plan lines it changes', () => {
    expect(g.initiativeLines.pricing_reset).toEqual([
      'revenue',
      'ebitda',
      'capex',
      'fcf',
      'cumulativeFcf',
    ])
    expect(g.initiativeLines.kiln_efficiency).toEqual(['ebitda', 'capex', 'fcf', 'cumulativeFcf'])
    expect(g.initiativeLines.bricks_choice).toEqual(['revenue', 'ebitda', 'fcf', 'cumulativeFcf'])
  })

  it('lights the full path from a lever, top to bottom', () => {
    const p = litPath(g, { kind: 'lever', id: 'L3' })
    expect(p.levers).toEqual(['L3'])
    expect(p.assumptions).toEqual(['portfolio', 'capex', 'roadmap'])
    expect(p.initiatives).toEqual(g.leverInitiatives.L3)
    expect(p.lines).toEqual(expect.arrayContaining(['capex', 'fcf', 'cumulativeFcf']))
  })

  it('lights a path from an assumption through the levers that move it', () => {
    const p = litPath(g, { kind: 'assumption', id: 'costPerTon' })
    expect(p.levers).toEqual(['L2', 'L6'])
    expect(p.initiatives).toEqual(
      expect.arrayContaining(['kiln_efficiency', 'carbon_capture_pilot']),
    )
    expect(p.lines).toEqual(expect.arrayContaining(['ebitda', 'fcf']))
  })

  it('lights a path upward and downward from an initiative', () => {
    const p = litPath(g, { kind: 'initiative', id: 'jeddah_export_terminal' })
    // Out on Base, so it hangs only off the export lever, not the envelope.
    expect(p.levers).toEqual(['L5'])
    expect(p.assumptions).toEqual(['demand', 'portfolio', 'sites', 'classification'])
    expect(p.initiatives).toEqual(['jeddah_export_terminal'])
    expect(p.lines).toEqual(['revenue', 'ebitda', 'capex', 'fcf', 'cumulativeFcf'])
  })

  it('lights a path upward from a plan line', () => {
    const p = litPath(g, { kind: 'line', id: 'revenue' })
    expect(p.lines).toEqual(['revenue'])
    expect(p.initiatives).toContain('pricing_reset')
    expect(p.initiatives).not.toContain('kiln_efficiency')
    expect(p.levers).toEqual(expect.arrayContaining(['L1', 'L5']))
  })

  it('returns empty sets when nothing is hovered', () => {
    const p = litPath(g, null)
    expect(p.levers).toEqual([])
    expect(p.initiatives).toEqual([])
  })
})
