import { create } from 'zustand'
import {
  scenarioPresets,
  scenarioOrder,
  type LeverId,
  type LeverValues,
  type ScenarioId,
} from '../data'
import type { ViewId } from '../strings'

export type ScenarioName = ScenarioId | 'custom'

type LeversState = {
  levers: LeverValues
  scenario: ScenarioName
  view: ViewId
  explain: boolean
  hoveredLever: LeverId | null
  setLever: <K extends LeverId>(id: K, value: LeverValues[K]) => void
  applyPreset: (id: ScenarioId) => void
  reset: () => void
  setView: (view: ViewId) => void
  toggleExplain: () => void
  setHoveredLever: (id: LeverId | null) => void
}

const clone = (v: LeverValues): LeverValues => ({ ...v, L1: { ...v.L1 } })

const sameLevers = (a: LeverValues, b: LeverValues) =>
  a.L1.option === b.L1.option &&
  Math.abs(a.L1.multiplier - b.L1.multiplier) < 1e-9 &&
  a.L2 === b.L2 &&
  a.L3 === b.L3 &&
  a.L4 === b.L4 &&
  a.L5 === b.L5 &&
  a.L6 === b.L6

/** Name the scenario after a matching preset, otherwise Custom. */
export const scenarioFor = (levers: LeverValues): ScenarioName =>
  scenarioOrder.find((id) => sameLevers(levers, scenarioPresets[id])) ?? 'custom'

export const useLevers = create<LeversState>((set) => ({
  levers: clone(scenarioPresets.base),
  scenario: 'base',
  view: 'financials',
  explain: false,
  hoveredLever: null,
  setLever: (id, value) =>
    set((s) => {
      const levers = { ...s.levers, [id]: value } as LeverValues
      return { levers, scenario: scenarioFor(levers) }
    }),
  applyPreset: (id) => set({ levers: clone(scenarioPresets[id]), scenario: id }),
  reset: () => set({ levers: clone(scenarioPresets.base), scenario: 'base' }),
  setView: (view) => set({ view }),
  toggleExplain: () => set((s) => ({ explain: !s.explain })),
  setHoveredLever: (hoveredLever) => set({ hoveredLever }),
}))
