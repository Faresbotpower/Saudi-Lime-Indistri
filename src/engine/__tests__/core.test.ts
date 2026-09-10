import { runCore } from '../core'
import { base, withL, data, YEARS } from './fixtures'

describe('core (steps 1 to 4 composed)', () => {
  it('reproduces base-case 2026 revenue and EBITDA within 0.5% on the Base preset', () => {
    const r = runCore(base(), data, [])
    const { revenue, ebitda } = data.assumptions.baseCase
    expect(Math.abs(r.baseBusiness.revenue[0] / revenue - 1)).toBeLessThan(0.005)
    expect(Math.abs(r.baseBusiness.ebitda[0] / ebitda - 1)).toBeLessThan(0.005)
  })

  it('exposes calibration factors that scale list prices and unit costs to the base year, and traces them', () => {
    const r = runCore(base(), data, [])
    expect(r.calibration.price).toBeGreaterThan(0.8)
    expect(r.calibration.price).toBeLessThan(1.3)
    expect(r.calibration.cost).toBeGreaterThan(0.8)
    expect(r.calibration.cost).toBeLessThan(1.5)
    expect(r.trace['calibration']).toBeDefined()
    expect(r.trace['calibration'].some((e) => e.assumptionKey === 'baseCase.revenue')).toBe(true)
  })

  it('computes revenue as served volume times calibrated price, domestic plus export', () => {
    const r = runCore(base(), data, [])
    const i = 3
    let expected = 0
    for (const fam of Object.keys(r.capacity.servedByFamily)) {
      const domestic =
        r.capacity.servedByFamily[fam][i] - (fam === 'lime' ? r.capacity.exportServed[i] : 0)
      expected += domestic * r.price.domesticPriceByFamily[fam][i] * r.calibration.price
    }
    expected += r.capacity.exportServed[i] * r.price.exportPrice[i] * r.calibration.price
    expect(r.baseBusiness.revenue[i]).toBeCloseTo(expected / 1000, 6)
  })

  it('grows base-business revenue every year on the Base preset', () => {
    const r = runCore(base(), data, [])
    for (let i = 1; i < YEARS.length; i++)
      expect(r.baseBusiness.revenue[i]).toBeGreaterThan(r.baseBusiness.revenue[i - 1])
  })

  it('L2 at 160 lowers EBITDA in every plan year and never raises it', () => {
    const b = runCore(base(), data, [])
    const hi = runCore(withL({ L2: 160 }), data, [])
    for (let i = 1; i < YEARS.length; i++)
      expect(hi.baseBusiness.ebitda[i]).toBeLessThan(b.baseBusiness.ebitda[i])
    expect(hi.baseBusiness.revenue).toEqual(b.baseBusiness.revenue)
  })

  it('pins the base year to the 2026 actuals under every preset', () => {
    for (const levers of Object.values(data.assumptions.scenarios)) {
      const r = runCore(levers, data, [], { exportTerminalSelected: true })
      expect(r.baseBusiness.revenue[0]).toBeCloseTo(data.assumptions.baseCase.revenue, 6)
      expect(r.baseBusiness.ebitda[0]).toBeCloseTo(data.assumptions.baseCase.ebitda, 6)
    }
  })

  it('regulated carbon cost lowers EBITDA through lime cost and charges export logistics on export tons', () => {
    const b = runCore(base(), data, [])
    const carbon = runCore(withL({ L6: 120 }), data, [])
    for (let i = 1; i < YEARS.length; i++)
      expect(carbon.baseBusiness.ebitda[i]).toBeLessThan(b.baseBusiness.ebitda[i])
    const noExport = runCore(withL({ L5: 0 }), data, [])
    // 2026 has no export tons, so the base year is identical; later years differ.
    expect(noExport.baseBusiness.ebitda[0]).toBeCloseTo(b.baseBusiness.ebitda[0], 9)
    expect(noExport.baseBusiness.revenue[3]).toBeLessThan(b.baseBusiness.revenue[3])
  })

  it('the Jeddah terminal flag flows through to demand so extended export volumes are served', () => {
    const without = runCore(withL({ L5: 2 }), data, [])
    const withTerminal = runCore(withL({ L5: 2 }), data, [], { exportTerminalSelected: true })
    expect(withTerminal.capacity.exportServed[3]).toBeGreaterThan(without.capacity.exportServed[3])
  })

  it('merges the traces of every step under distinct keys', () => {
    const r = runCore(base(), data, [])
    for (const key of [
      'demand.steel',
      'capacity.lime',
      'price.lime',
      'cost.lime',
      'calibration',
      'baseBusiness.revenue',
    ])
      expect(r.trace[key]).toBeDefined()
  })
})
