import { computeDemand } from '../demand'
import { computeCapacity } from '../capacity'
import { base, withL, assumptions, YEARS } from './fixtures'
import type { CapacityAddition } from '../types'

const demandFor = (levers = base(), terminal = false) =>
  computeDemand(levers, assumptions, {
    selected: terminal ? ['gcc_export_sales', 'jeddah_export_terminal'] : ['gcc_export_sales'],
  })

describe('capacity and utilization', () => {
  it('sums site capacity by family, folding dololime into lime', () => {
    const c = computeCapacity(demandFor(), assumptions, [])
    const sum = (k: string) => assumptions.sites.reduce((s, x) => s + (x.capacityKt[k] ?? 0), 0)
    expect(c.capacityByFamily.lime).toEqual(new Array(6).fill(sum('lime') + sum('dololime')))
    expect(c.capacityByFamily.limestone).toEqual(new Array(6).fill(sum('limestone')))
    expect(c.capacityByFamily.carbonate).toEqual(new Array(6).fill(sum('gcc')))
    expect(c.capacityByFamily.bricks).toEqual(new Array(6).fill(sum('bricks')))
  })

  it('ramps initiative capacity linearly from its start year', () => {
    const add: CapacityAddition = {
      initiativeId: 'alkharj_kiln',
      product: 'lime',
      kt: 200,
      startYear: 2028,
      rampYears: 2,
      site: 'alkharj',
    }
    const c = computeCapacity(demandFor(), assumptions, [add])
    const baseLime = assumptions.sites.reduce(
      (s, x) => s + (x.capacityKt.lime ?? 0) + (x.capacityKt.dololime ?? 0),
      0,
    )
    expect(c.capacityByFamily.lime).toEqual([
      baseLime,
      baseLime,
      baseLime + 100,
      baseLime + 200,
      baseLime + 200,
      baseLime + 200,
    ])
    const alkharj = assumptions.sites.find((s) => s.id === 'alkharj')!.capacityKt
    expect(c.capacityBySite.alkharj.lime[3]).toBeCloseTo(
      (alkharj.lime ?? 0) + (alkharj.dololime ?? 0) + 200,
      6,
    )
  })

  it('reproduces each site base utilization in the base year', () => {
    const c = computeCapacity(demandFor(), assumptions, [])
    for (const s of assumptions.sites)
      expect(c.utilizationBySite[s.id][0]).toBeCloseTo(s.baseUtilization, 6)
  })

  it('never serves more than capacity and never exceeds utilization 1', () => {
    const c = computeCapacity(
      demandFor(withL({ L1: { option: 'accelerated', multiplier: 1.3 }, L5: 2 }), true),
      assumptions,
      [],
    )
    for (const fam of Object.keys(c.capacityByFamily))
      for (let i = 0; i < YEARS.length; i++) {
        expect(c.servedByFamily[fam][i]).toBeLessThanOrEqual(c.capacityByFamily[fam][i] + 1e-9)
        expect(c.utilizationByFamily[fam][i]).toBeLessThanOrEqual(1 + 1e-9)
      }
  })

  it('raises lime utilization when demand grows and lowers it when capacity is added', () => {
    const c = computeCapacity(demandFor(), assumptions, [])
    expect(c.utilizationByFamily.lime[5]).toBeGreaterThan(c.utilizationByFamily.lime[0])
    const add: CapacityAddition = {
      initiativeId: 'x',
      product: 'lime',
      kt: 400,
      startYear: 2027,
      rampYears: 1,
      site: 'riyadh',
    }
    const c2 = computeCapacity(demandFor(), assumptions, [add])
    expect(c2.utilizationByFamily.lime[5]).toBeLessThan(c.utilizationByFamily.lime[5])
  })

  it('serves export from Jeddah first, so a higher export ambition lifts Jeddah utilization most', () => {
    const gcc = computeCapacity(demandFor(withL({ L5: 1 })), assumptions, [])
    const ext = computeCapacity(demandFor(withL({ L5: 2 }), true), assumptions, [])
    // 2028: Jeddah still has spare lime capacity, so the extra export lands there.
    const lift = (id: string) => ext.utilizationBySite[id][2] - gcc.utilizationBySite[id][2]
    expect(lift('jeddah')).toBeGreaterThan(0)
    expect(lift('jeddah')).toBeGreaterThan(lift('riyadh'))
    expect(lift('jeddah')).toBeGreaterThan(lift('alkharj'))
  })

  it('exposes central and western lime utilization for viability rules', () => {
    const c = computeCapacity(demandFor(), assumptions, [])
    expect(c.utilizationByRegionFamily.central.lime).toHaveLength(6)
    expect(c.utilizationByRegionFamily.western.lime).toHaveLength(6)
    expect(c.utilizationByRegionFamily.central.lime[0]).toBeGreaterThan(0.7)
  })

  it('records the demand calibration factor that anchors 2026 sales to base utilization', () => {
    const c = computeCapacity(demandFor(), assumptions, [])
    expect(c.demandCalibration.lime).toBeGreaterThan(1)
    expect(c.trace['capacity.calibration.lime']).toBeDefined()
  })
})
