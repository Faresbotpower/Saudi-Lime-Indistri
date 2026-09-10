import assumptionsJson from '../data/assumptions.json'
import initiativesJson from '../data/initiatives.json'

export type LeverOptionValue = string
export type L1Value = { option: 'delayed' | 'onPlan' | 'accelerated'; multiplier: number }

export type LeverValues = {
  L1: L1Value
  L2: number
  L3: number
  L4: number
  L5: number
  L6: number
}

export type LeverId = keyof LeverValues

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
}

export type ScenarioId = 'base' | 'growth' | 'upside' | 'downside'

export const assumptions = assumptionsJson as unknown as typeof assumptionsJson & {
  levers: LeverDef[]
  scenarios: Record<ScenarioId, LeverValues>
}
export const initiatives = initiativesJson

export const leverDefs: LeverDef[] = assumptions.levers
export const scenarioPresets: Record<ScenarioId, LeverValues> = assumptions.scenarios
export const scenarioOrder: ScenarioId[] = ['base', 'growth', 'upside', 'downside']

import type { PlanData } from './engine/types'

/** The two data files as the engine expects them. The only place numbers live. */
export const planData: PlanData = {
  assumptions: assumptionsJson as unknown as PlanData['assumptions'],
  initiatives: initiativesJson as unknown as PlanData['initiatives'],
}
