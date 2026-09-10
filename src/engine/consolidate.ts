import { runCore } from './core'
import type { PortfolioResult } from './portfolio'
import type { Initiative, Levers, PlanData, Trace } from './types'
import { yearsOf, zeros } from './years'

export type SiteResult = {
  id: string
  name: string
  capacity: number[]
  utilization: number[]
  capex: number[]
}

export type Consolidated = {
  years: number[]
  financials: {
    revenue: number[]
    ebitda: number[]
    ebitdaMargin: number[]
    capex: number[]
    workingCapital: number[]
    fcf: number[]
    cumulativeFcf: number[]
  }
  split: {
    baseRevenue: number[]
    initiativeRevenue: number[]
    baseEbitda: number[]
    initiativeEbitda: number[]
    baseCapex: number[]
    initiativeCapex: number[]
  }
  people: { headcount: number[]; saudization: number[]; costPerTon: number[] }
  sites: SiteResult[]
  core: ReturnType<typeof runCore>
  trace: Trace
}

/**
 * Volume-modelled initiatives are those the core already prices through tonnage:
 * capacity additions and the initiatives that unlock export levels. Their P&L impact is
 * the difference the core produces, not their run rate, so nothing is counted twice.
 */
export function isVolumeInitiative(init: Initiative, data: PlanData): boolean {
  if (init.capacityAddKt && Object.keys(init.capacityAddKt).length > 0) return true
  return Object.values(data.assumptions.export.requiresInitiative).includes(init.id)
}

/**
 * Pipeline step 7. Base business (core with selected additions and export unlocks) plus
 * run-rate impacts of non-volume initiatives. Capex = maintenance capex plus phased
 * initiative capex. Working capital = a fixed share of the revenue delta. FCF = EBITDA
 * minus capex minus working capital. Headcount follows tonnage plus non-volume deltas.
 */
export function consolidate(
  levers: Levers,
  data: PlanData,
  portfolio: PortfolioResult,
): Consolidated {
  const a = data.assumptions
  const years = yearsOf(a)
  const n = years.length
  const list = data.initiatives.initiatives
  const byId = Object.fromEntries(list.map((i) => [i.id, i]))

  const core = runCore(levers, data, portfolio.additions, { selected: portfolio.selectedIds })
  const coreBase = runCore(levers, data, [], { selected: [] })

  const runRateIds = portfolio.selectedIds.filter((id) => !isVolumeInitiative(byId[id], data))
  const volumeIds = portfolio.selectedIds.filter((id) => isVolumeInitiative(byId[id], data))

  const f = {
    revenue: zeros(n),
    ebitda: zeros(n),
    ebitdaMargin: zeros(n),
    capex: zeros(n),
    workingCapital: zeros(n),
    fcf: zeros(n),
    cumulativeFcf: zeros(n),
  }
  const split = {
    baseRevenue: zeros(n),
    initiativeRevenue: zeros(n),
    baseEbitda: zeros(n),
    initiativeEbitda: zeros(n),
    baseCapex: zeros(n),
    initiativeCapex: zeros(n),
  }

  for (let i = 0; i < n; i++) {
    let rr = 0
    let re = 0
    for (const id of runRateIds) {
      rr += portfolio.economics[id].revenue[i]
      re += portfolio.economics[id].ebitda[i]
    }
    const volumeRev = core.baseBusiness.revenue[i] - coreBase.baseBusiness.revenue[i]
    const volumeEbitda = core.baseBusiness.ebitda[i] - coreBase.baseBusiness.ebitda[i]
    split.baseRevenue[i] = coreBase.baseBusiness.revenue[i]
    split.baseEbitda[i] = coreBase.baseBusiness.ebitda[i]
    split.initiativeRevenue[i] = rr + volumeRev
    split.initiativeEbitda[i] = re + volumeEbitda
    f.revenue[i] = split.baseRevenue[i] + split.initiativeRevenue[i]
    f.ebitda[i] = split.baseEbitda[i] + split.initiativeEbitda[i]
    f.ebitdaMargin[i] = f.revenue[i] > 0 ? f.ebitda[i] / f.revenue[i] : 0
    split.baseCapex[i] = a.baseCase.capex
    split.initiativeCapex[i] = i === 0 ? 0 : portfolio.impacts.capex[i]
    f.capex[i] = split.baseCapex[i] + split.initiativeCapex[i]
  }
  for (let i = 1; i < n; i++) {
    f.workingCapital[i] = a.workingCapitalPctOfRevenueDelta * (f.revenue[i] - f.revenue[i - 1])
    f.fcf[i] = f.ebitda[i] - f.capex[i] - f.workingCapital[i]
    f.cumulativeFcf[i] = f.cumulativeFcf[i - 1] + f.fcf[i]
  }
  f.fcf[0] = f.ebitda[0] - f.capex[0]

  // People. Headcount follows lime and limestone tonnage from the base, plus run-rate initiative deltas.
  const people = { headcount: zeros(n), saudization: zeros(n), costPerTon: zeros(n) }
  const served = core.capacity.servedByFamily
  for (let i = 0; i < n; i++) {
    const limeDelta = (served.lime?.[i] ?? 0) - (served.lime?.[0] ?? 0)
    const limestoneDelta = (served.limestone?.[i] ?? 0) - (served.limestone?.[0] ?? 0)
    let hc =
      a.people.baseHeadcount +
      limeDelta * a.people.headcountPerKtLime +
      limestoneDelta * a.people.headcountPerKtLimestone
    for (const id of runRateIds) hc += portfolio.economics[id].headcount[i]
    people.headcount[i] = hc
  }
  // Cost per ton: the 2026 all-in actual, moved by the model's cost-per-ton index.
  const cpt = (i: number) =>
    core.baseBusiness.volumeKt[i] > 0
      ? core.baseBusiness.cost[i] / core.baseBusiness.volumeKt[i]
      : 0
  const cpt0 = cpt(0)
  for (let i = 0; i < n; i++)
    people.costPerTon[i] = a.people.baseCostPerTonAllIn * (cpt0 > 0 ? cpt(i) / cpt0 : 1)
  const workforce = list.find(
    (x) => x.saudizationTarget !== undefined && portfolio.entries[x.id]?.status === 'in',
  )
  for (let i = 0; i < n; i++) {
    let s = a.people.baseSaudization
    if (workforce) {
      const start = portfolio.entries[workforce.id].startYear ?? workforce.startYearEarliest
      const share = Math.min(
        1,
        Math.max(0, (years[i] - start + 1) / Math.max(1, workforce.rampYears)),
      )
      s =
        a.people.baseSaudization + (workforce.saudizationTarget! - a.people.baseSaudization) * share
    }
    people.saudization[i] = s
  }

  // Sites: capacity, utilization from the core, capex = initiative capex at the site plus maintenance pro-rata.
  const sites: SiteResult[] = a.sites.map((site) => {
    const capacity = zeros(n)
    for (const fam of Object.keys(core.capacity.capacityBySite[site.id]))
      for (let i = 0; i < n; i++) capacity[i] += core.capacity.capacityBySite[site.id][fam][i]
    return {
      id: site.id,
      name: site.name,
      capacity,
      utilization: core.capacity.utilizationBySite[site.id],
      capex: zeros(n),
    }
  })
  const totalCap = sites.map((s) => s.capacity[0]).reduce((x, y) => x + y, 0)
  let unsited = zeros(n)
  for (const id of portfolio.selectedIds) {
    const init = byId[id]
    const target = sites.find((s) => s.id === init.site)
    for (let i = 1; i < n; i++) {
      if (target) target.capex[i] += portfolio.economics[id].capex[i]
      else unsited[i] += portfolio.economics[id].capex[i]
    }
  }
  for (const s of sites) {
    const share = totalCap > 0 ? s.capacity[0] / totalCap : 1 / sites.length
    for (let i = 0; i < n; i++) s.capex[i] += share * (a.baseCase.capex + unsited[i])
  }
  unsited = zeros(n)

  const trace: Trace = {
    ...core.trace,
    ...portfolio.trace,
    'financials.revenue': [
      {
        rule: 'consolidate.revenue',
        assumptionKey: 'baseBusiness.revenue',
        value: Math.round(split.baseRevenue[n - 1]),
      },
      {
        rule: 'consolidate.revenue',
        assumptionKey: 'initiatives.runRate.revenue',
        value: runRateIds.join(', ') || 'none',
      },
      {
        rule: 'consolidate.revenue',
        assumptionKey: 'initiatives.volume.revenue',
        value: volumeIds.join(', ') || 'none',
      },
      {
        rule: 'consolidate.revenue',
        assumptionKey: 'L1',
        leverId: 'L1',
        value: levers.L1.multiplier,
      },
      { rule: 'consolidate.revenue', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
    ],
    'financials.ebitda': [
      {
        rule: 'consolidate.ebitda',
        assumptionKey: 'baseBusiness.ebitda',
        value: Math.round(split.baseEbitda[n - 1]),
      },
      { rule: 'consolidate.ebitda', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'consolidate.ebitda', assumptionKey: 'L6', leverId: 'L6', value: levers.L6 },
      {
        rule: 'consolidate.ebitda',
        assumptionKey: 'initiatives.selected',
        value: portfolio.selectedIds.length,
      },
    ],
    'financials.capex': [
      { rule: 'consolidate.capex', assumptionKey: 'baseCase.capex', value: a.baseCase.capex },
      { rule: 'consolidate.capex', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
      {
        rule: 'consolidate.capex',
        assumptionKey: 'initiatives.selected.capex',
        value: portfolio.capital.committed,
      },
    ],
    'financials.fcf': [
      {
        rule: 'consolidate.fcf',
        assumptionKey: 'workingCapitalPctOfRevenueDelta',
        value: a.workingCapitalPctOfRevenueDelta,
      },
      {
        rule: 'consolidate.fcf',
        assumptionKey: 'financials.ebitda',
        value: 'EBITDA minus capex minus working capital',
      },
    ],
    'people.headcount': [
      {
        rule: 'people.headcount',
        assumptionKey: 'people.baseHeadcount',
        value: a.people.baseHeadcount,
      },
      {
        rule: 'people.headcount',
        assumptionKey: 'people.headcountPerKtLime',
        value: a.people.headcountPerKtLime,
      },
      {
        rule: 'people.headcount',
        assumptionKey: 'people.headcountPerKtLimestone',
        value: a.people.headcountPerKtLimestone,
      },
      { rule: 'people.headcount', assumptionKey: 'L1', leverId: 'L1', value: levers.L1.multiplier },
    ],
    'people.saudization': [
      {
        rule: 'people.saudization',
        assumptionKey: 'people.baseSaudization',
        value: a.people.baseSaudization,
      },
      {
        rule: 'people.saudization',
        assumptionKey: 'people.nitaqatTarget',
        value: a.people.nitaqatTarget,
      },
      {
        rule: 'people.saudization',
        assumptionKey: workforce
          ? `initiatives.${workforce.id}.saudizationTarget`
          : 'initiatives.workforce.none',
        value: workforce?.saudizationTarget ?? a.people.baseSaudization,
      },
    ],
    'people.costPerTon': [
      {
        rule: 'people.costPerTon',
        assumptionKey: 'people.baseCostPerTonAllIn',
        value: a.people.baseCostPerTonAllIn,
      },
      { rule: 'people.costPerTon', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'people.costPerTon', assumptionKey: 'L6', leverId: 'L6', value: levers.L6 },
    ],
  }

  return { years, financials: f, split, people, sites, core, trace }
}
