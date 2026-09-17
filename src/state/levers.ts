import { create } from 'zustand'
import {
  scenarioPresets,
  scenarioOrder,
  type LeverId,
  type LeverValues,
  type ScenarioId,
} from '../data'
import type { ViewId } from '../strings'
import type { Overrides } from './overrides'

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
  /** Shift hovered in the cascade band; lights the strata like a lever hover. */
  hoveredShift: string | null
  /** The 2026 baseline sheet on the Financial plan. */
  baselineOpen: boolean
  /** Shift expanded in the cascade band. */
  openShift: string | null
  /** Tracker mode: the plan-against-actual table or the quarterly review. */
  trackerMode: 'table' | 'quarterly'
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
  /** Auto-pilot walkthrough. */
  walkthrough: { active: boolean; step: number }
  /** Typed assumption values by dotted path, applied on top of the data files. */
  overrides: Overrides
  /** Which Inputs disclosures are open, by lever id or base. */
  inputsOpen: Record<string, boolean>
  /** The printable report is mounted only while printing. */
  printing: boolean
  setLever: <K extends LeverId>(id: K, value: LeverValues[K]) => void
  applyPreset: (id: ScenarioId) => void
  reset: () => void
  setView: (view: ViewId) => void
  toggleExplain: () => void
  setHoveredLever: (id: LeverId | null) => void
  setHoveredShift: (id: string | null) => void
  setBaselineOpen: (open: boolean) => void
  setOpenShift: (id: string | null) => void
  setTrackerMode: (mode: 'table' | 'quarterly') => void
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
  setOverride: (path: string, value: number | undefined) => void
  resetOverrides: (paths?: string[]) => void
  setInputsOpen: (id: string, open: boolean) => void
  setAllInputsOpen: (open: boolean) => void
  setPrinting: (printing: boolean) => void
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
  view: 'direction',
  explain: false,
  hoveredLever: null,
  hoveredShift: null,
  baselineOpen: false,
  openShift: null,
  trackerMode: 'table',
  litLevers: [],
  actuals: {},
  explainKey: null,
  showCover:
    !readEntered() &&
    !(typeof window !== 'undefined' && /[?&]print=1/.test(window.location.search)),
  openInitiativeId: null,
  walkthrough: { active: false, step: 0 },
  overrides: {},
  inputsOpen: {},
  printing: typeof window !== 'undefined' && /[?&]print=1/.test(window.location.search),
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
  setHoveredShift: (hoveredShift) => set({ hoveredShift }),
  setBaselineOpen: (baselineOpen) => set({ baselineOpen }),
  setOpenShift: (openShift) => set({ openShift }),
  setTrackerMode: (trackerMode) => set({ trackerMode }),
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
      overrides: {},
      inputsOpen: {},
      printing: typeof window !== 'undefined' && /[?&]print=1/.test(window.location.search),
      explainKey: null,
      openInitiativeId: null,
      baselineOpen: false,
      hoveredShift: null,
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
  setOverride: (path, value) =>
    set((s) => {
      const overrides = { ...s.overrides }
      if (value === undefined || Number.isNaN(value)) delete overrides[path]
      else overrides[path] = value
      return { overrides }
    }),
  setPrinting: (printing) => set({ printing }),
  setAllInputsOpen: (open) =>
    set({
      inputsOpen: Object.fromEntries(
        ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'base'].map((id) => [id, open]),
      ),
    }),
  setInputsOpen: (id, open) => set((s) => ({ inputsOpen: { ...s.inputsOpen, [id]: open } })),
  resetOverrides: (paths) =>
    set((s) => {
      if (!paths) return { overrides: {} }
      const overrides = { ...s.overrides }
      for (const p of paths) delete overrides[p]
      return { overrides }
    }),
  stopWalkthrough: () =>
    set({
      walkthrough: { active: false, step: 0 },
      hoveredLever: null,
      hoveredShift: null,
      openInitiativeId: null,
      baselineOpen: false,
    }),
}))
