import assumptionsJson from '../../../data/assumptions.json'
import initiativesJson from '../../../data/initiatives.json'
import type { Assumptions, InitiativeData, Levers, PlanData } from '../types'

export const assumptions = assumptionsJson as unknown as Assumptions
export const initiatives = initiativesJson as unknown as InitiativeData
export const data: PlanData = { assumptions, initiatives }

export const base = (): Levers => ({
  ...assumptions.scenarios.base,
  L1: { ...assumptions.scenarios.base.L1 },
})
export const withL = (patch: Partial<Levers>): Levers => ({ ...base(), ...patch })

export const YEARS = [2026, 2027, 2028, 2029, 2030, 2031]
