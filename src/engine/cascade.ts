import type { PortfolioResult } from './portfolio'
import type { Levers, PlanData, PlanId, Perspective, Requirements, Trace } from './types'

export type ProjectStatus = 'in' | 'deferred' | 'out'

export type PlanProject = {
  id: string
  initiativeId: string
  initiativeName: string
  name: string
  capex: number
  /** Start year after the initiative's own start has been applied. */
  startYear: number
  /** Last year touched by the project. */
  endYear: number
  durationQuarters: number
  owner: string
  deliverable: string
  status: ProjectStatus
  plan: PlanId
  /** Capex by plan year, base year first; zero unless the initiative is in plan. */
  capexByYear: number[]
}

export type ObjectiveStatus = 'on_track' | 'at_risk' | 'unfunded'

export type ObjectiveResult = {
  id: string
  shift: string
  name: string
  owner: string
  perspective: Perspective
  target: { metric: string; value: number; year: number }
  initiatives: { id: string; name: string; status: ProjectStatus; startYear?: number }[]
  status: ObjectiveStatus
  /** Live value of the target KPI in the target year, when the engine computes it. */
  live?: number
}

export type PlanRollup = {
  id: PlanId
  initiatives: string[]
  projects: PlanProject[]
  capexByYear: number[]
  capexTotal: number
  /** Headcount change from the initiatives in plan. */
  headcountDelta: number
  requirements: { people: string[]; systems: string[]; decisions: string[]; capex: number }
}

export type ScorecardRow = {
  id: string
  name: string
  perspective: Perspective
  unit: string
  lead: boolean
  direction: 'up' | 'down'
  cadence: 'quarterly' | 'annual'
  baseline2026: number
  targets: Record<string, number>
  computedFrom?: string
  /** Live values by year, base year first, when computedFrom resolves. */
  live?: number[]
}

export type Cascade = {
  objectives: ObjectiveResult[]
  plans: PlanRollup[]
  scorecard: ScorecardRow[]
  trace: Trace
}

export const PLAN_IDS: PlanId[] = ['commercial', 'operations', 'ai', 'sustainability', 'hr']

/** What the scorecard may read from the engine. */
export type CascadeSource = {
  years: number[]
  financials: Record<string, number[]>
  volumes: Record<string, number[]>
  people: Record<string, number[]>
  supplyChain: Record<string, number>
  capital: Record<string, number>
  diversificationShare2031: number
}

/** Resolve a computedFrom path to a series aligned with the years. Scalars fill every year. */
export function readSeries(path: string, src: CascadeSource, levers: Levers): number[] | undefined {
  const n = src.years.length
  const fill = (v: number) => Array.from({ length: n }, () => v)
  const [head, key] = path.split('.')
  if (head === 'levers') {
    if (key === 'L1') return fill(levers.L1.multiplier)
    const v = levers[key as keyof Levers]
    return typeof v === 'number' ? fill(v) : undefined
  }
  if (head === 'derived' && key === 'tonsPerEmployee')
    return src.years.map((_, i) => (src.volumes.servedKt[i] * 1000) / src.people.headcount[i])
  if (head === 'diversificationShare2031') return fill(src.diversificationShare2031)
  const table = (src as unknown as Record<string, unknown>)[head]
  if (!table || typeof table !== 'object') return undefined
  const v = (table as Record<string, unknown>)[key]
  if (Array.isArray(v)) return v as number[]
  if (typeof v === 'number') return fill(v)
  return undefined
}

/** Capex of one project by plan year: spread evenly over its quarters from its start year. */
function phase(capex: number, startYear: number, quarters: number, years: number[]): number[] {
  const out = years.map(() => 0)
  const perQuarter = capex / Math.max(1, quarters)
  for (let q = 0; q < Math.max(1, quarters); q++) {
    const year = startYear + Math.floor(q / 4)
    const i = years.indexOf(year)
    if (i >= 0) out[i] += perQuarter
    else if (year > years[years.length - 1]) out[years.length - 1] += perQuarter
  }
  return out
}

/**
 * Pipeline step after classification. Rolls every initiative's status, capex and timing down
 * to its projects and up to its objectives and its plan, and reads the scorecard live.
 */
export function buildCascade(
  levers: Levers,
  data: PlanData,
  portfolio: PortfolioResult,
  src: CascadeSource,
): Cascade {
  const list = data.initiatives.initiatives
  const years = src.years
  const trace: Trace = {}
  const byId = Object.fromEntries(list.map((i) => [i.id, i]))

  const projects: PlanProject[] = []
  for (const init of list) {
    const e = portfolio.entries[init.id]
    const start = e.startYear ?? init.startYearEarliest
    const shift = start - init.startYearEarliest
    for (const p of init.projects) {
      const startYear = p.startYear + shift
      const endYear = startYear + Math.floor(Math.max(1, p.durationQuarters - 1) / 4)
      projects.push({
        id: p.id,
        initiativeId: init.id,
        initiativeName: init.name,
        name: p.name,
        capex: p.capex,
        startYear,
        endYear,
        durationQuarters: p.durationQuarters,
        owner: p.owner,
        deliverable: p.deliverable,
        status: e.status,
        plan: init.plan,
        capexByYear:
          e.status === 'in'
            ? phase(p.capex, startYear, p.durationQuarters, years)
            : years.map(() => 0),
      })
      trace[`project.${p.id}`] = [
        {
          rule: 'cascade.project',
          assumptionKey: `initiatives.${init.id}.projects.${p.id}`,
          value: p.capex,
        },
        { rule: 'portfolio.status', assumptionKey: `initiatives.${init.id}`, value: e.status },
        {
          rule: 'roadmap.start',
          assumptionKey: `initiatives.${init.id}.startYearEarliest`,
          value: startYear,
        },
      ]
    }
  }

  const scorecard: ScorecardRow[] = data.objectives.scorecard.kpis.map((k) => {
    const raw = k.computedFrom ? readSeries(k.computedFrom, src, levers) : undefined
    const live = raw ? raw.map((v) => v * (k.scale ?? 1)) : undefined
    trace[`kpi.${k.id}`] = [
      {
        rule: 'cascade.kpi',
        assumptionKey: `objectives.scorecard.${k.id}.baseline2026`,
        value: k.baseline2026,
      },
      ...(k.computedFrom
        ? [
            {
              rule: 'cascade.computedFrom',
              assumptionKey: k.computedFrom,
              value: live ? live[years.length - 1] : 'not computed',
            },
          ]
        : [{ rule: 'cascade.computedFrom', assumptionKey: 'none', value: 'entered by the owner' }]),
      ...(k.computedFrom?.startsWith('levers.')
        ? [
            {
              rule: 'cascade.lead',
              assumptionKey: k.computedFrom.slice(7),
              leverId: k.computedFrom.slice(7) as Levers extends Record<infer K, unknown>
                ? K
                : never,
              value: live ? live[years.length - 1] : 0,
            },
          ]
        : []),
    ]
    return {
      id: k.id,
      name: k.name,
      perspective: k.perspective,
      unit: k.unit,
      lead: k.lead,
      direction: k.direction,
      cadence: k.cadence,
      baseline2026: k.baseline2026,
      targets: k.targets,
      computedFrom: k.computedFrom,
      live,
    }
  })
  const kpiById = Object.fromEntries(scorecard.map((k) => [k.id, k]))

  const objectives: ObjectiveResult[] = data.objectives.objectives.map((o) => {
    const feeding = list
      .filter((i) => i.objectives.includes(o.id))
      .map((i) => {
        const e = portfolio.entries[i.id]
        return { id: i.id, name: i.name, status: e.status, startYear: e.startYear }
      })
    const inCount = feeding.filter((f) => f.status === 'in').length
    const status: ObjectiveStatus =
      inCount === 0 ? 'unfunded' : inCount === feeding.length ? 'on_track' : 'at_risk'
    const kpi = kpiById[o.target.metric]
    const yi = years.indexOf(o.target.year)
    const live = kpi?.live && yi >= 0 ? kpi.live[yi] : undefined
    trace[`objective.${o.id}`] = [
      { rule: 'cascade.shift', assumptionKey: `objectives.${o.shift}`, value: o.shift },
      {
        rule: 'cascade.objective',
        assumptionKey: `objectives.${o.id}.target`,
        value: `${o.target.metric} ${o.target.value} by ${o.target.year}`,
      },
      ...feeding.map((f) => ({
        rule: 'portfolio.status',
        assumptionKey: `initiatives.${f.id}`,
        value: f.status,
      })),
      ...(live !== undefined
        ? [
            {
              rule: 'cascade.live',
              assumptionKey: `kpi.${o.target.metric}`,
              value: Math.round(live * 100) / 100,
            },
          ]
        : []),
    ]
    return {
      id: o.id,
      shift: o.shift,
      name: o.name,
      owner: o.owner,
      perspective: o.perspective,
      target: o.target,
      initiatives: feeding,
      status,
      live,
    }
  })

  const plans: PlanRollup[] = PLAN_IDS.map((id) => {
    const inits = list.filter((i) => i.plan === id)
    const inPlan = inits.filter((i) => portfolio.entries[i.id].status === 'in')
    const own = projects.filter((p) => p.plan === id)
    const capexByYear = years.map((_, k) => own.reduce((s, p) => s + p.capexByYear[k], 0))
    const req = (pick: (r: Requirements) => string) =>
      inPlan.map((i) => pick(i.requirements)).filter((x) => x && x !== 'None')
    const rollup: PlanRollup = {
      id,
      initiatives: inits.map((i) => i.id),
      projects: own,
      capexByYear,
      capexTotal: capexByYear.reduce((s, x) => s + x, 0),
      headcountDelta: inPlan.reduce((s, i) => s + i.headcountDelta, 0),
      requirements: {
        people: req((r) => r.people),
        systems: req((r) => r.systems),
        decisions: [...new Set(inits.flatMap((i) => i.requirements.decisions))],
        capex: inPlan.reduce((s, i) => s + i.requirements.capex, 0),
      },
    }
    trace[`plan.${id}`] = [
      {
        rule: 'cascade.plan',
        assumptionKey: `initiatives.plan.${id}`,
        value: inits.map((i) => i.id).join(', ') || 'none',
      },
      { rule: 'portfolio.committed', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
      {
        rule: 'consolidate.capex',
        assumptionKey: `plans.${id}.capexByYear`,
        value: Math.round(rollup.capexTotal),
      },
      {
        rule: 'people.headcount',
        assumptionKey: `plans.${id}.headcountDelta`,
        value: rollup.headcountDelta,
      },
    ]
    return rollup
  })

  void byId
  return { objectives, plans, scorecard, trace }
}
