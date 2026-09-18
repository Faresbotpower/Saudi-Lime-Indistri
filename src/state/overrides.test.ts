import { applyOverrides, readPath, overridePaths } from './overrides'
import { planData } from '../data'
import { runPlan } from '../engine'

describe('assumption overrides', () => {
  it('reads dotted paths, resolving array items by id', () => {
    expect(readPath(planData.assumptions, 'sectors.steel.growth')).toBe(0.045)
    expect(readPath(planData.assumptions, 'products.lime.basePrice')).toBe(420)
    expect(readPath(planData.assumptions, 'sites.riyadh.capacityKt.lime')).toBe(260)
    expect(readPath(planData.assumptions, 'export.potentialKt.1.2')).toBe(35)
    expect(readPath(planData.assumptions, 'baseCase.revenue')).toBe(300)
    expect(readPath(planData.assumptions, 'nothing.here')).toBeUndefined()
  })

  it('applies overrides on a deep copy and leaves the source untouched', () => {
    const merged = applyOverrides(planData, {
      'sectors.steel.growth': 0.06,
      'products.lime.basePrice': 450,
      'sites.jeddah.capacityKt.lime': 300,
    })
    expect(readPath(merged.assumptions, 'sectors.steel.growth')).toBe(0.06)
    expect(readPath(merged.assumptions, 'products.lime.basePrice')).toBe(450)
    expect(readPath(merged.assumptions, 'sites.jeddah.capacityKt.lime')).toBe(300)
    expect(readPath(planData.assumptions, 'sectors.steel.growth')).toBe(0.045)
    expect(merged.initiatives).toBe(planData.initiatives)
  })

  it('changes the plan when an underlying assumption changes', () => {
    const base = runPlan(planData.assumptions.scenarios.base, planData)
    const faster = runPlan(
      planData.assumptions.scenarios.base,
      applyOverrides(planData, { 'sectors.steel.growth': 0.08 }),
    )
    expect(faster.financials.revenue[5]).toBeGreaterThan(base.financials.revenue[5])
    const cheaper = runPlan(
      planData.assumptions.scenarios.base,
      applyOverrides(planData, { 'products.lime.baseCostPerTon': 200 }),
    )
    expect(cheaper.financials.ebitda[0]).toBeCloseTo(base.financials.ebitda[0], 6)
    expect(cheaper.financials.ebitda[5]).not.toBeCloseTo(base.financials.ebitda[5], 0)
  })

  it('ignores paths that do not exist instead of creating them', () => {
    const merged = applyOverrides(planData, { 'sectors.unknown.growth': 1 })
    expect(readPath(merged.assumptions, 'sectors.unknown.growth')).toBeUndefined()
    expect(overridePaths({ a: 1, b: 2 })).toEqual(['a', 'b'])
  })
})
