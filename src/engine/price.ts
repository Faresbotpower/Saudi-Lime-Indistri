import type { Assumptions, CapacityResult, Levers, PriceResult, Trace } from './types'
import { zeros } from './years'

/** Capacity-weighted blend of a product attribute across products in each family. */
export function familyBlend(
  a: Assumptions,
  pick: (p: Assumptions['products'][number]) => number,
): Record<string, number> {
  const capOf = (productId: string) =>
    a.sites.reduce((s, site) => s + (site.capacityKt[productId] ?? 0), 0)
  const out: Record<string, number> = {}
  const families = [...new Set(a.products.map((p) => p.family))]
  for (const fam of families) {
    const members = a.products.filter((p) => p.family === fam)
    const totalCap = members.reduce((s, p) => s + capOf(p.id), 0)
    out[fam] =
      totalCap > 0
        ? members.reduce((s, p) => s + capOf(p.id) * pick(p), 0) / totalCap
        : members.reduce((s, p) => s + pick(p), 0) / members.length
  }
  return out
}

/**
 * Pipeline step 3. Domestic price index per family moves with utilization:
 *   priceIndex[y] = 1 + coefficient * (utilization[y] - baseUtilization), clamped.
 * Export price is a fixed discount to the base-year domestic lime price.
 */
export function computePrice(
  levers: Levers,
  capacity: CapacityResult,
  a: Assumptions,
): PriceResult {
  const n = capacity.years.length
  const { coefficient, clamp } = a.priceElasticity
  const listPrice = familyBlend(a, (p) => p.basePrice)
  const trace: Trace = {}

  const priceIndexByFamily: Record<string, number[]> = {}
  const domesticPriceByFamily: Record<string, number[]> = {}
  const baseUtilizationByFamily: Record<string, number> = {}
  for (const fam of Object.keys(capacity.utilizationByFamily)) {
    const u = capacity.utilizationByFamily[fam]
    const baseU = u[0]
    baseUtilizationByFamily[fam] = baseU
    const idx = zeros(n)
    const price = zeros(n)
    for (let i = 0; i < n; i++) {
      idx[i] = Math.min(clamp[1], Math.max(clamp[0], 1 + coefficient * (u[i] - baseU)))
      price[i] = listPrice[fam] * idx[i]
    }
    priceIndexByFamily[fam] = idx
    domesticPriceByFamily[fam] = price
    trace[`price.${fam}`] = [
      {
        rule: 'price.elasticity',
        assumptionKey: 'priceElasticity.coefficient',
        value: coefficient,
      },
      { rule: 'price.elasticity', assumptionKey: `utilization.${fam}.base`, value: baseU },
      { rule: 'price.elasticity', assumptionKey: 'L1', leverId: 'L1', value: levers.L1.multiplier },
      {
        rule: 'price.clamp',
        assumptionKey: 'priceElasticity.clamp',
        value: `${clamp[0]} to ${clamp[1]}`,
      },
      { rule: 'price.list', assumptionKey: `products.${fam}.basePrice`, value: listPrice[fam] },
    ]
  }

  const exportPrice = new Array<number>(n).fill(
    listPrice.lime * (1 - a.export.priceDiscountVsDomestic),
  )
  trace['price.export'] = [
    {
      rule: 'price.export',
      assumptionKey: 'export.priceDiscountVsDomestic',
      value: a.export.priceDiscountVsDomestic,
    },
    { rule: 'price.export', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
  ]

  return { priceIndexByFamily, domesticPriceByFamily, exportPrice, baseUtilizationByFamily, trace }
}
