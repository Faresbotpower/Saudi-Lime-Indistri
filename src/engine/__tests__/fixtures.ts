import assumptionsJson from '../../../data/assumptions.json'
import initiativesJson from '../../../data/initiatives.json'
import objectivesJson from '../../../data/objectives.json'
import type { Assumptions, InitiativeData, Levers, ObjectivesData, PlanData } from '../types'

export const assumptions = assumptionsJson as unknown as Assumptions
export const initiatives = initiativesJson as unknown as InitiativeData
export const objectives = objectivesJson as unknown as ObjectivesData
export const data: PlanData = { assumptions, initiatives, objectives }

export const base = (): Levers => ({
  ...assumptions.scenarios.base,
  L1: { ...assumptions.scenarios.base.L1 },
})
export const withL = (patch: Partial<Levers>): Levers => ({ ...base(), ...patch })

export const YEARS = [2026, 2027, 2028, 2029, 2030, 2031]
