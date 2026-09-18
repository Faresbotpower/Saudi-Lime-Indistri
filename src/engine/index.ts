import { buildCascade, type ObjectiveResult, type PlanRollup, type ScorecardRow } from './cascade'
import { classify, type Category, type Cell } from './classify'
import { consolidate, type SiteResult } from './consolidate'
import { computeEmissions, type EmissionsResult } from './emissions'
import { deriveEnvelope, type EnvelopeDerivation } from './envelope'
import { runCore } from './core'
import { selectPortfolio } from './portfolio'
import { buildRoadmap, type Roadmap } from './roadmap'
import { evaluateViability, contextFor, type Trigger } from './viability'
import type { Levers, PlanData, ProForma2026, Trace, TraceEntry } from './types'
import { yearsOf } from './years'

export type { Levers, PlanData, TraceEntry, Trace } from './types'
export type { Category, Cell } from './classify'
export type { Roadmap, RoadmapItem, RoadmapLayer } from './roadmap'
export type { Trigger } from './viability'
export type {
  ObjectiveResult,
  ObjectiveStatus,
  PlanProject,
  PlanRollup,
  ScorecardRow,
} from './cascade'
export { PLAN_IDS } from './cascade'
export type { EmissionsResult } from './emissions'
export type { EnvelopeDerivation } from './envelope'
export { deriveEnvelope } from './envelope'
export type { ProForma2026 } from './types'

/** Actuals entered in the tracker for one elapsed year. */
export type Actuals = { year: number; L1multiplier?: number; L2?: number; L6?: number }

export type TriggerFired = {
  id: string
  from: 'in' | 'deferred' | 'out'
  to: 'in' | 'deferred' | 'out'
  reason?: string
  trigger?: Trigger
}
export type { SiteResult } from './consolidate'

export type Financials = {
  revenue: number[]
  ebitda: number[]
  ebitdaMargin: number[]
  capex: number[]
  fcf: number[]
  cumulativeFcf: number[]
}

export type PlanInitiative = {
  id: string
  status: 'in' | 'deferred' | 'out'
  reason?: string
  startYear?: number
  npv: number
  capex: number
  ebitdaRunRate: number
  trigger?: Trigger
}

export type PlanClassification = {
  id: string
  label: string
  family: string
  market: string
  attractiveness: number
  position: number
  category: Category
  revenue2031: number
  rationale: string
}

/**
 * Everything the UI renders. `years` starts with the actual base year (2026), so every
 * series has six entries and index 0 is actuals.
 */
export type PlanResult = {
  scenarioName: string
  years: number[]
  financials: Financials
  /** Always computed with the Base preset, for delta chips. */
  baseCase: Financials
  split: {
    baseRevenue: number[]
    initiativeRevenue: number[]
    baseEbitda: number[]
    initiativeEbitda: number[]
    baseCapex: number[]
    initiativeCapex: number[]
  }
  sites: SiteResult[]
  people: { headcount: number[]; saudization: number[]; costPerTon: number[] }
  supplyChain: {
    /** 2031 energy cost per ton of lime, on gas. */
    energyCostPerTonLime: number
    /** Energy cost per ton of lime by year, base year on the 2026 fuel mix. */
    energyCostPerTonLimeByYear: number[]
    /** Which fuel each site burns each year. */
    fuelBySite: Record<string, ('mix' | 'gas')[]>
    carbonCostPerTonLime: number
    exportLogisticsPerTon: number
  }
  /** The base year restated as if every site were already on gas; the plan starts here. */
  proForma2026: ProForma2026
  /** Emissions path of the lime business and the decarbonization roadmap. */
  emissions: EmissionsResult
  /** Present when L3 is set to Derived: how the envelope was computed from the plan. */
  envelopeDerivation?: EnvelopeDerivation
  /** Tonnage and price signals behind the P&L, by year (base year first). */
  volumes: {
    servedKt: number[]
    exportKt: number[]
    priceIndexLime: number[]
    utilizationLime: number[]
  }
  classification: PlanClassification[]
  initiatives: PlanInitiative[]
  roadmap: Roadmap
  capital: { envelope: number; committed: number; headroom: number }
  diversificationShare2031: number
  /** Objectives with the initiatives feeding them and a status flag. */
  objectives: ObjectiveResult[]
  /** The five functional plans with their projects, capex by year and requirements. */
  plans: PlanRollup[]
  /** The balanced scorecard, live where the engine computes the KPI. */
  scorecard: ScorecardRow[]
  /** Present when the plan was run with tracker actuals. */
  actuals?: Actuals
  /** Initiatives whose status changes once the actuals are applied. */
  triggersFired: TriggerFired[]
  trace: Trace
}

/** Name of the preset whose lever values match exactly, otherwise custom. */
export function scenarioNameFor(levers: Levers, data: PlanData): string {
  if (levers.L3derived) return 'custom'
  const same = (a: Levers, b: Levers) =>
    a.L1.option === b.L1.option &&
    Math.abs(a.L1.multiplier - b.L1.multiplier) < 1e-9 &&
    a.L2 === b.L2 &&
    a.L3 === b.L3 &&
    a.L4 === b.L4 &&
    a.L5 === b.L5 &&
    a.L6 === b.L6
  for (const [name, preset] of Object.entries(data.assumptions.scenarios))
    if (same(levers, preset)) return name
  return 'custom'
}

export const traceFor = (r: { trace: Trace }, key: string): TraceEntry[] => r.trace[key] ?? []

/**
 * The whole pipeline, synchronously:
 *  1 to 4  core on base capacity, 8 classification for the rules,
 *  5 viability, 6 portfolio, 7 consolidation (core again with the selected set),
 *  8 classification on the consolidated core, 9 roadmap, then the cascade to projects,
 *  objectives, plans and the scorecard, 10 trace.
 */
export function runPlan(
  levers: Levers,
  data: PlanData,
  opts: { actuals?: Actuals } = {},
): PlanResult {
  const scenarioName = scenarioNameFor(levers, data)
  const isBase = scenarioName === 'base'
  // Derived envelope: L3 is computed from the plan itself before anything else runs.
  const derivation = levers.L3derived ? deriveEnvelope(levers, data) : undefined
  if (derivation) levers = { ...levers, L3: derivation.envelope }
  const plain = runOnce(levers, data)
  const baseCase = isBase
    ? plain.financials
    : runOnce(data.assumptions.scenarios.base, data).financials
  const actuals = opts.actuals
  const hasActuals =
    !!actuals &&
    (actuals.L1multiplier !== undefined || actuals.L2 !== undefined || actuals.L6 !== undefined)
  if (!hasActuals)
    return { ...plain, baseCase, scenarioName, triggersFired: [], envelopeDerivation: derivation }

  // Tracked run: the elapsed year takes the actual values; decisions are re-taken on them.
  const decided: Levers = {
    ...levers,
    L1: { ...levers.L1, multiplier: actuals.L1multiplier ?? levers.L1.multiplier },
    L2: actuals.L2 ?? levers.L2,
    L6: actuals.L6 ?? levers.L6,
  }
  const overrides = {
    [actuals.year]: { L1multiplier: actuals.L1multiplier, L2: actuals.L2, L6: actuals.L6 },
  }
  const tracked = runOnce(levers, data, decided, overrides)
  const before = Object.fromEntries(plain.initiatives.map((i) => [i.id, i]))
  const triggersFired: TriggerFired[] = tracked.initiatives
    .filter((i) => before[i.id] && before[i.id].status !== i.status)
    .map((i) => ({
      id: i.id,
      from: before[i.id].status,
      to: i.status,
      reason: i.reason,
      trigger: i.trigger,
    }))
  return {
    ...tracked,
    baseCase,
    scenarioName,
    actuals,
    triggersFired,
    envelopeDerivation: derivation,
  }
}

/**
 * One pass. `decisionLevers` are the values the rules and the portfolio see (the actuals
 * when tracking); `yearOverrides` move the elapsed year's demand and cost only.
 */
function runOnce(
  levers: Levers,
  data: PlanData,
  decisionLevers: Levers = levers,
  yearOverrides: Record<number, { L1multiplier?: number; L2?: number; L6?: number }> = {},
): Omit<PlanResult, 'baseCase' | 'triggersFired'> {
  const a = data.assumptions
  const years = yearsOf(a)
  const n = years.length

  const core1 = runCore(decisionLevers, data, [], { selected: [] })
  const class1 = classify(decisionLevers, data, core1)
  const viability = evaluateViability(decisionLevers, data, (l) =>
    contextFor(l, data, class1.forRules),
  )
  const portfolio = selectPortfolio(decisionLevers, data, viability)
  const cons = consolidate(levers, data, portfolio, yearOverrides)
  const classification = classify(levers, data, cons.core)
  const roadmap = buildRoadmap(levers, data, portfolio)
  const emissions = computeEmissions(levers, data, portfolio, cons.core)

  const financials: Financials = {
    revenue: cons.financials.revenue,
    ebitda: cons.financials.ebitda,
    ebitdaMargin: cons.financials.ebitdaMargin,
    capex: cons.financials.capex,
    fcf: cons.financials.fcf,
    cumulativeFcf: cons.financials.cumulativeFcf,
  }

  const list = data.initiatives.initiatives
  const initiatives: PlanInitiative[] = list.map((i) => {
    const e = portfolio.entries[i.id]
    return {
      id: i.id,
      status: e.status,
      reason: e.reason,
      startYear: e.startYear,
      npv: e.npv,
      capex: e.capex,
      ebitdaRunRate: e.ebitdaRunRate,
      trigger: e.trigger,
    }
  })

  // Diversification: 2031 run-rate revenue of selected initiatives that open a new product or market.
  const newRevenue = list
    .filter((i) => i.newProductOrMarket && portfolio.entries[i.id].status === 'in')
    .reduce((s, i) => s + portfolio.economics[i.id].revenue[n - 1], 0)
  const diversificationShare2031 =
    financials.revenue[n - 1] > 0 ? newRevenue / financials.revenue[n - 1] : 0

  const volumes = {
    servedKt: cons.core.baseBusiness.volumeKt,
    exportKt: cons.core.capacity.exportServed,
    priceIndexLime: cons.core.price.priceIndexByFamily.lime ?? [],
    utilizationLime: cons.core.capacity.utilizationByFamily.lime ?? [],
  }
  const supplyChain = {
    energyCostPerTonLime: cons.core.cost.energyCostPerTonByFamily.lime * cons.core.calibration.cost,
    energyCostPerTonLimeByYear: cons.core.cost.energyCostPerTonLimeByYear.map(
      (x) => x * cons.core.calibration.cost,
    ),
    fuelBySite: cons.core.cost.fuelBySite,
    carbonCostPerTonLime: cons.core.cost.carbonCostPerTonLime,
    exportLogisticsPerTon: cons.core.cost.exportLogisticsPerTon,
  }
  const cascade = buildCascade(levers, data, portfolio, {
    years,
    financials: financials as unknown as Record<string, number[]>,
    volumes,
    people: cons.people as unknown as Record<string, number[]>,
    supplyChain: supplyChain as unknown as Record<string, number | number[]>,
    capital: portfolio.capital as unknown as Record<string, number>,
    diversificationShare2031,
    emissions: { intensity: emissions.intensity, totalKt: emissions.totalKt },
  })

  const trace: Trace = {
    ...cons.trace,
    ...classification.trace,
    ...roadmap.trace,
    ...cascade.trace,
    ...emissions.trace,
    ...(levers.L3derived ? deriveEnvelope(levers, data).trace : {}),
    'financials.ebitdaMargin': [
      {
        rule: 'consolidate.margin',
        assumptionKey: 'financials.ebitda',
        value: 'EBITDA divided by revenue',
      },
      { rule: 'consolidate.margin', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'consolidate.margin', assumptionKey: 'L6', leverId: 'L6', value: levers.L6 },
    ],
    'financials.cumulativeFcf': [
      {
        rule: 'consolidate.cumulativeFcf',
        assumptionKey: 'financials.fcf',
        value: 'Sum of plan-year FCF',
      },
      { rule: 'consolidate.cumulativeFcf', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
    ],
    diversification: [
      {
        rule: 'diversification.share',
        assumptionKey: 'initiatives.newProductOrMarket',
        value: Math.round(newRevenue),
      },
      { rule: 'diversification.share', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
      { rule: 'diversification.share', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
    ],
  }
  for (const s of cons.sites) {
    const touching = portfolio.selectedIds.filter(
      (id) => list.find((i) => i.id === id)?.site === s.id,
    )
    trace[`sites.${s.id}`] = [
      {
        rule: 'sites.capacity',
        assumptionKey: `sites.${s.id}.capacityKt`,
        value: Math.round(s.capacity[0]),
      },
      {
        rule: 'sites.utilization',
        assumptionKey: `sites.${s.id}.baseUtilization`,
        value: s.utilization[0],
      },
      {
        rule: 'sites.utilization',
        assumptionKey: 'L1',
        leverId: 'L1',
        value: levers.L1.multiplier,
      },
      { rule: 'sites.utilization', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
      {
        rule: 'sites.initiatives',
        assumptionKey: 'initiatives.selected.site',
        value: touching.join(', ') || 'none',
      },
    ]
  }

  return {
    scenarioName: scenarioNameFor(levers, data),
    years,
    financials,
    split: cons.split,
    sites: cons.sites,
    people: cons.people,
    supplyChain,
    proForma2026: {
      ...cons.core.proForma2026,
      energyCostPerTonLimeActual:
        cons.core.proForma2026.energyCostPerTonLimeActual * cons.core.calibration.cost,
      energyCostPerTonLimeOnGas:
        cons.core.proForma2026.energyCostPerTonLimeOnGas * cons.core.calibration.cost,
    },
    emissions,
    volumes,
    classification: classification.cells.map((c: Cell) => ({
      id: c.id,
      label: c.label,
      family: c.family,
      market: c.market,
      attractiveness: c.attractiveness,
      position: c.position,
      category: c.category,
      revenue2031: c.revenue2031,
      rationale: c.rationale,
    })),
    initiatives,
    roadmap,
    capital: portfolio.capital,
    diversificationShare2031,
    objectives: cascade.objectives,
    plans: cascade.plans,
    scorecard: cascade.scorecard,
    trace,
  }
}
