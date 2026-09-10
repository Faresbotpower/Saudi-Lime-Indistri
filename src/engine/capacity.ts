import type {
  Assumptions,
  CapacityAddition,
  CapacityResult,
  DemandResult,
  Trace,
  TraceEntry,
} from './types'
import { zeros } from './years'

/** Linear ramp share of an addition in a given year: 0 before start, 1 once fully ramped. */
export const rampShare = (year: number, startYear: number, rampYears: number): number => {
  if (year < startYear) return 0
  return Math.min(1, (year - startYear + 1) / Math.max(1, rampYears))
}

/**
 * Water-filling allocation: split `total` across buckets in proportion to `weights`,
 * never exceeding each bucket's `cap`, redistributing overflow to buckets with room.
 */
export function allocate(total: number, weights: number[], caps: number[]): number[] {
  const n = weights.length
  const out = zeros(n)
  let remaining = total
  let open = weights.map((_, i) => i)
  for (let guard = 0; guard < n + 1 && remaining > 1e-9 && open.length > 0; guard++) {
    const wsum = open.reduce((s, i) => s + weights[i], 0)
    const share =
      wsum > 0
        ? open.map((i) => (remaining * weights[i]) / wsum)
        : open.map(() => remaining / open.length)
    const nextOpen: number[] = []
    let placed = 0
    open.forEach((i, k) => {
      const room = caps[i] - out[i]
      const take = Math.min(room, share[k])
      out[i] += take
      placed += take
      if (out[i] < caps[i] - 1e-9) nextOpen.push(i)
    })
    remaining -= placed
    open = nextOpen
  }
  return out
}

/**
 * Pipeline step 2. Capacity by family and site, initiative additions with ramps,
 * served volume = min(demand, capacity), utilization by family, site and region.
 * Sales demand is calibrated so the base year reproduces each site's base utilization.
 */
export function computeCapacity(
  demand: DemandResult,
  a: Assumptions,
  additions: CapacityAddition[],
): CapacityResult {
  const years = demand.years
  const n = years.length
  const familyOf = Object.fromEntries(a.products.map((p) => [p.id, p.family]))
  const families = [...new Set(a.products.map((p) => p.family))]
  const trace: Trace = {}

  // Site capacity by family, per year (base plus ramped additions).
  const capacityBySite: Record<string, Record<string, number[]>> = {}
  for (const site of a.sites) {
    capacityBySite[site.id] = {}
    for (const fam of families) {
      const baseKt = Object.entries(site.capacityKt).reduce(
        (s, [p, kt]) => s + (familyOf[p] === fam ? kt : 0),
        0,
      )
      capacityBySite[site.id][fam] = new Array<number>(n).fill(baseKt)
    }
  }
  for (const add of additions) {
    const fam = familyOf[add.product]
    if (!fam) continue
    const siteId = add.site ?? largestSiteFor(fam, capacityBySite)
    if (!capacityBySite[siteId]) continue
    for (let i = 0; i < n; i++)
      capacityBySite[siteId][fam][i] += add.kt * rampShare(years[i], add.startYear, add.rampYears)
  }

  const capacityByFamily: Record<string, number[]> = {}
  for (const fam of families) {
    capacityByFamily[fam] = zeros(n)
    for (const site of a.sites)
      for (let i = 0; i < n; i++) capacityByFamily[fam][i] += capacityBySite[site.id][fam][i]
    const entries: TraceEntry[] = a.sites.map((s) => ({
      rule: 'capacity.sum',
      assumptionKey: `sites.${s.id}.capacityKt`,
      value: capacityBySite[s.id][fam][0],
    }))
    for (const add of additions)
      if (familyOf[add.product] === fam)
        entries.push({
          rule: 'capacity.addition',
          assumptionKey: `initiatives.${add.initiativeId}.capacityAddKt`,
          value: add.kt,
        })
    trace[`capacity.${fam}`] = entries
  }

  // Calibrate sales demand so 2026 served volume equals capacity-weighted base utilization.
  const demandCalibration: Record<string, number> = {}
  for (const fam of families) {
    const target = a.sites.reduce(
      (s, site) => s + capacityBySite[site.id][fam][0] * site.baseUtilization,
      0,
    )
    const raw = demand.domesticByFamily[fam]?.[0] ?? 0
    demandCalibration[fam] = raw > 0 ? target / raw : 1
    trace[`capacity.calibration.${fam}`] = [
      { rule: 'capacity.calibration', assumptionKey: `baseCase.utilization.${fam}`, value: target },
      { rule: 'capacity.calibration', assumptionKey: `demand.${fam}.2026`, value: raw },
      {
        rule: 'capacity.calibration',
        assumptionKey: `calibration.demand.${fam}`,
        value: demandCalibration[fam],
      },
    ]
  }

  const servedByFamily: Record<string, number[]> = {}
  const utilizationByFamily: Record<string, number[]> = {}
  const exportServed = zeros(n)
  const servedBySite: Record<string, Record<string, number[]>> = {}
  for (const site of a.sites)
    servedBySite[site.id] = Object.fromEntries(families.map((f) => [f, zeros(n)]))

  const jeddahIndex = a.sites.findIndex((s) => s.id === 'jeddah')

  for (const fam of families) {
    servedByFamily[fam] = zeros(n)
    utilizationByFamily[fam] = zeros(n)
    for (let i = 0; i < n; i++) {
      const domestic = (demand.domesticByFamily[fam]?.[i] ?? 0) * demandCalibration[fam]
      const exp = fam === 'lime' ? demand.exportKt[i] : 0
      const total = domestic + exp
      const cap = capacityByFamily[fam][i]
      const served = Math.min(total, cap)
      const ratio = total > 0 ? served / total : 0
      servedByFamily[fam][i] = served
      utilizationByFamily[fam][i] = cap > 0 ? served / cap : 0
      if (fam === 'lime') exportServed[i] = exp * ratio

      // Domestic first, pro-rata to capacity times base utilization, capped at site capacity.
      const caps = a.sites.map((s) => capacityBySite[s.id][fam][i])
      const weights = a.sites.map((s, k) => caps[k] * s.baseUtilization)
      const dom = allocate(domestic * ratio, weights, caps)
      // Export next: Jeddah takes what it can, the rest goes pro-rata to remaining spare capacity.
      const spare = caps.map((c, k) => Math.max(0, c - dom[k]))
      const expAlloc = zeros(caps.length)
      let expLeft = exp * ratio
      if (jeddahIndex >= 0 && expLeft > 0) {
        const take = Math.min(spare[jeddahIndex], expLeft)
        expAlloc[jeddahIndex] = take
        expLeft -= take
        spare[jeddahIndex] -= take
      }
      if (expLeft > 1e-9) {
        const rest = allocate(expLeft, spare, spare)
        for (let k = 0; k < rest.length; k++) expAlloc[k] += rest[k]
      }
      a.sites.forEach((s, k) => (servedBySite[s.id][fam][i] = dom[k] + expAlloc[k]))
    }
  }

  const utilizationBySite: Record<string, number[]> = {}
  for (const site of a.sites) {
    utilizationBySite[site.id] = zeros(n)
    for (let i = 0; i < n; i++) {
      const cap = families.reduce((s, f) => s + capacityBySite[site.id][f][i], 0)
      const served = families.reduce((s, f) => s + servedBySite[site.id][f][i], 0)
      utilizationBySite[site.id][i] = cap > 0 ? served / cap : 0
    }
  }

  const regions = [...new Set(a.sites.map((s) => s.region.toLowerCase()))]
  const utilizationByRegionFamily: Record<string, Record<string, number[]>> = {}
  for (const region of regions) {
    utilizationByRegionFamily[region] = {}
    const sites = a.sites.filter((s) => s.region.toLowerCase() === region)
    for (const fam of families) {
      const series = zeros(n)
      for (let i = 0; i < n; i++) {
        const cap = sites.reduce((s, site) => s + capacityBySite[site.id][fam][i], 0)
        const served = sites.reduce((s, site) => s + servedBySite[site.id][fam][i], 0)
        series[i] = cap > 0 ? served / cap : 0
      }
      utilizationByRegionFamily[region][fam] = series
    }
  }

  return {
    years,
    capacityByFamily,
    capacityBySite,
    servedByFamily,
    exportServed,
    utilizationByFamily,
    utilizationBySite,
    utilizationByRegionFamily,
    demandCalibration,
    trace,
  }
}

function largestSiteFor(
  fam: string,
  capacityBySite: Record<string, Record<string, number[]>>,
): string {
  let best = ''
  let bestKt = -1
  for (const [id, fams] of Object.entries(capacityBySite)) {
    const kt = fams[fam]?.[0] ?? 0
    if (kt > bestKt) {
      best = id
      bestKt = kt
    }
  }
  return best
}
