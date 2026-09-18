import { consolidate, isVolumeInitiative } from '../consolidate'
import { runCore } from '../core'
import { selectPortfolio } from '../portfolio'
import { evaluateViability, contextFor } from '../viability'
import { base, withL, data, YEARS } from './fixtures'
import type { Levers } from '../types'

const run = (levers: Levers = base()) => {
  const v = evaluateViability(levers, data, (l) => contextFor(l, data))
  const p = selectPortfolio(levers, data, v)
  return { p, c: consolidate(levers, data, p) }
}

describe('consolidation', () => {
  it('reproduces the 2026 actuals for revenue, EBITDA, capex, headcount, Saudization and cost per ton', () => {
    const { c } = run()
    const b = data.assumptions.baseCase
    expect(c.financials.revenue[0]).toBeCloseTo(b.revenue, 6)
    expect(c.financials.ebitda[0]).toBeCloseTo(b.ebitda, 6)
    expect(c.financials.capex[0]).toBeCloseTo(b.capex, 6)
    expect(c.people.headcount[0]).toBeCloseTo(b.headcount, 6)
    expect(c.people.saudization[0]).toBeCloseTo(b.saudization, 6)
    expect(c.people.costPerTon[0]).toBeCloseTo(data.assumptions.people.baseCostPerTonAllIn, 0)
  })

  it('classifies capacity and export initiatives as volume-modelled, others as run-rate', () => {
    const byId = Object.fromEntries(data.initiatives.initiatives.map((i) => [i.id, i]))
    expect(isVolumeInitiative(byId.alkharj_kiln, data)).toBe(true)
    expect(isVolumeInitiative(byId.gcc_export_sales, data)).toBe(true)
    expect(isVolumeInitiative(byId.jeddah_export_terminal, data)).toBe(true)
    expect(isVolumeInitiative(byId.pricing_reset, data)).toBe(false)
    expect(isVolumeInitiative(byId.pcc_plant, data)).toBe(false)
  })

  it('adds run-rate revenue for non-volume initiatives on top of the volume-modelled base, with no double count', () => {
    const { p, c } = run()
    const core2 = runCore(base(), data, p.additions, { selected: p.selectedIds })
    const byId = Object.fromEntries(data.initiatives.initiatives.map((i) => [i.id, i]))
    for (let i = 0; i < YEARS.length; i++) {
      let runRate = 0
      for (const id of p.selectedIds)
        if (!isVolumeInitiative(byId[id], data)) runRate += p.economics[id].revenue[i]
      expect(c.financials.revenue[i]).toBeCloseTo(core2.baseBusiness.revenue[i] + runRate, 6)
      expect(c.split.baseRevenue[i] + c.split.initiativeRevenue[i]).toBeCloseTo(
        c.financials.revenue[i],
        6,
      )
    }
    expect(c.split.initiativeRevenue[3]).toBeGreaterThan(0)
  })

  it('derives capex, working capital, FCF and cumulative FCF by the plan formulas', () => {
    const { p, c } = run()
    const f = c.financials
    const wcPct = data.assumptions.workingCapitalPctOfRevenueDelta
    for (let i = 1; i < YEARS.length; i++) {
      expect(f.capex[i]).toBeCloseTo(data.assumptions.baseCase.capex + p.impacts.capex[i], 6)
      const wc = wcPct * (f.revenue[i] - f.revenue[i - 1])
      expect(f.fcf[i]).toBeCloseTo(f.ebitda[i] - f.capex[i] - wc, 6)
      expect(f.ebitdaMargin[i]).toBeCloseTo(f.ebitda[i] / f.revenue[i], 9)
    }
    let cum = 0
    for (let i = 1; i < YEARS.length; i++) {
      cum += f.fcf[i]
      expect(f.cumulativeFcf[i]).toBeCloseTo(cum, 6)
    }
    expect(f.cumulativeFcf[0]).toBe(0)
  })

  it('moves headcount with volume and non-volume initiative deltas, and ramps Saudization with the workforce initiative', () => {
    const { p, c } = run()
    expect(p.entries.workforce_productivity.status).toBe('in')
    expect(c.people.saudization[5]).toBeCloseTo(0.52, 9)
    expect(c.people.saudization[1]).toBeGreaterThan(0.41)
    expect(c.people.saudization[1]).toBeLessThan(0.52)
    expect(c.people.headcount[5]).not.toBeCloseTo(1180, 0)
    const noWorkforce = run(withL({ L3: 100 }))
    if (noWorkforce.p.entries.workforce_productivity.status !== 'in')
      expect(noWorkforce.c.people.saudization[5]).toBeCloseTo(0.41, 9)
  })

  it('reports each site with capacity, utilization and phased capex, and grows Al Kharj when its kiln is in', () => {
    const { p, c } = run()
    expect(c.sites.map((s) => s.id)).toEqual(['riyadh', 'alkharj', 'jeddah'])
    for (const s of c.sites) {
      expect(s.capacity).toHaveLength(6)
      expect(s.utilization).toHaveLength(6)
      expect(s.capex).toHaveLength(6)
    }
    const alkharj = c.sites.find((s) => s.id === 'alkharj')!
    if (p.entries.alkharj_kiln.status === 'in')
      expect(alkharj.capacity[5]).toBeGreaterThan(alkharj.capacity[0])
    // Site capex sums to the plan capex every year.
    for (let i = 0; i < YEARS.length; i++)
      expect(c.sites.reduce((s, x) => s + x.capex[i], 0)).toBeCloseTo(c.financials.capex[i], 6)
  })

  it('a larger envelope commits more capex over the plan', () => {
    const small = run(withL({ L3: 100 })).c
    const large = run(withL({ L3: 600 })).c
    const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
    expect(sum(large.financials.capex)).toBeGreaterThan(sum(small.financials.capex))
  })

  it('traces revenue, EBITDA, FCF and headcount', () => {
    const { c } = run()
    for (const k of [
      'financials.revenue',
      'financials.ebitda',
      'financials.fcf',
      'people.headcount',
      'people.saudization',
    ])
      expect(c.trace[k]).toBeDefined()
  })
})
