import { computeCost, mixCostPerGj, onGas } from '../cost'
import { base, withL, assumptions, YEARS } from './fixtures'

const e = assumptions.energy
const limeCap = (site: (typeof assumptions.sites)[number]) =>
  (site.capacityKt.lime ?? 0) + (site.capacityKt.dololime ?? 0)
const weighted = (f: (site: (typeof assumptions.sites)[number]) => number) => {
  const total = assumptions.sites.reduce((s, x) => s + limeCap(x), 0)
  return assumptions.sites.reduce((s, x) => s + (limeCap(x) / total) * f(x), 0)
}

describe('cost per ton with the fuel mix', () => {
  it('keeps the base year at the list cost regardless of L2 and L6', () => {
    const c = computeCost(withL({ L2: 160, L6: 120 }), assumptions)
    const lime = weighted(() => 0) + 0
    void lime
    expect(c.costPerTonByFamily.lime[0]).toBeCloseTo(
      computeCost(base(), assumptions).costPerTonByFamily.lime[0],
      9,
    )
    expect(c.costPerTonByFamily.limestone[0]).toBeCloseTo(41, 6)
  })

  it('prices 2026 lime energy from each site fuel mix and the fuel prices', () => {
    const c = computeCost(base(), assumptions)
    const expected = weighted((site) => e.gjPerTonLime * mixCostPerGj(site.id, assumptions))
    expect(c.energyCostPerTonLimeByYear[0]).toBeCloseTo(expected, 9)
    expect(mixCostPerGj('riyadh', assumptions)).toBeCloseTo(
      0.6 * e.fuels.diesel + 0.4 * e.fuels.crude,
      9,
    )
    expect(c.energyCostPerTonLimeOnGas).toBeCloseTo(e.gjPerTonLime * e.fuels.gas, 9)
  })

  it('switches each site to gas from its transition year, one year later when the index slips it', () => {
    const c = computeCost(base(), assumptions)
    expect(c.fuelBySite.riyadh).toEqual(['mix', 'gas', 'gas', 'gas', 'gas', 'gas'])
    expect(c.fuelBySite.jeddah).toEqual(['mix', 'mix', 'gas', 'gas', 'gas', 'gas'])
    const late = computeCost(withL({ L2: e.gasDelayIndex }), assumptions)
    expect(late.fuelBySite.riyadh).toEqual(['mix', 'mix', 'gas', 'gas', 'gas', 'gas'])
    expect(late.fuelBySite.jeddah).toEqual(['mix', 'mix', 'mix', 'gas', 'gas', 'gas'])
    expect(onGas('alkharj', 2027, 100, assumptions)).toBe(true)
    expect(onGas('alkharj', 2027, 140, assumptions)).toBe(false)
  })

  it('moves the gas price with L2 and leaves the 2026 mix price alone', () => {
    const at100 = computeCost(base(), assumptions)
    const at140 = computeCost(withL({ L2: 140 }), assumptions)
    // 2031: every site on gas in both cases, so the ratio is the index.
    expect(at140.energyCostPerTonLimeByYear[5] / at100.energyCostPerTonLimeByYear[5]).toBeCloseTo(
      1.4,
      9,
    )
    // 2027 at 140: the allocation slipped, so every site is still on its 2026 mix.
    expect(at140.energyCostPerTonLimeByYear[1]).toBeCloseTo(at100.energyCostPerTonLimeByYear[0], 9)
    // Non-kiln families still scale their energy share with the index.
    expect(at140.costPerTonByFamily.limestone[1]).toBeCloseTo(41 + 41 * 0.22 * 0.4, 6)
  })

  it('adds carbon cost on lime only, from L6 times process plus fuel emissions per ton', () => {
    const none = computeCost(base(), assumptions)
    const reg = computeCost(withL({ L6: 120 }), assumptions)
    for (let i = 1; i < YEARS.length; i++) {
      expect(reg.costPerTonByFamily.lime[i] - none.costPerTonByFamily.lime[i]).toBeCloseTo(
        120 * none.emissionsPerTonLimeByYear[i],
        6,
      )
      expect(reg.costPerTonByFamily.limestone[i]).toBeCloseTo(
        none.costPerTonByFamily.limestone[i],
        9,
      )
    }
    // On gas the fuel part of the intensity drops, so the carbon cost per ton falls after the switch.
    expect(none.emissionsPerTonLimeByYear[5]).toBeLessThan(none.emissionsPerTonLimeByYear[0])
    expect(reg.carbonCostPerTonLime).toBeCloseTo(120 * none.emissionsPerTonLimeByYear[5], 9)
  })

  it('reports export logistics cost per ton for the current L5 level', () => {
    expect(computeCost(withL({ L5: 0 }), assumptions).exportLogisticsPerTon).toBe(0)
    expect(computeCost(withL({ L5: 1 }), assumptions).exportLogisticsPerTon).toBe(65)
    expect(computeCost(withL({ L5: 2 }), assumptions).exportLogisticsPerTon).toBe(
      assumptions.export.logisticsCostPerTon.extended,
    )
  })

  it('traces lime cost to L2, L6, the fuel mix and the energy share check', () => {
    const c = computeCost(withL({ L6: 40 }), assumptions)
    const t = c.trace['cost.lime']
    expect(t.some((x) => x.leverId === 'L2')).toBe(true)
    expect(t.some((x) => x.leverId === 'L6')).toBe(true)
    expect(t.some((x) => x.assumptionKey === 'products.lime.energyShareOfCost')).toBe(true)
    expect(t.some((x) => x.assumptionKey === 'energy.siteFuelMix2026')).toBe(true)
  })
})
