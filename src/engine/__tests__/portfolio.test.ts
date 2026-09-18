import { initiativeEconomics, selectPortfolio } from '../portfolio'
import { evaluateViability, contextFor } from '../viability'
import { base, withL, data, YEARS } from './fixtures'
import type { Levers, PlanData } from '../types'

const run = (levers: Levers = base(), d: PlanData = data) => {
  const v = evaluateViability(levers, d, (l) => contextFor(l, d))
  return selectPortfolio(levers, d, v)
}
const init = (id: string) => data.initiatives.initiatives.find((i) => i.id === id)!

describe('initiative economics', () => {
  it('ramps EBITDA linearly from the start year and phases capex over the ramp', () => {
    const k = init('alkharj_kiln')
    const e = initiativeEconomics(k, base(), data, 2027)
    // capex over 3 ramp years from 2027, EBITDA run rate ramping 1/3, 2/3, 1
    expect(e.capex).toEqual([0, k.capex / 3, k.capex / 3, k.capex / 3, 0, 0])
    const r2 = (x: number) => Math.round(x * 100) / 100
    expect(e.ebitda.map(r2)).toEqual(
      [
        0,
        k.ebitdaRunRate / 3,
        (2 * k.ebitdaRunRate) / 3,
        k.ebitdaRunRate,
        k.ebitdaRunRate,
        k.ebitdaRunRate,
      ].map(r2),
    )
    expect(e.revenue[5]).toBeCloseTo(k.revenueRunRate, 9)
  })

  it('scales EBITDA with the named lever', () => {
    const at100 = initiativeEconomics(init('kiln_efficiency'), base(), data, 2027)
    const at140 = initiativeEconomics(init('kiln_efficiency'), withL({ L2: 140 }), data, 2027)
    expect(at140.ebitda[5]).toBeCloseTo(init('kiln_efficiency').ebitdaRunRate * (1 + 0.012 * 40), 9)
    expect(at140.npv).toBeGreaterThan(at100.npv)
    const carbon = initiativeEconomics(init('carbon_capture_pilot'), withL({ L6: 120 }), data, 2028)
    expect(carbon.ebitda[5]).toBeCloseTo(
      init('carbon_capture_pilot').ebitdaRunRate * (1 + 0.08 * 120),
      9,
    )
  })

  it('discounts at the plan rate from 2027 and adds a terminal value of the multiple times 2031 EBITDA', () => {
    const pr = init('pricing_reset')
    const e = initiativeEconomics(pr, base(), data, 2027)
    // capex in 2027, EBITDA from 2027 on, terminal 5 x EBITDA discounted 5 years
    let expected = 0
    for (let t = 1; t <= 5; t++)
      expected += (pr.ebitdaRunRate - (t === 1 ? pr.capex : 0)) / Math.pow(1.1, t)
    expected += (5 * pr.ebitdaRunRate) / Math.pow(1.1, 5)
    expect(e.npv).toBeCloseTo(expected, 9)
  })
})

describe('portfolio selection', () => {
  it('never commits more than the envelope and reports headroom', () => {
    const p = run()
    const env = data.assumptions.scenarios.base.L3
    expect(p.capital.envelope).toBe(env)
    expect(p.capital.committed).toBeLessThanOrEqual(env)
    expect(p.capital.headroom).toBeCloseTo(env - p.capital.committed, 9)
    const committed = Object.values(p.entries)
      .filter((e) => e.status === 'in')
      .reduce((s, e) => s + e.capex, 0)
    expect(p.capital.committed).toBeCloseTo(committed, 9)
  })

  it('selects by NPV per unit of capex, so the cheapest high-return initiatives are in even at the smallest envelope', () => {
    const p = run(withL({ L3: 100 }))
    expect(p.entries.pricing_reset.status).toBe('in')
    expect(p.entries.logistics_contracting.status).toBe('in')
  })

  it('reducing the envelope defers viable initiatives, never removes them', () => {
    const full = run(withL({ L3: 600 }))
    const small = run(withL({ L3: 100 }))
    for (const [id, e] of Object.entries(full.entries)) {
      if (e.status === 'in') expect(['in', 'deferred']).toContain(small.entries[id].status)
      if (e.status === 'out') expect(small.entries[id].status).toBe('out')
    }
    const deferred = Object.values(small.entries).filter(
      (e) => e.status === 'deferred' && e.reason === 'capital',
    )
    expect(deferred.length).toBeGreaterThan(0)
  })

  it('funds every viable, value-creating initiative at the largest envelope', () => {
    const p = run(withL({ L3: 600 }))
    for (const e of Object.values(p.entries))
      expect(e.status === 'deferred' && e.reason === 'capital').toBe(false)
  })

  it('never violates dependencies in the selected set, across every preset', () => {
    for (const levers of Object.values(data.assumptions.scenarios)) {
      const p = run(levers)
      for (const i of data.initiatives.initiatives) {
        const e = p.entries[i.id]
        if (e.status !== 'in') continue
        for (const dep of i.dependencies) {
          expect(p.entries[dep].status).toBe('in')
          expect(e.startYear!).toBeGreaterThan(p.entries[dep].startYear!)
        }
      }
    }
  })

  it('gives capital-deferred initiatives an L3 trigger that, when applied, funds them', () => {
    const p = run(withL({ L3: 150 }))
    const deferred = Object.entries(p.entries).filter(
      ([, e]) => e.status === 'deferred' && e.reason === 'capital',
    )
    expect(deferred.length).toBeGreaterThan(0)
    for (const [id, e] of deferred) {
      expect(e.trigger?.leverId).toBe('L3')
      expect(e.trigger?.direction).toBe('above')
      expect(e.trigger!.threshold).toBeGreaterThan(150)
      expect(run(withL({ L3: e.trigger!.threshold })).entries[id].status).toBe('in')
    }
  })

  it('keeps the strategic trigger on out initiatives and reports capacity additions and the export flag', () => {
    const p = run()
    expect(p.entries.jeddah_export_terminal.status).toBe('out')
    expect(p.entries.jeddah_export_terminal.trigger).toEqual({
      leverId: 'L5',
      threshold: 2,
      direction: 'above',
    })
    const inIds = Object.entries(p.entries)
      .filter(([, e]) => e.status === 'in')
      .map(([id]) => id)
    expect([...p.selectedIds].sort()).toEqual([...inIds].sort())
    for (const add of p.additions) expect(inIds).toContain(add.initiativeId)
    if (inIds.includes('alkharj_kiln'))
      expect(p.additions.some((a) => a.initiativeId === 'alkharj_kiln')).toBe(true)
  })

  it('defers viable initiatives whose NPV is negative at the hurdle rate, with reason returns', () => {
    const p = run(withL({ L3: 600 }))
    expect(p.entries.western_quarry_acq.npv).toBeLessThan(0)
    expect(p.entries.western_quarry_acq.status).toBe('deferred')
    expect(p.entries.western_quarry_acq.reason).toBe('returns')
    // Carbon capture clears the hurdle once carbon is priced at the regulated level.
    const reg = run(withL({ L3: 600, L6: 120 }))
    expect(reg.entries.carbon_capture_pilot.status).toBe('in')
  })

  it('handles zero-capex initiatives by funding them first', () => {
    const d: PlanData = {
      ...data,
      initiatives: {
        ...data.initiatives,
        initiatives: data.initiatives.initiatives.map((i) =>
          i.id === 'bricks_choice' ? { ...i, rules: [] } : i,
        ),
      },
    }
    const p = run(withL({ L3: 100 }), d)
    expect(p.entries.bricks_choice.status).toBe('in')
    expect(p.entries.bricks_choice.startYear).toBe(2027)
  })

  it('sums per-year initiative capex, revenue and EBITDA impacts for the selected set', () => {
    const p = run()
    expect(p.impacts.capex).toHaveLength(YEARS.length)
    const total = p.impacts.capex.reduce((s, x) => s + x, 0)
    expect(total).toBeCloseTo(p.capital.committed, 6)
    expect(p.impacts.ebitda[5]).toBeGreaterThan(0)
  })
})
