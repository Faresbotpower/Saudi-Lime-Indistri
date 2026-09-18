import { runCore } from './core'
import { evaluateRule, leverGrid, leverValue, withLeverValue, type RuleContext } from './rules'
import type { Initiative, LeverId, Levers, PlanData, Rule } from './types'

export type Trigger = { leverId: LeverId; threshold: number; direction: 'above' | 'below' }

export type ViabilityEntry = {
  status: 'viable' | 'deferred' | 'out'
  reason?: string
  failedRules: Rule[]
  /** Lever boundary of viability: 'above' means viable when the lever is at or above threshold. */
  trigger?: Trigger
}

export type ViabilityResult = Record<string, ViabilityEntry>

/** Build the rule context for a lever set from the core run (base capacity, no additions). */
export function contextFor(
  levers: Levers,
  data: PlanData,
  classification?: RuleContext['classification'],
): RuleContext {
  const core = runCore(levers, data, [])
  const utilization: RuleContext['utilization'] = {}
  for (const [region, fams] of Object.entries(core.capacity.utilizationByRegionFamily)) {
    utilization[region] = {}
    for (const [fam, series] of Object.entries(fams)) {
      utilization[region][fam] = {}
      core.years.forEach((y, i) => (utilization[region][fam][y] = series[i]))
    }
  }
  const margin: RuleContext['margin'] = {}
  for (const [fam, series] of Object.entries(core.marginByFamily)) {
    margin[fam] = {}
    core.years.forEach((y, i) => (margin[fam][y] = series[i]))
  }
  return { levers, utilization, classification, margin }
}

/**
 * Pipeline step 5. Status per initiative from its rules:
 * out if any strategic rule fails, deferred if only a dependency fails, viable otherwise.
 * Capital deferral is decided in the portfolio step. Trigger points come from scanning
 * the relevant lever across its grid.
 */
export function evaluateViability(
  levers: Levers,
  data: PlanData,
  ctxFor: (levers: Levers) => RuleContext,
): ViabilityResult {
  const a = data.assumptions
  const list = data.initiatives.initiatives
  const ctx = ctxFor(levers)
  const cache = new Map<string, RuleContext>()
  const ctxAt = (l: Levers) => {
    const key = JSON.stringify(l)
    let c = cache.get(key)
    if (!c) {
      c = ctxFor(l)
      cache.set(key, c)
    }
    return c
  }
  cache.set(JSON.stringify(levers), ctx)

  const result: ViabilityResult = {}
  for (const init of list) {
    const failed = init.rules.filter((r) => r.type === 'strategic' && !evaluateRule(r.expr, ctx))
    if (failed.length > 0) {
      result[init.id] = {
        status: 'out',
        reason: failed[0].label,
        failedRules: failed,
        trigger: triggerFor(init, failed[0], levers, a, ctxAt, false),
      }
    } else {
      result[init.id] = {
        status: 'viable',
        failedRules: [],
        trigger: nearestBoundary(init, levers, a, ctxAt),
      }
    }
  }

  // Dependencies: an initiative whose dependency is not viable is deferred.
  let changed = true
  while (changed) {
    changed = false
    for (const init of list) {
      const me = result[init.id]
      if (me.status !== 'viable') continue
      const blocked = init.dependencies.find((d) => result[d] && result[d].status !== 'viable')
      if (blocked) {
        result[init.id] = {
          ...me,
          status: 'deferred',
          reason: 'dependency',
          trigger: result[blocked].trigger ?? me.trigger,
        }
        changed = true
      }
    }
  }
  return result
}

/** For a failing rule, the nearest grid value of its lever at which the rule passes. */
function triggerFor(
  init: Initiative,
  rule: Rule,
  levers: Levers,
  a: PlanData['assumptions'],
  ctxAt: (l: Levers) => RuleContext,
  _viable: boolean,
): Trigger | undefined {
  void init
  void _viable
  const id = rule.leverId
  const grid = leverGrid(id, a)
  const current = leverValue(levers, id)
  const passes = grid.map((v) => evaluateRule(rule.expr, ctxAt(withLeverValue(levers, id, v))))
  const above = grid.findIndex((v, k) => v > current + 1e-9 && passes[k])
  let below = -1
  for (let k = grid.length - 1; k >= 0; k--)
    if (grid[k] < current - 1e-9 && passes[k]) {
      below = k
      break
    }
  if (above < 0 && below < 0) return undefined
  const distA = above >= 0 ? above - grid.findIndex((v) => v >= current - 1e-9) : Infinity
  const distB = below >= 0 ? grid.findIndex((v) => v >= current - 1e-9) - below : Infinity
  if (distA <= distB) return { leverId: id, threshold: grid[above], direction: 'above' }
  return { leverId: id, threshold: grid[below], direction: 'below' }
}

/** For a viable initiative, the closest lever boundary at which one of its rules would fail. */
function nearestBoundary(
  init: Initiative,
  levers: Levers,
  a: PlanData['assumptions'],
  ctxAt: (l: Levers) => RuleContext,
): Trigger | undefined {
  let best: { trigger: Trigger; dist: number } | undefined
  for (const rule of init.rules.filter((r) => r.type === 'strategic')) {
    const id = rule.leverId
    const grid = leverGrid(id, a)
    const current = leverValue(levers, id)
    const passes = grid.map((v) => evaluateRule(rule.expr, ctxAt(withLeverValue(levers, id, v))))
    const cur = grid.findIndex((v) => v >= current - 1e-9)
    // Walk outward: last passing value before a failure on each side.
    for (let k = cur; k < grid.length; k++) {
      if (!passes[k]) {
        const t: Trigger = { leverId: id, threshold: grid[k - 1], direction: 'below' }
        const dist = k - 1 - cur
        if (!best || dist < best.dist) best = { trigger: t, dist }
        break
      }
    }
    for (let k = cur; k >= 0; k--) {
      if (!passes[k]) {
        const t: Trigger = { leverId: id, threshold: grid[k + 1], direction: 'above' }
        const dist = cur - (k + 1)
        if (!best || dist < best.dist) best = { trigger: t, dist }
        break
      }
    }
  }
  return best?.trigger
}
