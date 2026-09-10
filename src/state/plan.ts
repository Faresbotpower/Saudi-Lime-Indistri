import { useMemo } from 'react'
import { runPlan, type PlanResult } from '../engine'
import type { PlanData } from '../engine/types'
import { planData, scenarioOrder, scenarioPresets, type ScenarioId } from '../data'
import { useLevers } from './levers'
import { applyOverrides, type Overrides } from './overrides'

const mergedCache = new Map<string, PlanData>()

/** The data files with the typed overrides applied. Same object for the same overrides. */
export function dataFor(overrides: Overrides): PlanData {
  const key = JSON.stringify(overrides)
  let d = mergedCache.get(key)
  if (!d) {
    d = applyOverrides(planData, overrides)
    if (mergedCache.size > 20) mergedCache.clear()
    mergedCache.set(key, d)
  }
  return d
}

export function useData(): PlanData {
  const overrides = useLevers((s) => s.overrides)
  return useMemo(() => dataFor(overrides), [overrides])
}

/** The plan for the current levers and inputs. Recomputed synchronously whenever either moves. */
export function usePlan(): PlanResult {
  const levers = useLevers((s) => s.levers)
  const data = useData()
  return useMemo(() => runPlan(levers, data), [levers, data])
}

/** The plan with the tracker actuals applied to the elapsed year. Same as usePlan when nothing is typed. */
export function useTrackedPlan(): PlanResult {
  const levers = useLevers((s) => s.levers)
  const actuals = useLevers((s) => s.actuals)
  const data = useData()
  const year = data.assumptions.tracker.editableYear
  return useMemo(
    () => runPlan(levers, data, { actuals: { year, ...actuals } }),
    [levers, actuals, data, year],
  )
}

const presetCache = new WeakMap<PlanData, Record<ScenarioId, PlanResult>>()

/** The four preset plans for a data set, computed once per data set. */
export function presetPlans(data: PlanData = planData): Record<ScenarioId, PlanResult> {
  let plans = presetCache.get(data)
  if (!plans) {
    plans = Object.fromEntries(
      scenarioOrder.map((id) => [id, runPlan(scenarioPresets[id], data)]),
    ) as Record<ScenarioId, PlanResult>
    presetCache.set(data, plans)
  }
  return plans
}
