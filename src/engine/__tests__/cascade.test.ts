import { describe, expect, it } from 'vitest'
import { runPlan } from '../index'
import { data, withL, YEARS } from './fixtures'

const inits = data.initiatives.initiatives
const objectives = data.objectives.objectives
const kpis = data.objectives.scorecard.kpis

describe('cascade data', () => {
  it('every objective is reachable from an initiative and every initiative feeds an objective', () => {
    const ids = new Set(objectives.map((o) => o.id))
    for (const i of inits) {
      expect(i.objectives.length, `${i.id} has no objective`).toBeGreaterThan(0)
      for (const o of i.objectives) expect(ids.has(o), `${i.id} references unknown ${o}`).toBe(true)
    }
    for (const o of objectives)
      expect(
        inits.some((i) => i.objectives.includes(o.id)),
        `${o.id} has no initiative`,
      ).toBe(true)
  })

  it('every objective belongs to a shift, has an owner, a target year, a perspective and two or three OKRs', () => {
    const shifts = new Set(data.objectives.shifts.map((s) => s.id))
    expect(data.objectives.shifts.length).toBeGreaterThanOrEqual(6)
    expect(data.objectives.shifts.length).toBeLessThanOrEqual(10)
    expect(objectives.length).toBeGreaterThanOrEqual(12)
    expect(objectives.length).toBeLessThanOrEqual(15)
    for (const o of objectives) {
      expect(shifts.has(o.shift)).toBe(true)
      expect(o.owner).toBeTruthy()
      expect(o.target.year).toBeGreaterThanOrEqual(2027)
      expect(data.objectives.scorecard.perspectives).toContain(o.perspective)
      expect(o.okrs.length).toBeGreaterThanOrEqual(2)
      expect(o.okrs.length).toBeLessThanOrEqual(3)
    }
  })

  it('project capex sums to the initiative capex, two to four projects each', () => {
    for (const i of inits) {
      expect(i.projects.length, i.id).toBeGreaterThanOrEqual(2)
      expect(i.projects.length, i.id).toBeLessThanOrEqual(4)
      const sum = i.projects.reduce((s, p) => s + p.capex, 0)
      expect(sum, `${i.id} project capex`).toBeCloseTo(i.capex, 6)
      for (const p of i.projects) expect(p.startYear).toBeGreaterThanOrEqual(i.startYearEarliest)
    }
  })

  it('every initiative names one of the five plans and a requirements block', () => {
    for (const i of inits) {
      expect(['commercial', 'operations', 'ai', 'sustainability', 'hr']).toContain(i.plan)
      expect(i.requirements.capex).toBe(i.capex)
      expect(i.requirements.decisions.length).toBeGreaterThan(0)
    }
  })

  it('initiative KPI ids resolve to scorecard KPIs', () => {
    const ids = new Set(kpis.map((k) => k.id))
    for (const i of inits)
      for (const k of i.kpis) if (/^K\d+$/.test(k)) expect(ids.has(k), `${i.id} ${k}`).toBe(true)
    expect(inits.some((i) => i.kpis.some((k) => /^K\d+$/.test(k)))).toBe(true)
  })

  it('scorecard has fifteen to twenty KPIs across four perspectives with lead indicators', () => {
    expect(kpis.length).toBeGreaterThanOrEqual(15)
    expect(kpis.length).toBeLessThanOrEqual(20)
    for (const p of data.objectives.scorecard.perspectives)
      expect(kpis.some((k) => k.perspective === p)).toBe(true)
    expect(kpis.filter((k) => k.lead).length).toBeGreaterThanOrEqual(3)
  })
})

describe('cascade roll-up', () => {
  const base = runPlan(withL({}), data)

  it('rolls status, capex and timing down to projects and up to the five plans', () => {
    expect(base.plans.map((p) => p.id)).toEqual([
      'commercial',
      'operations',
      'ai',
      'sustainability',
      'hr',
    ])
    const projects = base.plans.flatMap((p) => p.projects)
    expect(projects.length).toBe(inits.reduce((s, i) => s + i.projects.length, 0))
    const inPlanCapex = projects.filter((p) => p.status === 'in').reduce((s, p) => s + p.capex, 0)
    expect(inPlanCapex).toBeCloseTo(base.capital.committed, 6)
    for (const p of base.plans) {
      expect(p.capexByYear).toHaveLength(YEARS.length)
      const phased = p.capexByYear.reduce((s, x) => s + x, 0)
      const inCapex = p.projects.filter((x) => x.status === 'in').reduce((s, x) => s + x.capex, 0)
      expect(phased).toBeCloseTo(inCapex, 6)
    }
    const status = Object.fromEntries(base.initiatives.map((i) => [i.id, i]))
    for (const p of projects) {
      expect(p.status).toBe(status[p.initiativeId].status)
      if (p.status === 'in')
        expect(p.startYear).toBeGreaterThanOrEqual(status[p.initiativeId].startYear!)
    }
  })

  it('a deferred initiative shifts its projects to the year it would start', () => {
    const late = runPlan(withL({ L3: 400 }), data)
    const status = Object.fromEntries(late.initiatives.map((i) => [i.id, i]))
    const moved = late.plans
      .flatMap((p) => p.projects)
      .filter((p) => status[p.initiativeId].startYear && status[p.initiativeId].startYear! > 2027)
    expect(moved.length).toBeGreaterThan(0)
    for (const p of moved) {
      const def = inits.find((i) => i.id === p.initiativeId)!.projects.find((x) => x.id === p.id)!
      expect(p.startYear - def.startYear).toBe(
        status[p.initiativeId].startYear! -
          inits.find((i) => i.id === p.initiativeId)!.startYearEarliest,
      )
    }
  })

  it('flags objectives on track, at risk or unfunded from their initiatives', () => {
    const byId = Object.fromEntries(base.objectives.map((o) => [o.id, o]))
    expect(base.objectives).toHaveLength(objectives.length)
    for (const o of base.objectives) {
      const feeding = o.initiatives.map((i) => i.status)
      expect(feeding.length).toBeGreaterThan(0)
      if (feeding.every((s) => s !== 'in')) expect(o.status).toBe('unfunded')
      else if (feeding.every((s) => s === 'in')) expect(o.status).toBe('on_track')
      else expect(o.status).toBe('at_risk')
    }
    expect(byId.O3.status).toBe('on_track')
  })

  it('rolls the requirements and headcount up to each plan', () => {
    const hr = base.plans.find((p) => p.id === 'hr')!
    const status = Object.fromEntries(base.initiatives.map((i) => [i.id, i]))
    const expected = inits
      .filter((i) => i.plan === 'hr' && status[i.id].status === 'in')
      .reduce((s, i) => s + i.headcountDelta, 0)
    expect(hr.headcountDelta).toBe(expected)
    expect(hr.requirements.decisions.length).toBeGreaterThan(0)
    expect(hr.requirements.people.length).toBeGreaterThan(0)
  })

  it('reads live scorecard values from the engine where computedFrom exists', () => {
    const row = (id: string) => base.scorecard.find((k) => k.id === id)!
    expect(base.scorecard).toHaveLength(kpis.length)
    const margin = row('K1')
    expect(margin.live![5]).toBeCloseTo(base.financials.ebitdaMargin[5] * 100, 6)
    expect(margin.live![0]).toBeCloseTo(20, 0)
    expect(row('K2').live![5]).toBeCloseTo(base.financials.revenue[5], 6)
    expect(row('K16').live![5]).toBe(100)
    expect(row('K16').lead).toBe(true)
    expect(row('K13').live).toBeUndefined()
    for (const k of base.scorecard) if (k.live) expect(k.live).toHaveLength(YEARS.length)
    expect(row('K19').live![5]).toBeCloseTo(
      (base.volumes.servedKt[5] * 1000) / base.people.headcount[5],
      6,
    )
  })

  it('a lever move reaches the scorecard', () => {
    const hot = runPlan(withL({ L2: 140 }), data)
    expect(hot.scorecard.find((k) => k.id === 'K16')!.live![5]).toBe(140)
    expect(hot.scorecard.find((k) => k.id === 'K1')!.live![5]).toBeLessThan(
      base.scorecard.find((k) => k.id === 'K1')!.live![5],
    )
  })

  it('records a trace for objectives, plans and KPIs', () => {
    expect(base.trace['objective.O1']?.length).toBeGreaterThan(0)
    expect(base.trace['plan.commercial']?.length).toBeGreaterThan(0)
    expect(base.trace['kpi.K1']?.length).toBeGreaterThan(0)
  })
})

describe('housekeeping', () => {
  it('keeps the Base case where the brief pins it', () => {
    const b = runPlan(withL({}), data)
    // Scaled to a company of SLIC's size: 300 to about 435 revenue, 60 to about 155 EBITDA.
    expect(Math.round(b.financials.revenue[0])).toBe(300)
    expect(b.financials.revenue[5]).toBeGreaterThan(400)
    expect(b.financials.revenue[5]).toBeLessThan(490)
    expect(Math.round(b.financials.ebitda[0])).toBe(60)
    expect(b.financials.ebitda[5]).toBeGreaterThan(130)
    expect(b.financials.ebitda[5]).toBeLessThan(180)
    expect(b.financials.cumulativeFcf[5]).toBeGreaterThan(250)
    expect(b.financials.cumulativeFcf[5]).toBeLessThan(400)
    expect(b.capital.committed).toBe(175)
    expect(b.capital.envelope).toBe(250)
  })

  it('reads East Africa and South Asia as grow at Base logistics', () => {
    const ext = runPlan(withL({ L5: 2 }), data)
    expect(ext.classification.find((c) => c.id === 'export_extended')!.category).toBe('grow')
  })

  it('offers the Riyadh kiln replacement as a strategic choice on energy and capital', () => {
    const b = runPlan(withL({}), data)
    expect(b.initiatives.find((i) => i.id === 'riyadh_kiln_replace')!.status).toBe('out')
    const hot = runPlan(withL({ L2: 140, L3: 600 }), data)
    expect(hot.initiatives.find((i) => i.id === 'riyadh_kiln_replace')!.status).toBe('in')
    const tight = runPlan(withL({ L2: 140, L3: 100 }), data)
    expect(tight.initiatives.find((i) => i.id === 'riyadh_kiln_replace')!.status).toBe('deferred')
  })
})
