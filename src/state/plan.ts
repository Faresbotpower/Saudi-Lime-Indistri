import { useMemo } from 'react'
import { runPlan, type PlanResult } from '../engine'
import { planData, scenarioOrder, scenarioPresets, type ScenarioId } from '../data'
import { useLevers } from './levers'

/** The plan for the current levers. Recomputed synchronously whenever a lever moves. */
export function usePlan(): PlanResult {
  const levers = useLevers((s) => s.levers)
  return useMemo(() => runPlan(levers, planData), [levers])
}

/** The plan with the tracker actuals applied to the elapsed year. Same as usePlan when nothing is typed. */
export function useTrackedPlan(): PlanResult {
  const levers = useLevers((s) => s.levers)
  const actuals = useLevers((s) => s.actuals)
  const year = planData.assumptions.tracker.editableYear
  return useMemo(
    () => runPlan(levers, planData, { actuals: { year, ...actuals } }),
    [levers, actuals, year],
  )
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
