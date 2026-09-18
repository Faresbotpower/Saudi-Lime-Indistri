import type { useLevers } from '../../state/levers'
import { strings } from '../../strings'

export type Api = ReturnType<typeof useLevers.getState>
export type AnimateLever = (
  id: 'L2' | 'L3',
  from: number,
  to: number,
  step: number,
  ms: number,
) => void
export type Focus = (selector: string | null) => void
export type Action = { at: number; run: (api: Api, animate: AnimateLever, focus: Focus) => void }
export type Chapter = {
  title: string
  caption: string
  seconds: number
  focus?: string
  actions: Action[]
}

const T = strings.walkthrough
const tour = (id: string) => `[data-tour="${id}"]`
/** Reading pace: about eighteen characters a second, never under twelve seconds. */
const pace = (n: number) => Math.max(12, Math.round((T.captions[n - 1].length / 18) * 10) / 10)
const chapter = (n: number, actions: Action[], focus?: string): Chapter => ({
  title: T.titles[n - 1],
  caption: T.captions[n - 1],
  // A chapter outlasts its last action by three seconds, so every reset fires before the next chapter.
  seconds: Math.max(pace(n), ...actions.map((a) => a.at + 3)),
  focus,
  actions,
})

/** The walkthrough follows the approach: facts, shifts, objectives, scorecard, initiatives, projects, plans, model, then make it live. */
export const chapters: Chapter[] = [
  chapter(
    1,
    [
      {
        at: 0,
        run: (api) => {
          api.reset()
          api.clearActuals()
          api.closeInitiative()
          api.closeExplain()
          if (api.explain) api.toggleExplain()
          api.setBaselineOpen(false)
          api.setOpenShift(null)
          api.setTrackerMode('table')
          api.setView('direction')
        },
      },
    ],
    tour('tabs'),
  ),
  chapter(
    2,
    [
      { at: 0, run: (api) => api.setView('direction') },
      { at: 4, run: (api) => api.setOpenShift('S1') },
      { at: 14, run: (api) => api.setHoveredShift('S5') },
      { at: 15, run: (_a, _b, focus) => focus(tour('strata')) },
      {
        at: 24,
        run: (api) => {
          api.setHoveredShift(null)
          api.setOpenShift(null)
        },
      },
    ],
    tour('cascade'),
  ),
  chapter(
    3,
    [
      { at: 0, run: (api) => api.setView('scorecard') },
      { at: 8, run: (_api, animate) => animate('L2', 100, 140, 5, 1200) },
      { at: 18, run: (_a, _b, focus) => focus(tour('okrs')) },
      { at: 26, run: (api) => api.setLever('L2', 100) },
    ],
    tour('scorecard'),
  ),
  chapter(
    4,
    [
      { at: 0, run: (api) => api.setView('portfolio') },
      // Energy to 140: the PCC plant fails its rule (energy at or below 130) and slides from Deferred to Out.
      { at: 7, run: (_api, animate) => animate('L2', 100, 140, 5, 1600) },
      {
        at: 15,
        run: (api, _b, focus) => {
          focus(null)
          api.openInitiative('pcc_plant')
        },
      },
      {
        at: 27,
        run: (api) => {
          api.closeInitiative()
          api.setLever('L2', 100)
        },
      },
    ],
    tour('columns'),
  ),
  chapter(
    5,
    [
      { at: 0, run: (api) => api.setView('plans') },
      { at: 6, run: (_a, _b, focus) => focus('[data-testid="plan-operations"]') },
      { at: 10, run: (_api, animate) => animate('L2', 100, 140, 5, 1200) },
      { at: 20, run: (_a, _b, focus) => focus('[data-testid="plan-hr"]') },
      { at: 27, run: (api) => api.setLever('L2', 100) },
    ],
    tour('plans'),
  ),
  chapter(
    6,
    [
      { at: 0, run: (api) => api.setView('financials') },
      { at: 4, run: (_a, _b, focus) => focus(tour('main-chart')) },
      { at: 9, run: (_a, _b, focus) => focus(tour('pro-forma')) },
      {
        at: 17,
        run: (api, _b, focus) => {
          api.setDerivedEnvelope(true)
          focus(tour('envelope'))
        },
      },
      {
        at: 24,
        run: (api, _b, focus) => {
          api.setDerivedEnvelope(false)
          focus(tour('kpis'))
        },
      },
      { at: 25, run: (_api, animate) => animate('L2', 100, 140, 5, 1200) },
      { at: 32, run: (api) => api.setLever('L2', 100) },
    ],
    tour('baseline'),
  ),
  chapter(7, [{ at: 0, run: (api) => api.setView('roadmap') }], tour('gantt')),
  chapter(
    8,
    [
      { at: 0, run: (api) => api.setView('tracker') },
      { at: 4, run: (api) => api.setActual('L2', 140) },
      { at: 7, run: (_a, _b, focus) => focus(tour('triggers')) },
      { at: 13, run: (_a, _b, focus) => focus(tour('scorecard-rows')) },
      {
        at: 19,
        run: (api, _b, focus) => {
          api.setTrackerMode('quarterly')
          focus(tour('quarterly'))
        },
      },
      {
        at: 28,
        run: (api) => {
          api.clearActuals()
          api.setTrackerMode('table')
        },
      },
    ],
    tour('tracker'),
  ),
  chapter(
    9,
    [
      { at: 0, run: (api) => api.setView('portfolio') },
      {
        at: 2,
        run: (api) => {
          if (!api.explain) api.toggleExplain()
        },
      },
      {
        at: 5,
        run: (api, _b, focus) => {
          focus(null)
          api.openExplain('initiative.pcc_plant')
        },
      },
      {
        at: 16,
        run: (api, _b, focus) => {
          api.closeExplain()
          if (api.explain) api.toggleExplain()
          focus(tour('export'))
        },
      },
    ],
    tour('explain'),
  ),
  chapter(10, [
    {
      at: 0,
      run: (api) => {
        api.reset()
        api.setView('direction')
      },
    },
  ]),
]
