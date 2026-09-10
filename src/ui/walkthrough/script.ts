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
const chapter = (n: number, seconds: number, actions: Action[], focus?: string): Chapter => ({
  title: T.titles[n - 1],
  caption: T.captions[n - 1],
  seconds,
  focus,
  actions,
})

/** The explainer: what STRATA is and how each part works. Each chapter runs for a reading pace in seconds. */
export const chapters: Chapter[] = [
  chapter(1, 23.3, [
    {
      at: 0,
      run: (api) => {
        api.reset()
        api.clearActuals()
        api.closeInitiative()
        api.closeExplain()
        if (api.explain) api.toggleExplain()
        api.setInputsOpen('L2', false)
        api.setView('financials')
      },
    },
  ]),
  chapter(
    2,
    24.1,
    [
      { at: 7, run: (api) => api.applyPreset('growth') },
      { at: 11.5, run: (api) => api.applyPreset('base') },
      { at: 16, run: (_api, animate) => animate('L2', 100, 120, 5, 800) },
      { at: 21, run: (api) => api.setLever('L2', 100) },
    ],
    tour('rail'),
  ),
  chapter(
    3,
    32,
    [
      { at: 1, run: (api) => api.setInputsOpen('L2', true) },
      { at: 2, run: (_a, _b, focus) => focus('[data-testid="inputs-L2"]') },
      {
        at: 10,
        run: (api) => {
          // Type natural gas at 9 SAR per MMBtu: the index becomes 138 and every view recomputes.
          api.setOverride('energy.fuel.gasSarPerMmbtu', 9)
          api.setLever('L2', 138)
        },
      },
      { at: 14, run: (_a, _b, focus) => focus(tour('kpis')) },
      { at: 20, run: (_a, _b, focus) => focus('[data-testid="inputs-L2"]') },
      {
        at: 27,
        run: (api) => {
          api.resetOverrides()
          api.setLever('L2', 100)
          api.setInputsOpen('L2', false)
        },
      },
    ],
    tour('rail'),
  ),
  chapter(
    4,
    28.7,
    [
      { at: 12, run: (_a, _b, focus) => focus(tour('tabs')) },
      { at: 24, run: (_a, _b, focus) => focus(null) },
    ],
    tour('main-chart'),
  ),
  chapter(
    5,
    23.1,
    [
      { at: 0, run: (api) => api.setView('financials') },
      { at: 8, run: (_a, _b, focus) => focus(tour('main-chart')) },
      { at: 12, run: (_api, animate) => animate('L2', 100, 125, 5, 900) },
      { at: 14, run: (_a, _b, focus) => focus(tour('kpis')) },
      { at: 21.5, run: (api) => api.setLever('L2', 100) },
    ],
    tour('kpis'),
  ),
  chapter(
    6,
    30,
    [
      { at: 0, run: (api) => api.setView('portfolio') },
      // Energy to 140: the PCC plant fails its rule (energy at or below 130) and slides from Deferred to Out.
      { at: 8, run: (_api, animate) => animate('L2', 100, 140, 5, 1600) },
      { at: 15, run: (_a, _b, focus) => focus(tour('capital')) },
      {
        at: 19,
        run: (api, _b, focus) => {
          focus(null)
          api.openInitiative('pcc_plant')
        },
      },
      {
        at: 28,
        run: (api) => {
          api.closeInitiative()
          api.setLever('L2', 100)
        },
      },
    ],
    tour('columns'),
  ),
  chapter(
    7,
    23.3,
    [
      { at: 0, run: (api) => api.setView('direction') },
      { at: 5, run: (api) => api.setHoveredLever('L3') },
      { at: 14, run: (api) => api.setHoveredLever(null) },
      { at: 14.5, run: (_a, _b, focus) => focus(tour('matrix')) },
      { at: 19.5, run: (_a, _b, focus) => focus(tour('class-table')) },
    ],
    tour('strata'),
  ),
  chapter(
    8,
    18.7,
    [
      { at: 0, run: (api) => api.setView('operations') },
      { at: 2.5, run: (_a, _b, focus) => focus(tour('sites')) },
      { at: 12, run: (_a, _b, focus) => focus(tour('people')) },
    ],
    tour('scrubber'),
  ),
  chapter(9, 18.2, [{ at: 0, run: (api) => api.setView('roadmap') }], tour('gantt')),
  chapter(
    10,
    14,
    [
      { at: 0, run: (api) => api.setView('tracker') },
      { at: 4, run: (api) => api.setActual('L2', 140) },
      { at: 7.5, run: (_a, _b, focus) => focus(tour('triggers')) },
    ],
    tour('tracker'),
  ),
  chapter(
    11,
    28,
    [
      {
        at: 0,
        run: (api) => {
          api.clearActuals()
          api.setView('functions')
        },
      },
      // Energy to 140 again: every function card shows where the shock lands against Base.
      { at: 5, run: (_api, animate) => animate('L2', 100, 140, 5, 1200) },
      { at: 9, run: (_a, _b, focus) => focus('[data-testid="function-finance"]') },
      { at: 15, run: (_a, _b, focus) => focus('[data-testid="function-supply"]') },
      { at: 20, run: (_a, _b, focus) => focus('[data-testid="function-executive"]') },
      { at: 26, run: (api) => api.setLever('L2', 100) },
    ],
    tour('functions'),
  ),
  chapter(
    12,
    15.6,
    [
      { at: 0, run: (api) => api.setView('financials') },
      {
        at: 3.5,
        run: (api) => {
          if (!api.explain) api.toggleExplain()
        },
      },
      { at: 6, run: (_a, _b, focus) => focus(tour('kpis')) },
      {
        at: 8.5,
        run: (api, _b, focus) => {
          focus(null)
          api.openExplain('financials.ebitdaMargin')
        },
      },
      {
        at: 14.5,
        run: (api) => {
          api.closeExplain()
          if (api.explain) api.toggleExplain()
        },
      },
    ],
    tour('explain'),
  ),
  chapter(13, 18, [], tour('export')),
  chapter(14, 14, [
    {
      at: 0,
      run: (api) => {
        api.reset()
        api.setView('financials')
      },
    },
  ]),
]
