import type { CoreResult, Levers, PlanData, Trace } from './types'
import type { PortfolioResult } from './portfolio'
import { mixCo2PerGj } from './cost'

export type EmissionsResult = {
  /** tCO2 per ton of lime by year, base year first, after the initiatives in plan. */
  intensity: number[]
  /** Total lime emissions, kt CO2 by year. */
  totalKt: number[]
  /** Fuel share of intensity by year. */
  fuelShare: number[]
  baseline: { year: number; totalKtCo2: number; intensity: number }
  /** Carbon cost exposure, SAR m by year, at the current L6. */
  carbonCostSarm: number[]
  /** The decarbonization roadmap: what moves the path and when. */
  roadmap: {
    id: string
    label: string
    year?: number
    status: 'in' | 'deferred' | 'out' | 'planned'
    effect: string
  }[]
  trace: Trace
}

/**
 * Emissions path of the lime business: process emissions per site plus fuel emissions from the
 * mix, reduced by the initiatives in plan (kiln efficiency and replacement cut GJ per ton at
 * their site, electrification trims fuel CO2, the capture pilot removes tons).
 */
export function computeEmissions(
  levers: Levers,
  data: PlanData,
  portfolio: PortfolioResult,
  core: CoreResult,
): EmissionsResult {
  const a = data.assumptions
  const years = core.years
  const n = years.length
  const gj = a.energy.gjPerTonLime
  const list = data.initiatives.initiatives
  const status = portfolio.entries
  const inPlan = (id: string) => status[id]?.status === 'in'
  const startOf = (id: string) => status[id]?.startYear ?? Infinity
  const rampShare = (id: string, y: number) => {
    const init = list.find((i) => i.id === id)!
    const s = startOf(id)
    if (y < s) return 0
    return Math.min(1, (y - s + 1) / Math.max(1, init.rampYears))
  }
  const limeCap = (site: (typeof a.sites)[number]) =>
    (site.capacityKt.lime ?? 0) + (site.capacityKt.dololime ?? 0)
  const capTotal = a.sites.reduce((s, x) => s + limeCap(x), 0)

  const intensity = years.map(() => 0)
  const fuelShare = years.map(() => 0)
  for (let i = 0; i < n; i++) {
    let process = 0
    let fuel = 0
    for (const site of a.sites) {
      const w = capTotal > 0 ? limeCap(site) / capTotal : 0
      let gjHere = gj
      let fuelCut = 0
      if (i > 0)
        for (const init of list) {
          if (!init.emissions || !inPlan(init.id)) continue
          const share = rampShare(init.id, years[i])
          if (
            init.emissions.gjReduction &&
            (!init.emissions.site || init.emissions.site === site.id)
          )
            gjHere *= 1 - init.emissions.gjReduction * share
          if (init.emissions.fuelCo2ReductionShare)
            fuelCut += init.emissions.fuelCo2ReductionShare * share
        }
      const perGj =
        core.cost.fuelBySite[site.id][i] === 'gas'
          ? a.energy.emissionFactors.gas
          : mixCo2PerGj(site.id, a)
      process += w * site.emissionsPerTonLime
      fuel += w * gjHere * perGj * (1 - fuelCut)
    }
    intensity[i] = process + fuel
    fuelShare[i] = intensity[i] > 0 ? fuel / intensity[i] : 0
  }

  const limeTons = years.map((_, i) => core.capacity.servedByFamily.lime?.[i] ?? 0)
  const captured = years.map((y, i) =>
    i === 0
      ? 0
      : list
          .filter((init) => init.emissions?.co2CapturedKt && inPlan(init.id))
          .reduce((s, init) => s + init.emissions!.co2CapturedKt! * rampShare(init.id, y), 0),
  )
  // Intensity in tons per ton times kt of lime gives kt of CO2.
  const totalKt = years.map((_, i) => Math.max(0, intensity[i] * limeTons[i] - captured[i]))
  const carbonCostSarm = years.map((_, i) =>
    i === 0 ? 0 : (levers.L6 * intensity[i] * limeTons[i]) / 1000,
  )
  const baseline = {
    year: a.energy.ghgBaseline.year,
    totalKtCo2: a.energy.ghgBaseline.totalKtCo2,
    intensity: intensity[0],
  }

  const statusOf = (id: string) => status[id]?.status ?? 'out'
  const roadmap: EmissionsResult['roadmap'] = [
    ...a.sites.map((site) => {
      const y = core.cost.fuelBySite[site.id].findIndex((f) => f === 'gas')
      return {
        id: `gas-${site.id}`,
        label: `Gas at ${site.name}`,
        year: y > 0 ? years[y] : undefined,
        status: 'planned' as const,
        effect: `Fuel CO2 per GJ from ${mixCo2PerGj(site.id, a).toFixed(3)} to ${a.energy.emissionFactors.gas.toFixed(3)} tCO2`,
      }
    }),
    ...list
      .filter((i) => i.emissions)
      .map((i) => ({
        id: i.id,
        label: i.name,
        year: status[i.id]?.startYear,
        status: statusOf(i.id),
        effect: i.emissions!.gjReduction
          ? `GJ per ton down ${Math.round(i.emissions!.gjReduction * 100)}%${i.emissions!.site ? ` at ${a.sites.find((s) => s.id === i.emissions!.site)?.name ?? i.emissions!.site}` : ''}`
          : i.emissions!.co2CapturedKt
            ? `${i.emissions!.co2CapturedKt} kt CO2 captured a year`
            : `Fuel CO2 down ${Math.round((i.emissions!.fuelCo2ReductionShare ?? 0) * 100)}%`,
      })),
  ]

  const trace: Trace = {
    emissions: [
      {
        rule: 'emissions.baseline',
        assumptionKey: 'energy.ghgBaseline',
        value: baseline.totalKtCo2,
      },
      {
        rule: 'emissions.process',
        assumptionKey: 'sites.emissionsPerTonLime',
        value: Math.round(intensity[0] * (1 - fuelShare[0]) * 1000) / 1000,
      },
      {
        rule: 'emissions.fuel',
        assumptionKey: 'energy.emissionFactors',
        value: Math.round(intensity[0] * fuelShare[0] * 1000) / 1000,
      },
      {
        rule: 'emissions.gas',
        assumptionKey: 'energy.gasTransition',
        value: Math.round(intensity[n - 1] * 1000) / 1000,
      },
      { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'cost.carbon', assumptionKey: 'L6', leverId: 'L6', value: levers.L6 },
    ],
  }
  return { intensity, totalKt, fuelShare, baseline, carbonCostSarm, roadmap, trace }
}
