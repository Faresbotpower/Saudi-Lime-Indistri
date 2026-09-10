import { computeDemand } from '../demand'
import { base, withL, assumptions, YEARS } from './fixtures'

describe('demand', () => {
  it('indexes years from the base year through 2031', () => {
    const d = computeDemand(base(), assumptions, { selected: [] })
    expect(d.years).toEqual(YEARS)
  })

  it('reproduces base volumes in the base year for every sector', () => {
    const d = computeDemand(base(), assumptions, { selected: [] })
    for (const s of assumptions.sectors) expect(d.bySector[s.id][0]).toBeCloseTo(s.baseVolumeKt, 6)
  })

  it('compounds growth scaled by the L1 multiplier and applies giga phasing by sensitivity', () => {
    const d = computeDemand(base(), assumptions, { selected: [] })
    // steel 2027: 410 * (1 + 0.045 * 1.0) ^ 1 * (1 + (1.00 - 1) * 0.3)
    expect(d.bySector.steel[1]).toBeCloseTo(410 * 1.045, 6)
    // steel 2028: 410 * 1.045 ^ 2 * (1 + (1.03 - 1) * 0.3)
    expect(d.bySector.steel[2]).toBeCloseTo(410 * 1.045 * 1.045 * 1.009, 6)
    // construction 2031: 1650 * 1.038^5 * (1 + (1.09 - 1) * 0.8)
    expect(d.bySector.construction[5]).toBeCloseTo(1650 * Math.pow(1.038, 5) * 1.072, 6)
  })

  it('uses the delayed phasing curve when L1 is delayed', () => {
    const d = computeDemand(withL({ L1: { option: 'delayed', multiplier: 1.0 } }), assumptions, {
      selected: [],
    })
    expect(d.bySector.construction[1]).toBeCloseTo(1650 * 1.038 * (1 + (0.92 - 1) * 0.8), 6)
  })

  it('lower L1 multiplier lowers demand for every positive-growth sector in every plan year', () => {
    const hi = computeDemand(base(), assumptions, { selected: [] })
    const lo = computeDemand(withL({ L1: { option: 'onPlan', multiplier: 0.7 } }), assumptions, {
      selected: [],
    })
    for (const s of assumptions.sectors.filter((x) => x.growth > 0))
      for (let i = 1; i < YEARS.length; i++)
        expect(lo.bySector[s.id][i]).toBeLessThan(hi.bySector[s.id][i])
  })

  it('aggregates domestic demand by product family, folding dololime into lime', () => {
    const d = computeDemand(base(), assumptions, { selected: [] })
    expect(Object.keys(d.domesticByFamily).sort()).toEqual([
      'bricks',
      'carbonate',
      'lime',
      'limestone',
    ])
    expect(d.domesticByFamily.lime[0]).toBeCloseTo(410 + 95 + 130 + 60, 6)
  })

  it('adds no export demand when L5 is domestic', () => {
    const d = computeDemand(withL({ L5: 0 }), assumptions, { selected: [] })
    expect(d.exportKt).toEqual([0, 0, 0, 0, 0, 0])
    expect(d.exportLevel).toBe(0)
  })

  it('adds GCC export potential when L5 is GCC and the GCC sales initiative is selected, zero in the base year', () => {
    const d = computeDemand(withL({ L5: 1 }), assumptions, { selected: ['gcc_export_sales'] })
    expect(d.exportKt).toEqual([0, 20, 45, 70, 90, 100])
    const none = computeDemand(withL({ L5: 1 }), assumptions, { selected: [] })
    expect(none.exportKt).toEqual([0, 0, 0, 0, 0, 0])
    expect(none.exportLevel).toBe(0)
  })

  it('caps extended export at the GCC level until the Jeddah terminal is selected', () => {
    const without = computeDemand(withL({ L5: 2 }), assumptions, { selected: ['gcc_export_sales'] })
    const withTerminal = computeDemand(withL({ L5: 2 }), assumptions, {
      selected: ['gcc_export_sales', 'jeddah_export_terminal'],
    })
    expect(without.exportKt).toEqual([0, 20, 45, 70, 90, 100])
    expect(without.exportLevel).toBe(1)
    expect(withTerminal.exportKt).toEqual([0, 20, 60, 120, 180, 230])
    expect(withTerminal.exportLevel).toBe(2)
  })

  it('traces sector demand to the L1 lever and the growth assumption', () => {
    const d = computeDemand(base(), assumptions, { selected: [] })
    const t = d.trace['demand.steel']
    expect(t.some((e) => e.leverId === 'L1')).toBe(true)
    expect(t.some((e) => e.assumptionKey === 'sectors.steel.growth')).toBe(true)
  })
})
