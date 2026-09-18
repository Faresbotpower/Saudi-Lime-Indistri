import { runCore } from './core'
import { leverGrid } from './rules'
import type { Levers, PlanData, Trace } from './types'

export type EnvelopeDerivation = {
  /** After-tax operating cash flow of the base business over the plan years, SAR m. */
  cashGenerated: number
  /** Maintenance capex plus the dividend floor over the plan years, SAR m. */
  committed: number
  maintenanceCapex: number
  dividends: number
  /** Debt capacity at the net debt ceiling, SAR m. */
  debtCapacity: number
  /** Available for growth: cash generated less committed plus debt capacity, rounded. */
  available: number
  envelope: number
  trace: Trace
}

/**
 * The capital envelope SLIC does not have yet, derived from the plan itself: what the base
 * business generates after tax, less what is committed to maintenance and dividends, plus the
 * debt the 2031 EBITDA carries at the ceiling. Parameters live in assumptions.envelopeRule.
 */
export function deriveEnvelope(levers: Levers, data: PlanData): EnvelopeDerivation {
  const a = data.assumptions
  const r = a.envelopeRule
  const core = runCore(levers, data, [], { selected: [] })
  const ebitda = core.baseBusiness.ebitda.slice(1)
  const sumEbitda = ebitda.reduce((s, x) => s + x, 0)
  const cashGenerated = sumEbitda * (1 - r.taxRate)
  const maintenanceCapex = a.baseCase.capex * a.planYears.length
  const dividends = sumEbitda * r.dividendFloorPctOfEbitda
  const committed = maintenanceCapex + dividends
  const debtCapacity = Math.max(0, r.maxNetDebtToEbitda * ebitda[ebitda.length - 1] - r.netDebt2026)
  const raw = cashGenerated - committed + debtCapacity
  const grid = leverGrid('L3', a)
  const [lo, hi] = [grid[0], grid[grid.length - 1]]
  const envelope = Math.min(hi, Math.max(lo, Math.round(raw / r.roundTo) * r.roundTo))
  const trace: Trace = {
    envelope: [
      {
        rule: 'envelope.cash',
        assumptionKey: 'envelopeRule.taxRate',
        value: Math.round(cashGenerated),
      },
      {
        rule: 'envelope.maintenance',
        assumptionKey: 'baseCase.capex',
        value: Math.round(maintenanceCapex),
      },
      {
        rule: 'envelope.dividends',
        assumptionKey: 'envelopeRule.dividendFloorPctOfEbitda',
        value: Math.round(dividends),
      },
      {
        rule: 'envelope.debt',
        assumptionKey: 'envelopeRule.maxNetDebtToEbitda',
        value: Math.round(debtCapacity),
      },
      { rule: 'envelope.derived', assumptionKey: 'envelopeRule.roundTo', value: envelope },
      { rule: 'cost.energy', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
    ],
  }
  return {
    cashGenerated,
    committed,
    maintenanceCapex,
    dividends,
    debtCapacity,
    available: raw,
    envelope,
    trace,
  }
}
