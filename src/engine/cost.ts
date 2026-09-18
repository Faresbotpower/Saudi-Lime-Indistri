import type { Assumptions, CostResult, Fuel, Levers, Trace } from './types'
import type { YearOverride } from './demand'
import { familyBlend } from './price'

/** Whether a site burns gas in a plan year: at or after its transition year, one year later when the index slips it. */
export function onGas(site: string, year: number, index: number, a: Assumptions): boolean {
  const start =
    (a.energy.gasTransition[site] ?? Infinity) + (index >= a.energy.gasDelayIndex ? 1 : 0)
  return year >= start
}

/** SAR per GJ for a site's 2026 fuel mix. */
export function mixCostPerGj(site: string, a: Assumptions): number {
  const mix = a.energy.siteFuelMix2026[site] ?? {}
  return (Object.entries(mix) as [Fuel, number][]).reduce(
    (s, [f, share]) => s + share * a.energy.fuels[f],
    0,
  )
}

/** tCO2 per GJ for a site's 2026 fuel mix. */
export function mixCo2PerGj(site: string, a: Assumptions): number {
  const mix = a.energy.siteFuelMix2026[site] ?? {}
  return (Object.entries(mix) as [Fuel, number][]).reduce(
    (s, [f, share]) => s + share * a.energy.emissionFactors[f],
    0,
  )
}

const limeCapacity = (site: Assumptions['sites'][number]) =>
  (site.capacityKt.lime ?? 0) + (site.capacityKt.dololime ?? 0)

/**
 * Pipeline step 4. Cost per ton per family. Lime energy comes from the fuel mix per site per
 * year: diesel and crude in 2026, gas from each site's transition year, gas price scaled by
 * L2. Other families keep energyShareOfCost scaled by L2. Carbon = L6 times total emissions
 * per ton (process plus fuel) on lime only. Export logistics reported per ton for the L5 level.
 * The base year entry is the actual cost structure and does not move with levers.
 */
export function computeCost(
  levers: Levers,
  a: Assumptions,
  yearOverrides: Record<number, YearOverride> = {},
): CostResult {
  const years = [a.baseYear, ...a.planYears]
  const baseCost = familyBlend(a, (p) => p.baseCostPerTon)
  const baseEnergy = familyBlend(a, (p) => p.baseCostPerTon * p.energyShareOfCost)
  const energyFactor = levers.L2 / a.energy.baseIndex
  const gj = a.energy.gjPerTonLime
  const limeCap = a.sites.reduce((s, site) => s + limeCapacity(site), 0)
  const weight = (site: Assumptions['sites'][number]) =>
    limeCap > 0 ? limeCapacity(site) / limeCap : 0
  const bricksCap = a.sites.reduce((s, site) => s + (site.capacityKt.bricks ?? 0), 0)
  const bricksWeight = (site: Assumptions['sites'][number]) =>
    bricksCap > 0 ? (site.capacityKt.bricks ?? 0) / bricksCap : 0

  // Per site: fuel by year, energy cost per ton and emissions per ton.
  const fuelBySite: Record<string, ('mix' | 'gas')[]> = {}
  const energyCostPerTonLimeBySite: Record<string, number[]> = {}
  const emissionsBySite: Record<string, number[]> = {}
  for (const site of a.sites) {
    fuelBySite[site.id] = years.map((y, i) =>
      i > 0 && onGas(site.id, y, levers.L2, a) ? 'gas' : 'mix',
    )
    energyCostPerTonLimeBySite[site.id] = years.map((y, i) => {
      const gas = fuelBySite[site.id][i] === 'gas'
      const index = i === 0 ? a.energy.baseIndex : (yearOverrides[y]?.L2 ?? levers.L2)
      return (
        gj * (gas ? a.energy.fuels.gas * (index / a.energy.baseIndex) : mixCostPerGj(site.id, a))
      )
    })
    emissionsBySite[site.id] = years.map((_, i) => {
      const gas = fuelBySite[site.id][i] === 'gas'
      return (
        site.emissionsPerTonLime +
        gj * (gas ? a.energy.emissionFactors.gas : mixCo2PerGj(site.id, a))
      )
    })
  }
  const energyCostPerTonLimeByYear = years.map((_, i) =>
    a.sites.reduce((s, site) => s + weight(site) * energyCostPerTonLimeBySite[site.id][i], 0),
  )
  // Bricks kilns burn the same site fuel: energy per ton scales with the lime figure at the bricks site.
  const gjBricks = a.energy.gjPerTonBricks
  const energyCostPerTonBricksByYear = years.map((_, i) =>
    a.sites.reduce(
      (s, site) =>
        s + bricksWeight(site) * (energyCostPerTonLimeBySite[site.id][i] / gj) * (gjBricks ?? 0),
      0,
    ),
  )
  const emissionsPerTonLimeByYear = years.map((_, i) =>
    a.sites.reduce((s, site) => s + weight(site) * emissionsBySite[site.id][i], 0),
  )
  const energyCostPerTonLimeOnGas = gj * a.energy.fuels.gas
  const carbonCostPerTonLime = levers.L6 * emissionsPerTonLimeByYear[years.length - 1]
  const carbonByYear = years.map((y, i) =>
    i === 0 ? 0 : (yearOverrides[y]?.L6 ?? levers.L6) * emissionsPerTonLimeByYear[i],
  )

  const trace: Trace = {}
  const costPerTonByFamily: Record<string, number[]> = {}
  const energyCostPerTonByFamily: Record<string, number> = {}
  for (const fam of Object.keys(baseCost)) {
    if (fam === 'bricks' && gjBricks) {
      const other = Math.max(0, baseCost[fam] - energyCostPerTonBricksByYear[0])
      energyCostPerTonByFamily[fam] = energyCostPerTonBricksByYear[years.length - 1]
      costPerTonByFamily[fam] = years.map((_, i) =>
        i === 0 ? baseCost[fam] : other + energyCostPerTonBricksByYear[i],
      )
      trace[`cost.${fam}`] = [
        {
          rule: 'cost.base',
          assumptionKey: `products.${fam}.baseCostPerTon`,
          value: baseCost[fam],
        },
        { rule: 'cost.fuelMix', assumptionKey: 'energy.gjPerTonBricks', value: gjBricks },
        {
          rule: 'cost.gas',
          assumptionKey: 'energy.gasTransition',
          value: Math.round(energyCostPerTonBricksByYear[years.length - 1]),
        },
        { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      ]
      continue
    }
    if (fam === 'lime') {
      // Other cost is the list cost less the 2026 fuel-model energy; the energy share in the
      // data is kept as the calibration check written to the trace.
      const other = Math.max(0, baseCost[fam] - energyCostPerTonLimeByYear[0])
      energyCostPerTonByFamily[fam] = energyCostPerTonLimeByYear[years.length - 1]
      costPerTonByFamily[fam] = years.map((_, i) =>
        i === 0 ? baseCost[fam] : other + energyCostPerTonLimeByYear[i] + carbonByYear[i],
      )
      trace[`cost.${fam}`] = [
        {
          rule: 'cost.base',
          assumptionKey: `products.${fam}.baseCostPerTon`,
          value: baseCost[fam],
        },
        {
          rule: 'cost.energy',
          assumptionKey: `products.${fam}.energyShareOfCost`,
          value: `${baseEnergy[fam] / baseCost[fam]} in the data, ${(energyCostPerTonLimeByYear[0] / baseCost[fam]).toFixed(2)} from the 2026 fuel mix`,
        },
        {
          rule: 'cost.fuelMix',
          assumptionKey: 'energy.siteFuelMix2026',
          value: Math.round(energyCostPerTonLimeByYear[0]),
        },
        {
          rule: 'cost.gas',
          assumptionKey: 'energy.gasTransition',
          value: Math.round(energyCostPerTonLimeByYear[years.length - 1]),
        },
        { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
        { rule: 'cost.carbon', assumptionKey: 'L6', leverId: 'L6' as const, value: levers.L6 },
        {
          rule: 'cost.carbon',
          assumptionKey: 'sites.emissionsPerTonLime',
          value: emissionsPerTonLimeByYear[years.length - 1],
        },
      ]
      continue
    }
    const energy = baseEnergy[fam] * energyFactor
    const other = baseCost[fam] - baseEnergy[fam]
    energyCostPerTonByFamily[fam] = energy
    costPerTonByFamily[fam] = years.map((y, i) => {
      if (i === 0) return baseCost[fam]
      const o = yearOverrides[y]
      return other + baseEnergy[fam] * ((o?.L2 ?? levers.L2) / a.energy.baseIndex)
    })
    trace[`cost.${fam}`] = [
      { rule: 'cost.base', assumptionKey: `products.${fam}.baseCostPerTon`, value: baseCost[fam] },
      {
        rule: 'cost.energy',
        assumptionKey: `products.${fam}.energyShareOfCost`,
        value: baseEnergy[fam] / baseCost[fam],
      },
      { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
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
    ...(a.logistics
      ? [
          {
            rule: 'cost.logisticsModel',
            assumptionKey: 'logistics.model',
            value: a.logistics.model,
          },
        ]
      : []),
  ]

  return {
    energyCostPerTonLimeByYear,
    energyCostPerTonLimeBySite,
    fuelBySite,
    emissionsPerTonLimeByYear,
    energyCostPerTonLimeOnGas,
    costPerTonByFamily,
    energyCostPerTonByFamily,
    carbonCostPerTonLime,
    carbonByYear,
    exportLogisticsPerTon,
    trace,
  }
}
