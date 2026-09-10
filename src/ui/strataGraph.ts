import type { PlanResult } from '../engine'
import type { LeverId, PlanData } from '../engine/types'
import { leverDefs } from '../data'

export const PLAN_LINES = ['revenue', 'ebitda', 'capex', 'fcf', 'cumulativeFcf'] as const
export type PlanLine = (typeof PLAN_LINES)[number]

export type Graph = {
  levers: LeverId[]
  assumptions: string[]
  leverAssumptions: Record<LeverId, string[]>
  assumptionLevers: Record<string, LeverId[]>
  leverInitiatives: Record<LeverId, string[]>
  initiativeLevers: Record<string, LeverId[]>
  initiativeLines: Record<string, PlanLine[]>
  /** Plan lines a lever moves directly through the base business, before initiatives. */
  leverLines: Record<LeverId, PlanLine[]>
  initiatives: string[]
}

export type Hover =
  | { kind: 'lever'; id: LeverId }
  | { kind: 'assumption'; id: string }
  | { kind: 'initiative'; id: string }
  | { kind: 'line'; id: PlanLine }

export type LitPath = {
  levers: LeverId[]
  assumptions: string[]
  initiatives: string[]
  lines: PlanLine[]
}

const ASSUMPTION_LINES: Record<string, PlanLine[]> = {
  demand: ['revenue', 'ebitda', 'fcf', 'cumulativeFcf'],
  utilization: ['revenue', 'ebitda', 'fcf', 'cumulativeFcf'],
  priceIndex: ['revenue', 'ebitda', 'fcf', 'cumulativeFcf'],
  costPerTon: ['ebitda', 'fcf', 'cumulativeFcf'],
  ebitda: ['ebitda', 'fcf', 'cumulativeFcf'],
  portfolio: ['revenue', 'ebitda', 'capex', 'fcf', 'cumulativeFcf'],
  capex: ['capex', 'fcf', 'cumulativeFcf'],
  roadmap: ['capex', 'fcf', 'cumulativeFcf'],
  sites: ['revenue', 'ebitda'],
  classification: ['revenue'],
}

const uniq = <T>(xs: T[]): T[] => [...new Set(xs)]

/** The dependency graph behind the Strata reveal, from the data and the current plan. */
export function buildGraph(data: PlanData, plan: PlanResult): Graph {
  const levers = leverDefs.map((d) => d.id)
  const leverAssumptions = Object.fromEntries(leverDefs.map((d) => [d.id, d.moves])) as Record<
    LeverId,
    string[]
  >
  const assumptions = uniq(leverDefs.flatMap((d) => d.moves))
  const assumptionLevers: Record<string, LeverId[]> = {}
  for (const a of assumptions)
    assumptionLevers[a] = levers.filter((l) => leverAssumptions[l].includes(a))

  const list = data.initiatives.initiatives
  const status = Object.fromEntries(plan.initiatives.map((i) => [i.id, i]))
  const exportGated = new Set(Object.values(data.assumptions.export.requiresInitiative))
  const leverInitiatives = Object.fromEntries(levers.map((l) => [l, [] as string[]])) as Record<
    LeverId,
    string[]
  >
  for (const init of list) {
    const s = status[init.id]
    const touched = new Set<LeverId>()
    for (const r of init.rules) touched.add(r.leverId)
    if (init.ebitdaScalesWith) touched.add(init.ebitdaScalesWith)
    if (exportGated.has(init.id)) touched.add('L5')
    if (s && (s.status === 'in' || (s.status === 'deferred' && s.reason === 'capital')))
      touched.add('L3')
    for (const l of touched) leverInitiatives[l].push(init.id)
  }
  const initiativeLevers: Record<string, LeverId[]> = {}
  for (const init of list)
    initiativeLevers[init.id] = levers.filter((l) => leverInitiatives[l].includes(init.id))

  const initiativeLines: Record<string, PlanLine[]> = {}
  for (const init of list) {
    const lines: PlanLine[] = []
    const volume =
      (init.capacityAddKt && Object.keys(init.capacityAddKt).length > 0) || exportGated.has(init.id)
    if (init.revenueRunRate !== 0 || volume) lines.push('revenue')
    lines.push('ebitda')
    if (init.capex > 0) lines.push('capex')
    lines.push('fcf', 'cumulativeFcf')
    initiativeLines[init.id] = lines
  }

  const leverLines = Object.fromEntries(
    levers.map((l) => [l, uniq(leverAssumptions[l].flatMap((a) => ASSUMPTION_LINES[a] ?? []))]),
  ) as Record<LeverId, PlanLine[]>

  return {
    levers,
    assumptions,
    leverAssumptions,
    assumptionLevers,
    leverInitiatives,
    initiativeLevers,
    initiativeLines,
    leverLines,
    initiatives: list.map((i) => i.id),
  }
}

/** Everything that lights up for a hover, in band order: levers, assumptions, initiatives, plan lines. */
export function litPath(g: Graph, hover: Hover | null): LitPath {
  if (!hover) return { levers: [], assumptions: [], initiatives: [], lines: [] }
  switch (hover.kind) {
    case 'lever': {
      const inits = g.leverInitiatives[hover.id] ?? []
      const lines = uniq([
        ...(g.leverLines[hover.id] ?? []),
        ...inits.flatMap((i) => g.initiativeLines[i]),
      ])
      return {
        levers: [hover.id],
        assumptions: g.leverAssumptions[hover.id] ?? [],
        initiatives: inits,
        lines: orderLines(lines),
      }
    }
    case 'assumption': {
      const levers = g.assumptionLevers[hover.id] ?? []
      const inits = uniq(levers.flatMap((l) => g.leverInitiatives[l]))
      const lines = uniq([
        ...(ASSUMPTION_LINES[hover.id] ?? []),
        ...inits.flatMap((i) => g.initiativeLines[i]),
      ])
      return { levers, assumptions: [hover.id], initiatives: inits, lines: orderLines(lines) }
    }
    case 'initiative': {
      const levers = g.initiativeLevers[hover.id] ?? []
      const assumptions = uniq(levers.flatMap((l) => g.leverAssumptions[l]))
      return {
        levers,
        assumptions: g.assumptions.filter((a) => assumptions.includes(a)),
        initiatives: [hover.id],
        lines: g.initiativeLines[hover.id] ?? [],
      }
    }
    case 'line': {
      const inits = g.initiatives.filter((i) => g.initiativeLines[i].includes(hover.id))
      const levers = uniq([
        ...g.levers.filter((l) => g.leverLines[l].includes(hover.id)),
        ...inits.flatMap((i) => g.initiativeLevers[i]),
      ])
      const assumptions = uniq(levers.flatMap((l) => g.leverAssumptions[l]))
      return {
        levers: g.levers.filter((l) => levers.includes(l)),
        assumptions: g.assumptions.filter((a) => assumptions.includes(a)),
        initiatives: inits,
        lines: [hover.id],
      }
    }
  }
}

const orderLines = (lines: PlanLine[]): PlanLine[] => PLAN_LINES.filter((l) => lines.includes(l))
