export const chart = {
  ink: '#0a151e',
  navy: '#173044',
  teal: '#0f9c7e',
  tealBright: '#1de9b6',
  muted: '#a3a3a3',
  line: '#e4e4e1',
  sand2: '#efefec',
  coral: '#e4634f',
  amber: '#f2b24c',
  font: 'Inter, system-ui, sans-serif',
}

export const axisProps = {
  tick: { fontSize: 12, fill: '#6f7a85', fontFamily: chart.font },
  axisLine: false as const,
  tickLine: false as const,
}

import { prefersReducedMotion } from '../../format'

/** Recharts animation props. Lines redraw 250 ms after a lever change (the ripple order); off under reduced motion. */
export const chartAnimation = (begin = 0) =>
  prefersReducedMotion()
    ? { isAnimationActive: false }
    : {
        isAnimationActive: true,
        animationDuration: 500,
        animationBegin: begin,
        animationEasing: 'ease-out' as const,
      }
