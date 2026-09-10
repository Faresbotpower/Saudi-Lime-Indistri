import type { PlanResult } from '../engine'
import type { LeverId } from '../engine/types'
import { planData } from '../data'
import { strings } from '../strings'
import { pct1, sarm } from './format'

export type FunctionId =
  'commercial' | 'operations' | 'supply' | 'finance' | 'people' | 'sustainability' | 'executive'

export const FUNCTIONS: { id: FunctionId; levers: LeverId[] }[] = [
  { id: 'commercial', levers: ['L1', 'L5'] },
  { id: 'operations', levers: ['L1', 'L3', 'L5'] },
  { id: 'supply', levers: ['L2', 'L5', 'L6'] },
  { id: 'finance', levers: ['L2', 'L3', 'L6'] },
  { id: 'people', levers: ['L1', 'L3'] },
  { id: 'sustainability', levers: ['L6', 'L2'] },
  { id: 'executive', levers: ['L3', 'L4', 'L5'] },
]

const OWNER: Record<string, FunctionId> = {
  'VP Commercial': 'commercial',
  COO: 'operations',
  'Plant Director Riyadh': 'operations',
  'Plant Director Jeddah': 'operations',
  'Plant Director Al Kharj': 'operations',
  'VP Supply Chain': 'supply',
  CFO: 'finance',
  CHRO: 'people',
  'Head of Sustainability': 'sustainability',
  CEO: 'executive',
}

export const functionOf = (owner: string): FunctionId => OWNER[owner] ?? 'executive'

export type Kpi = {
  id: string
  label: string
  value: number
  base: number
  delta: number
  format: (v: number) => string
  goodWhenUp: boolean
}
export type FunctionCard = {
  id: FunctionId
  name: string
  rfq: string
  kpis: Kpi[]
  initiatives: {
    id: string
    name: string
    status: 'in' | 'deferred' | 'out'
    startYear?: number
    reason?: string
  }[]
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
  label: strings.functions.kpi[id] ?? id,
  value,
  base,
  delta: value - base,
  format,
  goodWhenUp,
})
const sum = (xs: number[]) => xs.slice(1).reduce((s, x) => s + x, 0)
const money = (v: number) => `${sarm(v)} SAR m`
const sarT = (v: number) => `${Math.round(v)} SAR/t`
const pctOf = (v: number) => `${pct1(v)}%`
const kt = (v: number) => `${sarm(v)} kt`
const idx = (v: number) => `${v.toFixed(2)}x`
const people = (v: number) => `${sarm(v)} people`

/** What the current scenario means for each function, against the Base plan. Decisions come from the tracked plan. */
export function functionImpacts(
  plan: PlanResult,
  base: PlanResult,
  tracked: PlanResult,
): FunctionCard[] {
  const last = plan.years.length - 1
  const list = planData.initiatives.initiatives
  const status = Object.fromEntries(plan.initiatives.map((i) => [i.id, i]))
  const count = (s: string) => plan.initiatives.filter((i) => i.status === s).length
  const countBase = (s: string) => base.initiatives.filter((i) => i.status === s).length
  const cap = (p: PlanResult) => p.sites.reduce((s, x) => s + x.capacity[last], 0)
  const name = Object.fromEntries(list.map((i) => [i.id, i.name]))

  const kpisFor: Record<FunctionId, Kpi[]> = {
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
        'costPerTon2031',
        plan.people.costPerTon[last],
        base.people.costPerTon[last],
        sarT,
        false,
      ),
    ],
    supply: [
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
      kpi('exportKt2031', plan.volumes.exportKt[last], base.volumes.exportKt[last], kt),
    ],
    finance: [
      kpi('ebitda2031', plan.financials.ebitda[last], base.financials.ebitda[last], money),
      kpi(
        'margin2031',
        plan.financials.ebitdaMargin[last],
        base.financials.ebitdaMargin[last],
        pctOf,
      ),
      kpi('cumCapex', sum(plan.financials.capex), sum(base.financials.capex), money, false),
      kpi(
        'cumFcf',
        plan.financials.cumulativeFcf[last],
        base.financials.cumulativeFcf[last],
        money,
      ),
      kpi('headroom', plan.capital.headroom, base.capital.headroom, money),
    ],
    people: [
      kpi('headcount2031', plan.people.headcount[last], base.people.headcount[last], people),
      kpi('saudization2031', plan.people.saudization[last], base.people.saudization[last], pctOf),
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
    executive: [
      kpi('inPlan', count('in'), countBase('in'), (v) => String(Math.round(v))),
      kpi(
        'deferred',
        count('deferred'),
        countBase('deferred'),
        (v) => String(Math.round(v)),
        false,
      ),
      kpi('out', count('out'), countBase('out'), (v) => String(Math.round(v)), false),
      kpi('diversification', plan.diversificationShare2031, base.diversificationShare2031, pctOf),
    ],
  }

  return FUNCTIONS.map((f) => ({
    id: f.id,
    name: strings.functions.names[f.id],
    rfq: strings.functions.rfqs[f.id],
    kpis: kpisFor[f.id],
    initiatives: list
      .filter((i) => functionOf(i.owner) === f.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        status: status[i.id].status,
        startYear: status[i.id].startYear,
        reason: status[i.id].reason,
      })),
    levers: f.levers,
    decisions: tracked.triggersFired
      .filter(
        (t) =>
          functionOf(list.find((i) => i.id === t.id)?.owner ?? '') === f.id || f.id === 'executive',
      )
      .map((t) => ({
        id: t.id,
        name: name[t.id] ?? t.id,
        from: strings.portfolio.columns[t.from],
        to: strings.portfolio.columns[t.to],
      })),
  }))
}
