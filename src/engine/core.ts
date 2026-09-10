import { computeDemand, type DemandOptions } from './demand'
import { computeCapacity } from './capacity'
import { computePrice } from './price'
import { computeCost } from './cost'
import type { CapacityAddition, CoreResult, Levers, PlanData, Trace } from './types'
import { zeros } from './years'

/**
 * Pipeline steps 1 to 4 composed for the base business (no initiative P&L impacts yet).
 *
 * Calibration: list prices and unit costs in the data do not reproduce the 2026 actuals on
 * their own, so two factors, computed once under the Base preset, scale price and all-in
 * cost to baseCase.revenue and baseCase.ebitda. Carbon cost and export logistics are direct
 * costs added after calibration. Both factors are written to the trace.
 */
export function runCore(
  levers: Levers,
  data: PlanData,
  additions: CapacityAddition[],
  opts: DemandOptions = { selected: [] },
): CoreResult {
  const a = data.assumptions
  const demand = computeDemand(levers, a, opts)
  const capacity = computeCapacity(demand, a, additions)
  const price = computePrice(levers, capacity, a)
  const cost = computeCost(levers, a)

  const calibration = calibrate(data)
  const n = demand.years.length
  const revenue = zeros(n)
  const costSeries = zeros(n)
  const ebitda = zeros(n)
  const volumeKt = zeros(n)

  for (let i = 0; i < n; i++) {
    let rev = 0
    let c = 0
    let vol = 0
    for (const fam of Object.keys(capacity.servedByFamily)) {
      const served = capacity.servedByFamily[fam][i]
      const exp = fam === 'lime' ? capacity.exportServed[i] : 0
      const domestic = served - exp
      rev += domestic * price.domesticPriceByFamily[fam][i] * calibration.price
      rev += exp * price.exportPrice[i] * calibration.price
      const carbon = fam === 'lime' && i > 0 ? cost.carbonCostPerTonLime : 0
      const unit = (cost.costPerTonByFamily[fam][i] - carbon) * calibration.cost + carbon
      c += served * unit
      c += exp * cost.exportLogisticsPerTon
      vol += served
    }
    revenue[i] = rev / 1000
    costSeries[i] = c / 1000
    ebitda[i] = revenue[i] - costSeries[i]
    volumeKt[i] = vol
  }

  const trace: Trace = {
    ...demand.trace,
    ...capacity.trace,
    ...price.trace,
    ...cost.trace,
    calibration: [
      { rule: 'calibration.price', assumptionKey: 'baseCase.revenue', value: a.baseCase.revenue },
      { rule: 'calibration.price', assumptionKey: 'calibration.price', value: calibration.price },
      { rule: 'calibration.cost', assumptionKey: 'baseCase.ebitda', value: a.baseCase.ebitda },
      { rule: 'calibration.cost', assumptionKey: 'calibration.cost', value: calibration.cost },
    ],
    'baseBusiness.revenue': [
      { rule: 'revenue.volumeTimesPrice', assumptionKey: 'capacity.served', value: volumeKt[0] },
      {
        rule: 'revenue.volumeTimesPrice',
        assumptionKey: 'L1',
        leverId: 'L1',
        value: levers.L1.multiplier,
      },
      { rule: 'revenue.volumeTimesPrice', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
      {
        rule: 'revenue.volumeTimesPrice',
        assumptionKey: 'calibration.price',
        value: calibration.price,
      },
    ],
    'baseBusiness.ebitda': [
      { rule: 'ebitda.revenueMinusCost', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'ebitda.revenueMinusCost', assumptionKey: 'L6', leverId: 'L6', value: levers.L6 },
      {
        rule: 'ebitda.revenueMinusCost',
        assumptionKey: 'calibration.cost',
        value: calibration.cost,
      },
    ],
  }

  return {
    years: demand.years,
    demand,
    capacity,
    price,
    cost,
    calibration,
    baseBusiness: { revenue, cost: costSeries, ebitda, volumeKt },
    trace,
  }
}

/** Price and cost factors that make the Base preset reproduce the 2026 actuals. */
export function calibrate(data: PlanData): { price: number; cost: number } {
  const a = data.assumptions
  const baseLevers = a.scenarios.base
  const demand = computeDemand(baseLevers, a, { selected: [] })
  const capacity = computeCapacity(demand, a, [])
  const price = computePrice(baseLevers, capacity, a)
  const cost = computeCost(baseLevers, a)
  let rev = 0
  let c = 0
  for (const fam of Object.keys(capacity.servedByFamily)) {
    const served = capacity.servedByFamily[fam][0]
    rev += served * price.domesticPriceByFamily[fam][0]
    c +=
      served * (cost.costPerTonByFamily[fam][0] - (fam === 'lime' ? cost.carbonCostPerTonLime : 0))
  }
  rev /= 1000
  c /= 1000
  return {
    price: rev > 0 ? a.baseCase.revenue / rev : 1,
    cost: c > 0 ? (a.baseCase.revenue - a.baseCase.ebitda) / c : 1,
  }
}
