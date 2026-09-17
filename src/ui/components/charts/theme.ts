export const chart = {
  ink: '#0a151e',
  navy: '#244f52',
  teal: '#318c71',
  tealBright: '#83ddc4',
  muted: '#879c95',
  line: '#e3e9e3',
  sand2: '#efefec',
  coral: '#e4634f',
  amber: '#f2b24c',
  font: 'Manrope, system-ui, sans-serif',
}

export const axisProps = {
  tick: { fontSize: 13, fill: '#62716b', fontFamily: chart.font },
  axisLine: false as const,
  tickLine: false as const,
  tickMargin: 10,
}

import { prefersReducedMotion } from '../../format'

/** Recharts animation props. Lines redraw 250 ms after a lever change (the ripple order); off under reduced motion. */
export const chartAnimation = (begin = 0) =>
  prefersReducedMotion()
    ? { isAnimationActive: false }
    : {
        isAnimationActive: true,
        animationDuration: 450,
        animationBegin: begin,
        animationEasing: 'ease-out' as const,
      }
