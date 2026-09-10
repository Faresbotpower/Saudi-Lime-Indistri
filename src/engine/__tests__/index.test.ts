import { runPlan, scenarioNameFor, traceFor } from '../index'
import { base, withL, data, YEARS } from './fixtures'

describe('runPlan', () => {
  it('returns the full plan shape with the base year first', () => {
    const r = runPlan(base(), data)
    expect(r.years).toEqual(YEARS)
    expect(r.scenarioName).toBe('base')
    expect(r.financials.revenue).toHaveLength(6)
    expect(r.financials.ebitdaMargin).toHaveLength(6)
    expect(r.sites).toHaveLength(3)
    expect(r.people.headcount).toHaveLength(6)
    expect(r.classification.length).toBeGreaterThan(6)
    expect(r.initiatives).toHaveLength(data.initiatives.initiatives.length)
    expect(r.roadmap.layers).toHaveLength(5)
    expect(r.capital.envelope).toBe(600)
  })

  it('names the scenario after a matching preset and Custom otherwise', () => {
    expect(scenarioNameFor(data.assumptions.scenarios.downside, data)).toBe('downside')
    expect(scenarioNameFor(withL({ L2: 105 }), data)).toBe('custom')
    expect(runPlan(withL({ L2: 105 }), data).scenarioName).toBe('custom')
  })

  it('reproduces the base-case 2026 numbers within 0.5% on the Base preset', () => {
    const r = runPlan(base(), data)
    const b = data.assumptions.baseCase
    expect(Math.abs(r.financials.revenue[0] / b.revenue - 1)).toBeLessThan(0.005)
    expect(Math.abs(r.financials.ebitda[0] / b.ebitda - 1)).toBeLessThan(0.005)
    expect(Math.abs(r.financials.capex[0] / b.capex - 1)).toBeLessThan(0.005)
    expect(Math.abs(r.people.headcount[0] / b.headcount - 1)).toBeLessThan(0.005)
  })

  it('carries the Base case financials for delta chips, identical to its own financials on Base', () => {
    const r = runPlan(base(), data)
    expect(r.baseCase.revenue).toEqual(r.financials.revenue)
    const other = runPlan(withL({ L2: 140 }), data)
    expect(other.baseCase.ebitda).toEqual(r.financials.ebitda)
    expect(other.financials.ebitda[3]).toBeLessThan(other.baseCase.ebitda[3])
  })

  it('raising L2 to 160 lowers consolidated EBITDA in every plan year', () => {
    const b = runPlan(base(), data)
    const hi = runPlan(withL({ L2: 160 }), data)
    for (let i = 1; i < YEARS.length; i++)
      expect(hi.financials.ebitda[i]).toBeLessThan(b.financials.ebitda[i])
  })

  it('feeds classification back into the rules, so the bricks exit is viable and funded on Base', () => {
    const r = runPlan(base(), data)
    const bricks = r.initiatives.find((i) => i.id === 'bricks_exit')!
    expect(['harvest', 'exit']).toContain(
      r.classification.find((c) => c.id === 'bricks_mkt')!.category,
    )
    expect(bricks.status).toBe('in')
    expect(bricks.capex).toBe(0)
  })

  it('reports the diversification share of 2031 revenue from new products and markets', () => {
    const r = runPlan(base(), data)
    expect(r.diversificationShare2031).toBeGreaterThan(0)
    expect(r.diversificationShare2031).toBeLessThan(0.5)
    const none = runPlan(withL({ L3: 200, L5: 0 }), data)
    expect(none.diversificationShare2031).toBeLessThanOrEqual(r.diversificationShare2031)
  })

  it('has a trace behind every financial KPI, every initiative, every site and every classification cell', () => {
    const r = runPlan(base(), data)
    for (const k of ['revenue', 'ebitda', 'ebitdaMargin', 'capex', 'fcf', 'cumulativeFcf'])
      expect(traceFor(r, `financials.${k}`).length).toBeGreaterThan(0)
    for (const i of r.initiatives)
      expect(traceFor(r, `initiative.${i.id}`).length).toBeGreaterThan(0)
    for (const s of r.sites) expect(traceFor(r, `sites.${s.id}`).length).toBeGreaterThan(0)
    for (const c of r.classification)
      expect(traceFor(r, `classification.${c.id}`).length).toBeGreaterThan(0)
    for (const k of ['headcount', 'saudization', 'costPerTon'])
      expect(traceFor(r, `people.${k}`).length).toBeGreaterThan(0)
    expect(traceFor(r, 'capital').length).toBeGreaterThan(0)
    expect(traceFor(r, 'nothing.here')).toEqual([])
  })

  it('runs every preset without throwing and keeps utilization within bounds', () => {
    for (const levers of Object.values(data.assumptions.scenarios)) {
      const r = runPlan(levers, data)
      for (const s of r.sites)
        for (const u of s.utilization) expect(u).toBeLessThanOrEqual(1 + 1e-9)
      expect(r.capital.committed).toBeLessThanOrEqual(levers.L3 + 1e-9)
    }
  })

  it('is fast enough to run synchronously on every lever change', () => {
    const t0 = performance.now()
    for (let k = 0; k < 10; k++) runPlan(withL({ L2: 100 + k }), data)
    expect((performance.now() - t0) / 10).toBeLessThan(60)
  })
})
