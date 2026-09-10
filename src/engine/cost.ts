import type { Assumptions, CostResult, Levers, Trace } from './types'
import { familyBlend } from './price'

/**
 * Pipeline step 4. Cost per ton per family:
 *   energy = baseEnergy * L2 / baseIndex, carbon = L6 * emissionsPerTon on lime only,
 *   other cost from assumptions. Export logistics reported per ton for the L5 level.
 * The base year entry is the actual cost structure and does not move with levers.
 */
export function computeCost(levers: Levers, a: Assumptions): CostResult {
  const n = a.planYears.length + 1
  const baseCost = familyBlend(a, (p) => p.baseCostPerTon)
  const baseEnergy = familyBlend(a, (p) => p.baseCostPerTon * p.energyShareOfCost)
  const energyFactor = levers.L2 / a.energy.baseIndex

  const limeCap = a.sites.reduce(
    (s, site) => s + (site.capacityKt.lime ?? 0) + (site.capacityKt.dololime ?? 0),
    0,
  )
  const emissionsPerTon =
    limeCap > 0
      ? a.sites.reduce(
          (s, site) =>
            s +
            ((site.capacityKt.lime ?? 0) + (site.capacityKt.dololime ?? 0)) *
              site.emissionsPerTonLime,
          0,
        ) / limeCap
      : 0
  const carbonCostPerTonLime = levers.L6 * emissionsPerTon

  const trace: Trace = {}
  const costPerTonByFamily: Record<string, number[]> = {}
  const energyCostPerTonByFamily: Record<string, number> = {}
  for (const fam of Object.keys(baseCost)) {
    const energy = baseEnergy[fam] * energyFactor
    const other = baseCost[fam] - baseEnergy[fam]
    const carbon = fam === 'lime' ? carbonCostPerTonLime : 0
    energyCostPerTonByFamily[fam] = energy
    // The base year is actual: levers move cost from the first plan year onward.
    costPerTonByFamily[fam] = [
      baseCost[fam],
      ...new Array<number>(n - 1).fill(other + energy + carbon),
    ]
    trace[`cost.${fam}`] = [
      { rule: 'cost.base', assumptionKey: `products.${fam}.baseCostPerTon`, value: baseCost[fam] },
      {
        rule: 'cost.energy',
        assumptionKey: `products.${fam}.energyShareOfCost`,
        value: baseEnergy[fam] / baseCost[fam],
      },
      { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      ...(fam === 'lime'
        ? [
            { rule: 'cost.carbon', assumptionKey: 'L6', leverId: 'L6' as const, value: levers.L6 },
            {
              rule: 'cost.carbon',
              assumptionKey: 'sites.emissionsPerTonLime',
              value: emissionsPerTon,
            },
          ]
        : []),
    ]
  }

  const logisticsKey = levers.L5 >= 2 ? 'extended' : levers.L5 === 1 ? 'gcc' : null
  const exportLogisticsPerTon = logisticsKey ? a.export.logisticsCostPerTon[logisticsKey] : 0
  trace['cost.exportLogistics'] = [
    { rule: 'cost.exportLogistics', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
    {
      rule: 'cost.exportLogistics',
      assumptionKey: `export.logisticsCostPerTon.${logisticsKey ?? 'none'}`,
      value: exportLogisticsPerTon,
    },
  ]

  return {
    costPerTonByFamily,
    energyCostPerTonByFamily,
    carbonCostPerTonLime,
    exportLogisticsPerTon,
    trace,
  }
}
