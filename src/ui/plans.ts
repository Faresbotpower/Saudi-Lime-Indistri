import type { PlanResult, PlanRollup } from '../engine'
import { PLAN_IDS } from '../engine'
import type { LeverId, PlanId } from '../engine/types'
import { planData } from '../data'
import { strings } from '../strings'
import { pct1, sarm } from './format'

export type Kpi = {
  id: string
  label: string
  value: number
  base: number
  delta: number
  format: (v: number) => string
  goodWhenUp: boolean
}

export type PlanCard = {
  id: PlanId
  name: string
  deliverable: string
  kpis: Kpi[]
  rollup: PlanRollup
  levers: LeverId[]
  decisions: { id: string; name: string; from: string; to: string }[]
}

const kpi = (
  id: string,
  value: number,
  base: number,
  format: (v: number) => string,
  goodWhenUp = true,
): Kpi => ({
  id,
  label: strings.planKpi[id] ?? id,
  value,
  base,
  delta: value - base,
  format,
  goodWhenUp,
})
const money = (v: number) => `${sarm(v)} SAR m`
const sarT = (v: number) => `${Math.round(v)} SAR/t`
const pctOf = (v: number) => `${pct1(v)}%`
const kt = (v: number) => `${sarm(v)} kt`
const idx = (v: number) => `${v.toFixed(2)}x`
const people = (v: number) => `${sarm(v)} people`

/** The five functional plans as cards: what moves against Base, the roll-up, the levers that reach them and the decisions due. */
export function planCards(plan: PlanResult, base: PlanResult, tracked: PlanResult): PlanCard[] {
  const last = plan.years.length - 1
  const list = planData.initiatives.initiatives
  const name = Object.fromEntries(list.map((i) => [i.id, i.name]))
  const cap = (p: PlanResult) => p.sites.reduce((s, x) => s + x.capacity[last], 0)
  const kpisFor: Record<PlanId, Kpi[]> = {
    commercial: [
      kpi('revenue2031', plan.financials.revenue[last], base.financials.revenue[last], money),
      kpi('exportKt2031', plan.volumes.exportKt[last], base.volumes.exportKt[last], kt),
      kpi(
        'priceIndex2031',
        plan.volumes.priceIndexLime[last],
        base.volumes.priceIndexLime[last],
        idx,
      ),
      kpi('diversification', plan.diversificationShare2031, base.diversificationShare2031, pctOf),
    ],
    operations: [
      kpi(
        'utilization2031',
        plan.volumes.utilizationLime[last],
        base.volumes.utilizationLime[last],
        pctOf,
      ),
      kpi('capacity2031', cap(plan), cap(base), kt),
      kpi(
        'energyPerTon',
        plan.supplyChain.energyCostPerTonLime,
        base.supplyChain.energyCostPerTonLime,
        sarT,
        false,
      ),
      kpi(
        'logisticsPerTon',
        plan.supplyChain.exportLogisticsPerTon,
        base.supplyChain.exportLogisticsPerTon,
        sarT,
        false,
      ),
    ],
    ai: [
      kpi(
        'costPerTon2031',
        plan.people.costPerTon[last],
        base.people.costPerTon[last],
        sarT,
        false,
      ),
      kpi(
        'utilization2031',
        plan.volumes.utilizationLime[last],
        base.volumes.utilizationLime[last],
        pctOf,
      ),
    ],
    sustainability: [
      kpi(
        'carbonPerTon',
        plan.supplyChain.carbonCostPerTonLime,
        base.supplyChain.carbonCostPerTonLime,
        sarT,
        false,
      ),
      kpi(
        'energyPerTon',
        plan.supplyChain.energyCostPerTonLime,
        base.supplyChain.energyCostPerTonLime,
        sarT,
        false,
      ),
    ],
    hr: [
      kpi('headcount2031', plan.people.headcount[last], base.people.headcount[last], people),
      kpi('saudization2031', plan.people.saudization[last], base.people.saudization[last], pctOf),
    ],
  }
  const leversFor: Record<PlanId, LeverId[]> = {
    commercial: ['L1', 'L5'],
    operations: ['L1', 'L2', 'L3', 'L5'],
    ai: ['L2', 'L3'],
    sustainability: ['L6', 'L2'],
    hr: ['L1', 'L3'],
  }
  return PLAN_IDS.map((id) => {
    const rollup = plan.plans.find((p) => p.id === id)!
    const own = new Set(rollup.initiatives)
    return {
      id,
      name: strings.plans.names[id],
      deliverable: strings.plans.deliverables[id],
      kpis: kpisFor[id],
      rollup,
      levers: leversFor[id],
      decisions: tracked.triggersFired
        .filter((t) => own.has(t.id))
        .map((t) => ({
          id: t.id,
          name: name[t.id],
          from: strings.portfolio.columns[t.from],
          to: strings.portfolio.columns[t.to],
        })),
    }
  })
}
