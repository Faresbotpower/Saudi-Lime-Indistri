import { computeDemand } from '../demand'
import { computeCapacity } from '../capacity'
import { computePrice } from '../price'
import { base, withL, assumptions, YEARS } from './fixtures'

const run = (levers = base(), terminal = false) => {
  const d = computeDemand(levers, assumptions, {
    selected: terminal ? ['gcc_export_sales', 'jeddah_export_terminal'] : ['gcc_export_sales'],
  })
  const c = computeCapacity(d, assumptions, [])
  return computePrice(levers, c, assumptions)
}

describe('price', () => {
  it('sets every family price index to exactly 1 in the base year', () => {
    const p = run()
    for (const fam of Object.keys(p.priceIndexByFamily))
      expect(p.priceIndexByFamily[fam][0]).toBeCloseTo(1, 9)
  })

  it('moves the index with utilization: 1 + coefficient * (utilization - base utilization)', () => {
    const d = computeDemand(base(), assumptions, { selected: ['gcc_export_sales'] })
    const c = computeCapacity(d, assumptions, [])
    const p = computePrice(base(), c, assumptions)
    const u = c.utilizationByFamily.lime
    const expected = 1 + 0.35 * (u[2] - u[0])
    expect(p.priceIndexByFamily.lime[2]).toBeCloseTo(Math.min(1.15, Math.max(0.9, expected)), 9)
  })

  it('clamps the index to the configured range', () => {
    const hi = run(withL({ L1: { option: 'accelerated', multiplier: 1.3 }, L5: 2 }), true)
    const lo = run(withL({ L1: { option: 'delayed', multiplier: 0.7 }, L5: 0 }))
    for (const fam of Object.keys(hi.priceIndexByFamily))
      for (let i = 0; i < YEARS.length; i++) {
        expect(hi.priceIndexByFamily[fam][i]).toBeLessThanOrEqual(1.15 + 1e-9)
        expect(lo.priceIndexByFamily[fam][i]).toBeGreaterThanOrEqual(0.9 - 1e-9)
      }
  })

  it('weights the family list price by product capacity, so lime blends quicklime and dololime', () => {
    const p = run()
    // lime family list price blends quicklime and dololime by capacity
    const cap = (k: string) => assumptions.sites.reduce((s, x) => s + (x.capacityKt[k] ?? 0), 0)
    const expected = (cap('lime') * 420 + cap('dololime') * 510) / (cap('lime') + cap('dololime'))
    expect(p.domesticPriceByFamily.lime[0]).toBeCloseTo(expected, 6)
    expect(p.domesticPriceByFamily.limestone[0]).toBeCloseTo(58, 6)
  })

  it('applies the index to the domestic price and keeps export at a fixed discount to the base-year price', () => {
    const p = run()
    expect(p.domesticPriceByFamily.lime[3]).toBeCloseTo(
      p.domesticPriceByFamily.lime[0] * p.priceIndexByFamily.lime[3],
      6,
    )
    for (let i = 0; i < YEARS.length; i++)
      expect(p.exportPrice[i]).toBeCloseTo(p.domesticPriceByFamily.lime[0] * (1 - 0.12), 6)
  })

  it('traces the index to the elasticity assumption and the L1 lever', () => {
    const p = run()
    const t = p.trace['price.lime']
    expect(t.some((e) => e.assumptionKey === 'priceElasticity.coefficient')).toBe(true)
    expect(t.some((e) => e.leverId === 'L1')).toBe(true)
  })
})
