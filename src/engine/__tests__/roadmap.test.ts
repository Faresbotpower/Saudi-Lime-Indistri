import { buildRoadmap } from '../roadmap'
import { selectPortfolio } from '../portfolio'
import { evaluateViability, contextFor } from '../viability'
import { base, withL, data } from './fixtures'
import type { Levers } from '../types'

const run = (levers: Levers = base()) => {
  const v = evaluateViability(levers, data, (l) => contextFor(l, data))
  const p = selectPortfolio(levers, data, v)
  return { p, r: buildRoadmap(levers, data, p) }
}

describe('roadmap', () => {
  it('groups items in the five RFQ layers in data order', () => {
    const { r } = run()
    expect(r.layers.map((l) => l.layer)).toEqual(data.initiatives.layers.map((l) => l.id))
    expect(r.layers.map((l) => l.label)).toEqual(data.initiatives.layers.map((l) => l.name))
  })

  it('places every selected initiative exactly once, from its start year to the end of its ramp', () => {
    const { p, r } = run()
    const items = r.layers.flatMap((l) => l.items)
    const inItems = items.filter((i) => i.status === 'in')
    expect(inItems.map((i) => i.id).sort()).toEqual([...p.selectedIds].sort())
    for (const i of inItems) {
      const init = data.initiatives.initiatives.find((x) => x.id === i.id)!
      expect(i.start).toBe(p.entries[i.id].startYear)
      expect(i.end).toBe(i.start + Math.max(1, init.rampYears) - 1)
      expect(i.end).toBeLessThanOrEqual(2031)
    }
  })

  it('shows capital-deferred initiatives as ghosts at their earliest start with the extra envelope needed', () => {
    const { p, r } = run(withL({ L3: 150 }))
    const ghosts = r.layers.flatMap((l) => l.items).filter((i) => i.status === 'deferred')
    const deferred = Object.entries(p.entries).filter(
      ([, e]) => e.status === 'deferred' && e.reason === 'capital',
    )
    expect(ghosts.map((g) => g.id).sort()).toEqual(deferred.map(([id]) => id).sort())
    for (const g of ghosts) {
      const e = p.entries[g.id]
      expect(g.needsCapital).toBe(e.trigger!.threshold - 150)
      expect(g.start).toBe(e.startYear)
    }
  })

  it('never shows out initiatives', () => {
    const { p, r } = run()
    const ids = r.layers.flatMap((l) => l.items).map((i) => i.id)
    for (const [id, e] of Object.entries(p.entries))
      if (e.status === 'out') expect(ids).not.toContain(id)
  })

  it('draws dependency links between selected bars and marks the critical path', () => {
    const { r } = run(withL({ L3: 600 }))
    expect(r.links.some((l) => l.from === 'kiln_efficiency' && l.to === 'pcc_plant')).toBe(true)
    expect(r.criticalPath.length).toBeGreaterThan(0)
    const items = Object.fromEntries(r.layers.flatMap((l) => l.items).map((i) => [i.id, i]))
    for (const l of r.links) expect(items[l.to].start).toBeGreaterThan(items[l.from].start)
  })

  it('adds a milestone at ramp completion for each selected initiative', () => {
    const { r } = run()
    for (const i of r.layers.flatMap((l) => l.items).filter((x) => x.status === 'in'))
      expect(i.milestone).toBe(i.end)
  })
})
