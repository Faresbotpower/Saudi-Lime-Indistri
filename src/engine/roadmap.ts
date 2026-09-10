import type { PortfolioResult } from './portfolio'
import type { Levers, PlanData, Trace } from './types'

export type RoadmapItem = {
  id: string
  name: string
  start: number
  end: number
  status: 'in' | 'deferred'
  /** Ramp completion year, drawn as a milestone. */
  milestone: number
  /** For deferred ghosts: extra envelope needed, SAR m. */
  needsCapital?: number
  site: string | null
  dependencies: string[]
}

export type RoadmapLayer = { layer: string; label: string; items: RoadmapItem[] }

export type Roadmap = {
  layers: RoadmapLayer[]
  links: { from: string; to: string }[]
  criticalPath: string[]
  trace: Trace
}

/**
 * Pipeline step 9. Selected initiatives on the 2027 to 2031 timeline by start year and
 * ramp, grouped in the five RFQ layers. Capital-deferred initiatives appear as ghosts at
 * their earliest start with the extra envelope they need. The critical path is the longest
 * dependency chain among selected bars.
 */
export function buildRoadmap(levers: Levers, data: PlanData, portfolio: PortfolioResult): Roadmap {
  const list = data.initiatives.initiatives
  const byId = Object.fromEntries(list.map((i) => [i.id, i]))
  const items: Record<string, RoadmapItem> = {}
  const trace: Trace = {}

  for (const init of list) {
    const e = portfolio.entries[init.id]
    if (!e) continue
    const isIn = e.status === 'in'
    const isGhost = e.status === 'deferred' && e.reason === 'capital'
    if (!isIn && !isGhost) continue
    const start = e.startYear ?? init.startYearEarliest
    const end = start + Math.max(1, init.rampYears) - 1
    items[init.id] = {
      id: init.id,
      name: init.name,
      start,
      end,
      status: isIn ? 'in' : 'deferred',
      milestone: end,
      needsCapital:
        isGhost && e.trigger?.leverId === 'L3' ? e.trigger.threshold - levers.L3 : undefined,
      site: init.site,
      dependencies: init.dependencies,
    }
    trace[`roadmap.${init.id}`] = [
      {
        rule: 'roadmap.start',
        assumptionKey: `initiatives.${init.id}.startYearEarliest`,
        value: init.startYearEarliest,
      },
      {
        rule: 'roadmap.ramp',
        assumptionKey: `initiatives.${init.id}.rampYears`,
        value: init.rampYears,
      },
      { rule: 'roadmap.status', assumptionKey: 'L3', leverId: 'L3', value: levers.L3 },
      ...(init.dependencies.length
        ? [
            {
              rule: 'roadmap.dependency',
              assumptionKey: `initiatives.${init.id}.dependencies`,
              value: init.dependencies.join(', '),
            },
          ]
        : []),
    ]
  }

  const layers: RoadmapLayer[] = data.initiatives.layers.map((l) => ({
    layer: l.id,
    label: l.name,
    items: list
      .filter((i) => i.layer === l.id && items[i.id])
      .map((i) => items[i.id])
      .sort((x, y) => x.start - y.start || x.id.localeCompare(y.id)),
  }))

  const selected = new Set(portfolio.selectedIds)
  const links: { from: string; to: string }[] = []
  for (const id of portfolio.selectedIds)
    for (const dep of byId[id].dependencies)
      if (selected.has(dep)) links.push({ from: dep, to: id })

  // Critical path: the chain of selected bars with the latest ramp completion, followed back through dependencies.
  const longest = new Map<string, { end: number; path: string[] }>()
  const walk = (id: string): { end: number; path: string[] } => {
    const cached = longest.get(id)
    if (cached) return cached
    const deps = byId[id].dependencies.filter((d) => selected.has(d))
    let best: { end: number; path: string[] } = { end: items[id].end, path: [id] }
    for (const d of deps) {
      const sub = walk(d)
      const candidate = { end: items[id].end, path: [...sub.path, id] }
      if (candidate.path.length > best.path.length) best = candidate
    }
    longest.set(id, best)
    return best
  }
  let critical: string[] = []
  for (const id of portfolio.selectedIds) {
    const r = walk(id)
    if (
      r.path.length > critical.length ||
      (r.path.length === critical.length && r.end > (items[critical.at(-1) ?? '']?.end ?? -1))
    )
      critical = r.path
  }

  return { layers, links, criticalPath: critical, trace }
}
