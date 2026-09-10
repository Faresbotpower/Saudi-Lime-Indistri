import { create } from 'zustand'
import {
  scenarioPresets,
  scenarioOrder,
  type LeverId,
  type LeverValues,
  type ScenarioId,
} from '../data'
import type { ViewId } from '../strings'

export type ActualInputs = { L1multiplier?: number; L2?: number; L6?: number }

const ENTERED_KEY = 'strata-entered'
const readEntered = (): boolean => {
  try {
    return window.sessionStorage.getItem(ENTERED_KEY) === '1'
  } catch {
    return false
  }
}
const writeEntered = (v: boolean) => {
  try {
    if (v) window.sessionStorage.setItem(ENTERED_KEY, '1')
    else window.sessionStorage.removeItem(ENTERED_KEY)
  } catch {
    /* private mode */
  }
}

export type ScenarioName = ScenarioId | 'custom'

type LeversState = {
  levers: LeverValues
  scenario: ScenarioName
  view: ViewId
  explain: boolean
  hoveredLever: LeverId | null
  /** Levers lit by a hover elsewhere (the Strata reveal), so the rail can answer. */
  litLevers: LeverId[]
  /** Tracker actuals for the elapsed year; empty until typed. */
  actuals: ActualInputs
  /** Trace key open in the Explain sheet. */
  explainKey: string | null
  /** Cover page shown until the user enters; comes back from the wordmark. */
  showCover: boolean
  /** Initiative sheet open in the Growth portfolio. */
  openInitiativeId: string | null
  /** Auto-pilot walkthrough with voice-over. */
  walkthrough: { active: boolean; step: number }
  setLever: <K extends LeverId>(id: K, value: LeverValues[K]) => void
  applyPreset: (id: ScenarioId) => void
  reset: () => void
  setView: (view: ViewId) => void
  toggleExplain: () => void
  setHoveredLever: (id: LeverId | null) => void
  setLitLevers: (ids: LeverId[]) => void
  setActual: (key: keyof ActualInputs, value: number | undefined) => void
  clearActuals: () => void
  openExplain: (key: string) => void
  closeExplain: () => void
  enter: () => void
  goHome: () => void
  openInitiative: (id: string) => void
  closeInitiative: () => void
  startWalkthrough: () => void
  setWalkthroughStep: (step: number) => void
  stopWalkthrough: () => void
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
  litLevers: [],
  actuals: {},
  explainKey: null,
  showCover: !readEntered(),
  openInitiativeId: null,
  walkthrough: { active: false, step: 0 },
  setLever: (id, value) =>
    set((s) => {
      const levers = { ...s.levers, [id]: value } as LeverValues
      return { levers, scenario: scenarioFor(levers) }
    }),
  applyPreset: (id) => set({ levers: clone(scenarioPresets[id]), scenario: id }),
  reset: () => set({ levers: clone(scenarioPresets.base), scenario: 'base', actuals: {} }),
  setView: (view) => set({ view }),
  toggleExplain: () => set((s) => ({ explain: !s.explain })),
  setHoveredLever: (hoveredLever) => set({ hoveredLever }),
  setLitLevers: (litLevers) => set({ litLevers }),
  setActual: (key, value) =>
    set((s) => {
      const actuals = { ...s.actuals }
      if (value === undefined || Number.isNaN(value)) delete actuals[key]
      else actuals[key] = value
      return { actuals }
    }),
  clearActuals: () => set({ actuals: {} }),
  openExplain: (explainKey) => set({ explainKey }),
  closeExplain: () => set({ explainKey: null }),
  enter: () => {
    writeEntered(true)
    set({ showCover: false })
  },
  goHome: () => {
    writeEntered(false)
    set({
      showCover: true,
      walkthrough: { active: false, step: 0 },
      explainKey: null,
      openInitiativeId: null,
    })
  },
  openInitiative: (openInitiativeId) => set({ openInitiativeId }),
  closeInitiative: () => set({ openInitiativeId: null }),
  startWalkthrough: () => {
    writeEntered(true)
    set({
      showCover: false,
      walkthrough: { active: true, step: 0 },
      explainKey: null,
      openInitiativeId: null,
    })
  },
  setWalkthroughStep: (step) => set({ walkthrough: { active: true, step } }),
  stopWalkthrough: () =>
    set({ walkthrough: { active: false, step: 0 }, hoveredLever: null, openInitiativeId: null }),
}))
