import type { useLevers } from '../../state/levers'
import { strings } from '../../strings'

export type Api = ReturnType<typeof useLevers.getState>

export type Action = { at: number; run: (api: Api, animate: AnimateLever) => void }
export type AnimateLever = (
  id: 'L2' | 'L3',
  from: number,
  to: number,
  step: number,
  ms: number,
) => void

export type Step = {
  audio: string
  title: string
  caption: string
  seconds: number
  actions: Action[]
}

const T = strings.walkthrough

/** The five-step demo story, timed to the narration audio. */
export const steps: Step[] = [
  {
    audio: '/walkthrough/step1.m4a',
    title: T.titles[0],
    caption: T.captions[0],
    seconds: 21,
    actions: [
      {
        at: 0,
        run: (api) => {
          api.reset()
          api.closeInitiative()
          api.setView('financials')
        },
      },
    ],
  },
  {
    audio: '/walkthrough/step2.m4a',
    title: T.titles[1],
    caption: T.captions[1],
    seconds: 25.6,
    actions: [
      { at: 1.5, run: (_api, animate) => animate('L2', 100, 140, 5, 1600) },
      { at: 13, run: (api) => api.setView('portfolio') },
    ],
  },
  {
    audio: '/walkthrough/step3.m4a',
    title: T.titles[2],
    caption: T.captions[2],
    seconds: 24.7,
    actions: [
      { at: 0.5, run: (api) => api.reset() },
      { at: 3.5, run: (api) => api.setLever('L5', 2) },
      { at: 13, run: (api) => api.openInitiative('jeddah_export_terminal') },
      { at: 23, run: (api) => api.closeInitiative() },
    ],
  },
  {
    audio: '/walkthrough/step4.m4a',
    title: T.titles[3],
    caption: T.captions[3],
    seconds: 14.6,
    actions: [
      { at: 0, run: (api) => api.setView('tracker') },
      { at: 3.5, run: (api) => api.setActual('L2', 140) },
    ],
  },
  {
    audio: '/walkthrough/step5.m4a',
    title: T.titles[4],
    caption: T.captions[4],
    seconds: 13.6,
    actions: [
      {
        at: 0,
        run: (api) => {
          api.clearActuals()
          api.reset()
          api.setView('direction')
        },
      },
      { at: 2.5, run: (api) => api.setHoveredLever('L3') },
      { at: 12.5, run: (api) => api.setHoveredLever(null) },
    ],
  },
]
