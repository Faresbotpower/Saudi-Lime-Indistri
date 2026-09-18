import { deriveEnvelope, runPlan, scenarioNameFor } from '../index'
import { runCore } from '../core'
import { base, withL, data } from './fixtures'

describe('derived capital envelope', () => {
  it('derives the envelope from after-tax cash, less maintenance and dividends, plus debt capacity', () => {
    const d = deriveEnvelope(base(), data)
    const r = data.assumptions.envelopeRule
    const ebitda = runCore(base(), data, []).baseBusiness.ebitda.slice(1)
    const sum = ebitda.reduce((s, x) => s + x, 0)
    expect(d.cashGenerated).toBeCloseTo(sum * (1 - r.taxRate), 6)
    expect(d.maintenanceCapex).toBe(data.assumptions.baseCase.capex * 5)
    expect(d.dividends).toBeCloseTo(sum * r.dividendFloorPctOfEbitda, 6)
    expect(d.debtCapacity).toBeCloseTo(
      Math.max(0, r.maxNetDebtToEbitda * ebitda[4] - r.netDebt2026),
      6,
    )
    expect(d.envelope % r.roundTo).toBe(0)
    expect(d.envelope).toBeGreaterThanOrEqual(100)
    expect(d.envelope).toBeLessThanOrEqual(600)
    expect(d.trace.envelope.length).toBeGreaterThan(3)
  })

  it('runs the plan on the derived envelope when L3 is set to Derived, and names the scenario Custom', () => {
    const r = runPlan(withL({ L3derived: true }), data)
    const d = deriveEnvelope(withL({ L3derived: true }), data)
    expect(r.capital.envelope).toBe(d.envelope)
    expect(r.envelopeDerivation?.envelope).toBe(d.envelope)
    expect(r.scenarioName).toBe('custom')
    expect(scenarioNameFor(withL({ L3derived: true }), data)).toBe('custom')
    expect(runPlan(base(), data).envelopeDerivation).toBeUndefined()
  })

  it('a dearer gas year lowers the derived envelope', () => {
    expect(deriveEnvelope(withL({ L2: 140 }), data).envelope).toBeLessThan(
      deriveEnvelope(base(), data).envelope,
    )
  })
})

describe('2026 pro forma on gas', () => {
  it('restates the base year with the gas price applied to the 2026 lime tons', () => {
    const r = runPlan(base(), data)
    const core = runCore(base(), data, [])
    const tons = core.capacity.servedByFamily.lime[0]
    const saving =
      ((core.cost.energyCostPerTonLimeByYear[0] - core.cost.energyCostPerTonLimeOnGas) *
        core.calibration.cost *
        tons) /
      1000
    expect(r.proForma2026.revenue).toBeCloseTo(r.financials.revenue[0], 9)
    expect(r.proForma2026.ebitda).toBeCloseTo(r.financials.ebitda[0] + saving, 9)
    expect(r.proForma2026.energySaving).toBeCloseTo(saving, 9)
    expect(r.proForma2026.ebitda).toBeGreaterThan(r.financials.ebitda[0])
    expect(r.proForma2026.energyCostPerTonLimeOnGas).toBeLessThan(
      r.proForma2026.energyCostPerTonLimeActual,
    )
  })

  it('reports the emissions path from the 2025 baseline, falling with the gas switch', () => {
    const r = runPlan(base(), data)
    expect(r.emissions.baseline.year).toBe(2025)
    expect(r.emissions.intensity).toHaveLength(6)
    expect(r.emissions.intensity[5]).toBeLessThan(r.emissions.intensity[0])
    expect(r.emissions.totalKt[0]).toBeGreaterThan(100)
    expect(r.emissions.roadmap.some((x) => x.id === 'gas-riyadh' && x.year === 2027)).toBe(true)
    expect(r.scorecard.find((k) => k.id === 'K15')!.live![5]).toBeCloseTo(
      r.emissions.intensity[5],
      9,
    )
  })
})

describe('no shared ownership wording', () => {
  it('keeps partnership and joint venture out of the data', () => {
    const text = JSON.stringify(data)
    for (const w of ['partnership', 'Partnership', 'joint venture', 'Joint venture', 'JV'])
      expect(text).not.toContain(w)
  })
})
