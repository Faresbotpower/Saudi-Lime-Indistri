import assumptionsJson from '../data/assumptions.json'
import initiativesJson from '../data/initiatives.json'
import objectivesJson from '../data/objectives.json'

export type LeverOptionValue = string
export type L1Value = { option: 'delayed' | 'onPlan' | 'accelerated'; multiplier: number }

export type LeverValues = {
  L1: L1Value
  L2: number
  L3: number
  /** Envelope derived from the plan by the envelope rule; L3 is ignored while true. */
  L3derived?: boolean
  L4: number
  L5: number
  L6: number
}

export type LeverId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'

export type LeverDef = {
  id: LeverId
  name: string
  type: 'segmented_plus_slider' | 'slider' | 'segmented'
  options?: string[]
  values?: number[]
  sliderRange?: [number, number]
  range?: [number, number]
  step?: number
  unit?: string
  default: number | L1Value
  moves: string[]
  description: string
  /** Named settings on a slider lever. */
  marks?: { value: number; key: string }[]
  /** The lever can be derived from the plan (capital envelope). */
  derived?: boolean
}

export type ScenarioId = 'base' | 'growth' | 'upside' | 'downside'

export const assumptions = assumptionsJson as unknown as typeof assumptionsJson & {
  levers: LeverDef[]
  scenarios: Record<ScenarioId, LeverValues>
}
export const initiatives = initiativesJson
export const objectives = objectivesJson as unknown as ObjectivesData

export const leverDefs: LeverDef[] = assumptions.levers
export const scenarioPresets: Record<ScenarioId, LeverValues> = assumptions.scenarios
export const scenarioOrder: ScenarioId[] = ['base', 'growth', 'upside', 'downside']

import type { ObjectivesData, PlanData } from './engine/types'

/** The three data files as the engine expects them. The only place numbers live. */
export const planData: PlanData = {
  assumptions: assumptionsJson as unknown as PlanData['assumptions'],
  initiatives: initiativesJson as unknown as PlanData['initiatives'],
  objectives: objectivesJson as unknown as ObjectivesData,
}
