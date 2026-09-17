import { computeCost } from '../cost'
import { base, withL, assumptions, YEARS } from './fixtures'

describe('cost per ton', () => {
  it('reproduces the blended base cost per ton in the base year at energy index 100 and no carbon', () => {
    const c = computeCost(base(), assumptions)
    const lime = (1140 * 262 + 90 * 318) / 1230
    for (let i = 0; i < YEARS.length; i++) expect(c.costPerTonByFamily.lime[i]).toBeCloseTo(lime, 6)
    expect(c.costPerTonByFamily.limestone[0]).toBeCloseTo(41, 6)
  })

  it('keeps the base year at actual cost regardless of L2 and L6', () => {
    const c = computeCost(withL({ L2: 160, L6: 120 }), assumptions)
    const lime = (1140 * 262 + 90 * 318) / 1230
    expect(c.costPerTonByFamily.lime[0]).toBeCloseTo(lime, 6)
    expect(c.costPerTonByFamily.limestone[0]).toBeCloseTo(41, 6)
  })

  it('scales only the energy share of cost with L2', () => {
    const c = computeCost(withL({ L2: 160 }), assumptions)
    const baseLime = (1140 * 262 + 90 * 318) / 1230
    const energyLime = (1140 * 262 * 0.48 + 90 * 318 * 0.5) / 1230
    expect(c.costPerTonByFamily.lime[1]).toBeCloseTo(baseLime + energyLime * 0.6, 6)
    expect(c.costPerTonByFamily.limestone[1]).toBeCloseTo(41 + 41 * 0.22 * 0.6, 6)
    expect(c.energyCostPerTonByFamily.lime).toBeCloseTo(energyLime * 1.6, 6)
  })

  it('adds carbon cost on lime only, from L6 times capacity-weighted emissions per ton', () => {
    const none = computeCost(base(), assumptions)
    const reg = computeCost(withL({ L6: 120 }), assumptions)
    const emissions = (520 * 0.78 + 470 * 0.81 + 240 * 0.84) / 1230
    expect(reg.carbonCostPerTonLime).toBeCloseTo(120 * emissions, 6)
    for (let i = 1; i < YEARS.length; i++) {
      expect(reg.costPerTonByFamily.lime[i] - none.costPerTonByFamily.lime[i]).toBeCloseTo(
        120 * emissions,
        6,
      )
      expect(reg.costPerTonByFamily.limestone[i]).toBeCloseTo(
        none.costPerTonByFamily.limestone[i],
        9,
      )
      expect(reg.costPerTonByFamily.carbonate[i]).toBeCloseTo(
        none.costPerTonByFamily.carbonate[i],
        9,
      )
    }
  })

  it('reports export logistics cost per ton for the current L5 level', () => {
    expect(computeCost(withL({ L5: 0 }), assumptions).exportLogisticsPerTon).toBe(0)
    expect(computeCost(withL({ L5: 1 }), assumptions).exportLogisticsPerTon).toBe(65)
    expect(computeCost(withL({ L5: 2 }), assumptions).exportLogisticsPerTon).toBe(
      assumptions.export.logisticsCostPerTon.extended,
    )
  })

  it('traces lime cost to L2, L6 and the energy share assumption', () => {
    const c = computeCost(withL({ L6: 40 }), assumptions)
    const t = c.trace['cost.lime']
    expect(t.some((e) => e.leverId === 'L2')).toBe(true)
    expect(t.some((e) => e.leverId === 'L6')).toBe(true)
    expect(t.some((e) => e.assumptionKey === 'products.lime.energyShareOfCost')).toBe(true)
  })
})
