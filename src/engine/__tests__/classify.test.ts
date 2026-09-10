import { classify, CATEGORIES } from '../classify'
import { runCore } from '../core'
import { base, withL, data } from './fixtures'
import type { Levers, PlanData } from '../types'

const run = (
  levers: Levers = base(),
  selected: string[] = ['gcc_export_sales'],
  d: PlanData = data,
) => classify(levers, d, runCore(levers, d, [], { selected }))

describe('classification', () => {
  it('produces one cell per domestic sector plus one per addressable export level', () => {
    const none = run(withL({ L5: 0 }), [])
    expect(none.cells).toHaveLength(data.assumptions.sectors.length)
    const gcc = run(withL({ L5: 1 }))
    expect(gcc.cells).toHaveLength(data.assumptions.sectors.length + 1)
    const ext = run(withL({ L5: 2 }), ['gcc_export_sales', 'jeddah_export_terminal'])
    expect(ext.cells).toHaveLength(data.assumptions.sectors.length + 2)
    expect(ext.cells.map((c) => c.id)).toContain('export_gcc')
    expect(ext.cells.map((c) => c.id)).toContain('export_extended')
  })

  it('scores every cell between 0 and 100 and assigns one of the six categories', () => {
    for (const c of run().cells) {
      expect(c.attractiveness).toBeGreaterThanOrEqual(0)
      expect(c.attractiveness).toBeLessThanOrEqual(100)
      expect(c.position).toBeGreaterThanOrEqual(0)
      expect(c.position).toBeLessThanOrEqual(100)
      expect(CATEGORIES).toContain(c.category)
      expect(c.revenue2031).toBeGreaterThanOrEqual(0)
      expect(c.rationale.length).toBeGreaterThan(10)
    }
  })

  it('classifies bricks as harvest or exit and steel as grow on the Base preset', () => {
    const r = run()
    expect(['harvest', 'exit']).toContain(r.byId.bricks_mkt.category)
    expect(r.byId.steel.category).toBe('grow')
  })

  it('lowers domestic attractiveness when demand is delayed', () => {
    const b = run()
    const d = run(withL({ L1: { option: 'delayed', multiplier: 0.7 } }))
    for (const s of data.assumptions.sectors.filter((x) => x.growth > 0))
      expect(d.byId[s.id].attractiveness).toBeLessThan(b.byId[s.id].attractiveness)
  })

  it('raises the position of the extended export market once the Jeddah terminal is selected', () => {
    const without = run(withL({ L5: 2 }), ['gcc_export_sales'])
    const withTerminal = run(withL({ L5: 2 }), ['gcc_export_sales', 'jeddah_export_terminal'])
    expect(withTerminal.byId.export_extended.position).toBeGreaterThan(
      without.byId.export_extended.position,
    )
  })

  it('reads the category thresholds from the data', () => {
    const strict: PlanData = {
      ...data,
      assumptions: {
        ...data.assumptions,
        classificationThresholds: {
          ...data.assumptions.classificationThresholds,
          grow: { attractiveness: 99, position: 99 },
        },
      },
    }
    expect(run(base(), ['gcc_export_sales'], strict).cells.some((c) => c.category === 'grow')).toBe(
      false,
    )
  })

  it('exposes the rule context shape and a trace per cell', () => {
    const r = run()
    expect(r.forRules.bricks.category).toBe(r.byId.bricks_mkt.category)
    expect(
      r.trace['classification.steel'].some((e) => e.assumptionKey === 'sectors.steel.growth'),
    ).toBe(true)
    expect(r.trace['classification.steel'].some((e) => e.leverId === 'L1')).toBe(true)
  })
})
