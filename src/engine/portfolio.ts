import { rampShare } from './capacity'
import { leverGrid } from './rules'
import type {
  CapacityAddition,
  Initiative,
  LeverId,
  Levers,
  PlanData,
  Trace,
  TraceEntry,
} from './types'
import type { Trigger, ViabilityResult } from './viability'
import { yearsOf, zeros } from './years'

export type InitiativeEconomics = {
  years: number[]
  revenue: number[]
  ebitda: number[]
  capex: number[]
  headcount: number[]
  npv: number
  ebitdaRunRate: number
}

export type PortfolioEntry = {
  status: 'in' | 'deferred' | 'out'
  reason?: string
  startYear?: number
  npv: number
  capex: number
  ebitdaRunRate: number
  trigger?: Trigger
}

export type PortfolioResult = {
  entries: Record<string, PortfolioEntry>
  selectedIds: string[]
  additions: CapacityAddition[]
  capital: { envelope: number; committed: number; headroom: number }
  impacts: { revenue: number[]; ebitda: number[]; capex: number[]; headcount: number[] }
  economics: Record<string, InitiativeEconomics>
  trace: Trace
}

const LEVER_BASE: Partial<Record<LeverId, number>> = { L2: 100, L6: 0 }

/** EBITDA run rate after scaling with the named lever, e.g. kiln efficiency is worth more when energy is dear. */
export function scaledEbitdaRunRate(init: Initiative, levers: Levers, data: PlanData): number {
  if (!init.ebitdaScalesWith || !init.ebitdaScaleFactor) return init.ebitdaRunRate
  const id = init.ebitdaScalesWith
  const value = id === 'L1' ? levers.L1.multiplier : (levers[id] as number)
  const baseValue = id === 'L2' ? data.assumptions.energy.baseIndex : (LEVER_BASE[id] ?? 0)
  return init.ebitdaRunRate * (1 + init.ebitdaScaleFactor * (value - baseValue))
}

/**
 * Cash flows of one initiative from a given start year: revenue and EBITDA ramp linearly
 * over rampYears, capex is spread evenly over the ramp, headcount ramps with EBITDA.
 * NPV discounts plan-year cash flows at the plan rate and adds a terminal value of
 * terminalMultiple times 2031 EBITDA.
 */
export function initiativeEconomics(
  init: Initiative,
  levers: Levers,
  data: PlanData,
  startYear: number,
): InitiativeEconomics {
  const a = data.assumptions
  const years = yearsOf(a)
  const n = years.length
  const runRate = scaledEbitdaRunRate(init, levers, data)
  const revenue = zeros(n)
  const ebitda = zeros(n)
  const capex = zeros(n)
  const headcount = zeros(n)
  const ramp = Math.max(1, init.rampYears)
  for (let i = 0; i < n; i++) {
    const y = years[i]
    const share = rampShare(y, startYear, ramp)
    revenue[i] = init.revenueRunRate * share
    ebitda[i] = runRate * share
    headcount[i] = init.headcountDelta * share
    if (y >= startYear && y < startYear + ramp) capex[i] = init.capex / ramp
  }
  let npv = 0
  for (let i = 1; i < n; i++) npv += (ebitda[i] - capex[i]) / Math.pow(1 + a.discountRate, i)
  npv += (a.terminalMultiple * ebitda[n - 1]) / Math.pow(1 + a.discountRate, n - 1)
  return { years, revenue, ebitda, capex, headcount, npv, ebitdaRunRate: runRate }
}

/** Start year honouring dependencies: at least one year after every dependency starts. */
function startYears(list: Initiative[], viable: Set<string>): Record<string, number> {
  const byId = Object.fromEntries(list.map((i) => [i.id, i]))
  const memo: Record<string, number> = {}
  const visit = (id: string, stack: Set<string>): number => {
    if (memo[id] !== undefined) return memo[id]
    if (stack.has(id)) throw new Error(`Dependency cycle at ${id}`)
    stack.add(id)
    const init = byId[id]
    let start = init.startYearEarliest
    for (const dep of init.dependencies)
      if (byId[dep] && viable.has(dep)) start = Math.max(start, visit(dep, stack) + 1)
    stack.delete(id)
    memo[id] = start
    return start
  }
  for (const i of list) visit(i.id, new Set())
  return memo
}

type Candidate = { id: string; capex: number; npv: number; ratio: number; deps: string[] }

/** Greedy pick by NPV per unit of capex, dependencies first, until the envelope is exhausted. */
function greedy(candidates: Candidate[], envelope: number): string[] {
  const selected: string[] = []
  const chosen = new Set<string>()
  let committed = 0
  const pool = [...candidates].sort((x, y) => y.ratio - x.ratio || x.capex - y.capex)
  let progress = true
  while (progress) {
    progress = false
    for (const c of pool) {
      if (chosen.has(c.id)) continue
      if (!c.deps.every((d) => chosen.has(d))) continue
      if (committed + c.capex > envelope + 1e-9) continue
      chosen.add(c.id)
      selected.push(c.id)
      committed += c.capex
      progress = true
      break
    }
  }
  return selected
}

/**
 * Pipeline step 6. Among viable initiatives, rank by NPV / capex, honour dependencies,
 * select greedily within the capital envelope (L3). Selected = in, viable but unfunded =
 * deferred with reason capital and an L3 trigger, viable with negative NPV = deferred with
 * reason returns, everything else keeps its viability status.
 */
export function selectPortfolio(
  levers: Levers,
  data: PlanData,
  viability: ViabilityResult,
): PortfolioResult {
  const a = data.assumptions
  const list = data.initiatives.initiatives
  const years = yearsOf(a)
  const n = years.length
  const viable = new Set(list.filter((i) => viability[i.id]?.status === 'viable').map((i) => i.id))
  const starts = startYears(list, viable)

  const economics: Record<string, InitiativeEconomics> = {}
  for (const i of list) economics[i.id] = initiativeEconomics(i, levers, data, starts[i.id])

  // Hurdle: a viable initiative with negative NPV at the plan discount rate is not a candidate.
  const belowHurdle = new Set(
    list.filter((i) => viable.has(i.id) && economics[i.id].npv < 0).map((i) => i.id),
  )
  const candidates: Candidate[] = list
    .filter((i) => viable.has(i.id) && !belowHurdle.has(i.id))
    .map((i) => ({
      id: i.id,
      capex: i.capex,
      npv: economics[i.id].npv,
      ratio: i.capex > 0 ? economics[i.id].npv / i.capex : Number.POSITIVE_INFINITY,
      deps: i.dependencies,
    }))

  const selectedIds = greedy(candidates, levers.L3)
  const selected = new Set(selectedIds)
  const committed = selectedIds.reduce(
    (s, id) => s + (list.find((i) => i.id === id)?.capex ?? 0),
    0,
  )

  // Capital trigger: smallest envelope on the L3 grid at which a deferred initiative is funded.
  const grid = leverGrid('L3', a)
  const fundedAt = (id: string): number | undefined => {
    for (const env of grid) if (env > levers.L3 && greedy(candidates, env).includes(id)) return env
    return undefined
  }

  const entries: Record<string, PortfolioEntry> = {}
  const trace: Trace = {}
  for (const i of list) {
    const v = viability[i.id]
    const e = economics[i.id]
    const common = { npv: e.npv, capex: i.capex, ebitdaRunRate: e.ebitdaRunRate }
    if (selected.has(i.id)) {
      entries[i.id] = { ...common, status: 'in', startYear: starts[i.id], trigger: v.trigger }
    } else if (belowHurdle.has(i.id)) {
      entries[i.id] = {
        ...common,
        status: 'deferred',
        reason: 'returns',
        startYear: starts[i.id],
        trigger: v.trigger,
      }
    } else if (viable.has(i.id)) {
      const threshold = fundedAt(i.id)
      entries[i.id] = {
        ...common,
        status: 'deferred',
        reason: 'capital',
        startYear: starts[i.id],
        trigger:
          threshold !== undefined ? { leverId: 'L3', threshold, direction: 'above' } : undefined,
      }
    } else {
      entries[i.id] = {
        ...common,
        status: v.status === 'out' ? 'out' : 'deferred',
        reason: v.reason,
        trigger: v.trigger,
      }
    }
    const t: TraceEntry[] = [
      {
        rule: 'portfolio.status',
        assumptionKey: `initiatives.${i.id}.status`,
        value: entries[i.id].status,
      },
      {
        rule: 'portfolio.npv',
        assumptionKey: `initiatives.${i.id}.npv`,
        value: Math.round(e.npv * 10) / 10,
      },
      { rule: 'portfolio.npv', assumptionKey: 'discountRate', value: a.discountRate },
      { rule: 'portfolio.npv', assumptionKey: 'terminalMultiple', value: a.terminalMultiple },
      { rule: 'portfolio.envelope', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
    ]
    for (const r of v.failedRules)
      t.push({ rule: 'viability.rule', assumptionKey: r.expr, leverId: r.leverId, value: r.label })
    if (i.ebitdaScalesWith)
      t.push({
        rule: 'portfolio.ebitdaScale',
        assumptionKey: `initiatives.${i.id}.ebitdaScaleFactor`,
        leverId: i.ebitdaScalesWith,
        value: e.ebitdaRunRate,
      })
    trace[`initiative.${i.id}`] = t
  }

  const additions: CapacityAddition[] = []
  const impacts = { revenue: zeros(n), ebitda: zeros(n), capex: zeros(n), headcount: zeros(n) }
  for (const id of selectedIds) {
    const i = list.find((x) => x.id === id)!
    const e = economics[id]
    for (let k = 0; k < n; k++) {
      impacts.revenue[k] += e.revenue[k]
      impacts.ebitda[k] += e.ebitda[k]
      impacts.capex[k] += e.capex[k]
      impacts.headcount[k] += e.headcount[k]
    }
    for (const [product, kt] of Object.entries(i.capacityAddKt ?? {}))
      additions.push({
        initiativeId: id,
        product,
        kt,
        startYear: starts[id],
        rampYears: i.rampYears,
        site: i.site,
      })
  }
  trace['capital'] = [
    { rule: 'portfolio.envelope', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
    { rule: 'portfolio.committed', assumptionKey: 'initiatives.selected.capex', value: committed },
  ]

  return {
    entries,
    selectedIds,
    additions,
    capital: { envelope: levers.L3, committed, headroom: levers.L3 - committed },
    impacts,
    economics,
    trace,
  }
}
