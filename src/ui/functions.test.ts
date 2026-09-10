import { functionImpacts, FUNCTIONS, functionOf } from './functions'
import { runPlan } from '../engine'
import { planData, scenarioPresets } from '../data'

const base = runPlan(scenarioPresets.base, planData)

describe('impact by function', () => {
  it('maps every initiative owner to a function', () => {
    for (const i of planData.initiatives.initiatives)
      expect(FUNCTIONS.map((f) => f.id)).toContain(functionOf(i.owner))
    expect(functionOf('VP Commercial')).toBe('commercial')
    expect(functionOf('Plant Director Jeddah')).toBe('operations')
    expect(functionOf('Someone new')).toBe('executive')
  })

  it('builds one card per function with KPIs against Base, owned initiatives and levers', () => {
    const cards = functionImpacts(base, base, base)
    expect(cards.map((c) => c.id)).toEqual(FUNCTIONS.map((f) => f.id))
    for (const c of cards) {
      expect(c.kpis.length).toBeGreaterThan(0)
      expect(c.levers.length).toBeGreaterThan(0)
      for (const k of c.kpis) expect(k.delta).toBeCloseTo(0, 9)
    }
    const commercial = cards.find((c) => c.id === 'commercial')!
    expect(commercial.initiatives.map((i) => i.id)).toContain('pricing_reset')
    expect(commercial.initiatives.map((i) => i.id)).toContain('gcc_export_sales')
  })

  it('shows the energy shock where it lands: finance and supply chain move, commercial revenue does not', () => {
    const shocked = runPlan({ ...scenarioPresets.base, L2: 140 }, planData)
    const cards = functionImpacts(shocked, base, shocked)
    const finance = cards.find((c) => c.id === 'finance')!
    const supply = cards.find((c) => c.id === 'supply')!
    const commercial = cards.find((c) => c.id === 'commercial')!
    expect(finance.kpis.find((k) => k.id === 'ebitda2031')!.delta).toBeLessThan(0)
    expect(supply.kpis.find((k) => k.id === 'energyPerTon')!.delta).toBeGreaterThan(0)
    expect(commercial.kpis.find((k) => k.id === 'revenue2031')!.delta).toBeCloseTo(0, 6)
    expect(
      cards.find((c) => c.id === 'executive')!.initiatives.find((i) => i.id === 'pcc_plant')!
        .status,
    ).toBe('out')
  })

  it('lists decisions due from the tracked plan', () => {
    const tracked = runPlan(scenarioPresets.base, planData, { actuals: { year: 2027, L2: 140 } })
    const cards = functionImpacts(base, base, tracked)
    const exec = cards.find((c) => c.id === 'executive')!
    expect(exec.decisions.some((d) => d.id === 'pcc_plant')).toBe(true)
  })
})
