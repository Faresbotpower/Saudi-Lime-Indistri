import { runCore } from '../core'
import { runPlan } from '../index'
import { base, withL, data, YEARS } from './fixtures'

const GCC = { selected: ['gcc_export_sales'] }

describe('year overrides in the core (tracker actuals)', () => {
  it('applies an energy actual to the tracked year only', () => {
    const plan = runCore(base(), data, [], GCC)
    const tracked = runCore(base(), data, [], { ...GCC, yearOverrides: { 2027: { L2: 140 } } })
    expect(tracked.baseBusiness.cost[1]).toBeGreaterThan(plan.baseBusiness.cost[1])
    for (const i of [0, 2, 3, 4, 5])
      expect(tracked.baseBusiness.cost[i]).toBeCloseTo(plan.baseBusiness.cost[i], 9)
    expect(tracked.baseBusiness.revenue).toEqual(plan.baseBusiness.revenue)
  })

  it('applies a carbon actual to the tracked year only, on lime', () => {
    const plan = runCore(base(), data, [], GCC)
    const tracked = runCore(base(), data, [], { ...GCC, yearOverrides: { 2027: { L6: 120 } } })
    expect(tracked.cost.costPerTonByFamily.lime[1]).toBeGreaterThan(
      plan.cost.costPerTonByFamily.lime[1],
    )
    expect(tracked.cost.costPerTonByFamily.lime[2]).toBeCloseTo(
      plan.cost.costPerTonByFamily.lime[2],
      9,
    )
    expect(tracked.cost.costPerTonByFamily.limestone[1]).toBeCloseTo(
      plan.cost.costPerTonByFamily.limestone[1],
      9,
    )
  })

  it('a demand actual lowers the tracked year and the years after resume plan growth from the lower base', () => {
    const plan = runCore(base(), data, [], GCC)
    const tracked = runCore(base(), data, [], {
      ...GCC,
      yearOverrides: { 2027: { L1multiplier: 0.8 } },
    })
    const s = 'steel'
    expect(tracked.demand.bySector[s][1]).toBeLessThan(plan.demand.bySector[s][1])
    for (let i = 2; i < YEARS.length; i++) {
      const planRatio = plan.demand.bySector[s][i] / plan.demand.bySector[s][i - 1]
      const trackedRatio = tracked.demand.bySector[s][i] / tracked.demand.bySector[s][i - 1]
      expect(trackedRatio).toBeCloseTo(planRatio, 9)
    }
  })

  it('reproduces the closed-form demand exactly when no override is given', () => {
    const d = runCore(base(), data, [], GCC).demand
    const steel = data.assumptions.sectors.find((s) => s.id === 'steel')!.baseVolumeKt
    expect(d.bySector.steel[5]).toBeCloseTo(steel * Math.pow(1.045, 5) * (1 + (1.09 - 1) * 0.3), 6)
  })
})

describe('runPlan with actuals', () => {
  it('keeps the scenario name, moves the tracked year, and re-decides the portfolio on the actual lever values', () => {
    const plan = runPlan(base(), data)
    const tracked = runPlan(base(), data, { actuals: { year: 2027, L2: 140 } })
    expect(tracked.scenarioName).toBe('base')
    expect(tracked.financials.ebitda[1]).toBeLessThan(plan.financials.ebitda[1])
    // Bricks exit on a dear-gas actual, so revenue moves with the re-decided portfolio.
    expect(tracked.initiatives.find((i) => i.id === 'bricks_choice')!.status).toBe('in')
    const pcc = (r: typeof plan) => r.initiatives.find((i) => i.id === 'pcc_plant')!.status
    expect(pcc(plan)).toBe('deferred')
    expect(pcc(tracked)).toBe('out')
    expect(tracked.actuals).toEqual({ year: 2027, L2: 140 })
  })

  it('lists the triggers fired: initiatives whose status changes against the plan', () => {
    const tracked = runPlan(base(), data, { actuals: { year: 2027, L2: 140 } })
    const fired = tracked.triggersFired
    expect(fired.some((t) => t.id === 'pcc_plant' && t.from === 'deferred' && t.to === 'out')).toBe(
      true,
    )
    for (const t of fired) expect(t.from).not.toBe(t.to)
    expect(runPlan(base(), data, { actuals: { year: 2027 } }).triggersFired).toEqual([])
  })

  it('leaves the plan untouched with no actuals', () => {
    const a = runPlan(base(), data)
    const b = runPlan(withL({ L2: 100 }), data, {})
    expect(b.financials.ebitda).toEqual(a.financials.ebitda)
    expect(b.triggersFired).toEqual([])
  })
})
