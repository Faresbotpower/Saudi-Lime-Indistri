import { useMemo } from 'react'
import { runPlan, type PlanResult } from '../engine'
import { planData, scenarioOrder, scenarioPresets, type ScenarioId } from '../data'
import { useLevers } from './levers'

/** The plan for the current levers. Recomputed synchronously whenever a lever moves. */
export function usePlan(): PlanResult {
  const levers = useLevers((s) => s.levers)
  return useMemo(() => runPlan(levers, planData), [levers])
}

let presetCache: Record<ScenarioId, PlanResult> | null = null

/** The four preset plans, computed once. */
export function presetPlans(): Record<ScenarioId, PlanResult> {
  if (!presetCache) {
    presetCache = Object.fromEntries(
      scenarioOrder.map((id) => [id, runPlan(scenarioPresets[id], planData)]),
    ) as Record<ScenarioId, PlanResult>
  }
  return presetCache
}
