import type { PlanInitiative, Trigger } from '../engine'
import { leverDefs, type LeverId } from '../data'
import { strings } from '../strings'

const fmt = new Intl.NumberFormat('en-US')

/** Human label for a lever value on its own scale. */
export function leverValueLabel(id: LeverId, value: number): string {
  const def = leverDefs.find((d) => d.id === id)!
  switch (id) {
    case 'L1':
      return `${value.toFixed(2)}x`
    case 'L2':
      return `${value}`
    case 'L3':
      return `SAR ${fmt.format(value)}m`
    default: {
      const idx = def.values!.indexOf(value)
      if (idx < 0 && id === 'L6') return `SAR ${fmt.format(value)}/t`
      const opt = def.options![idx] ?? String(value)
      const labels = strings.levers[id as 'L4' | 'L5' | 'L6'].options as Record<string, string>
      return labels[opt] ?? opt
    }
  }
}

/** One line: "Becomes viable if export ambition ≥ Extended", "Funded once envelope ≥ SAR 650m (SAR 50m more)". */
export function triggerSentence(init: PlanInitiative, currentL3: number): string {
  const T = strings.portfolio.trigger
  const t = init.trigger
  if (init.status === 'deferred' && init.reason === 'returns')
    return strings.portfolio.reason.returns
  if (init.status === 'deferred' && init.reason === 'dependency')
    return strings.portfolio.reason.dependency
  if (!t) return T.noBoundary
  const lever = strings.levers.short[t.leverId]
  const cmp = t.direction === 'above' ? '≥' : '≤'
  const value = leverValueLabel(t.leverId, t.threshold)
  if (init.status === 'out') return `${T.becomesViable} ${lever} ${cmp} ${value}`
  if (init.status === 'deferred' && t.leverId === 'L3')
    return `${T.fundedOnce} ${lever} ${cmp} ${value} (SAR ${fmt.format(t.threshold - currentL3)}m ${T.more})`
  return `${T.staysIn} ${lever} ${cmp} ${value}`
}

/** Positions on a 0..1 scale for the mini-bar: lever range, current value, threshold and the viable side. */
export function triggerBar(
  t: Trigger,
  current: number,
): { cur: number; thr: number; viableFrom: number; viableTo: number; ticks: number[] } {
  const def = leverDefs.find((d) => d.id === t.leverId)!
  const range: [number, number] =
    t.leverId === 'L1'
      ? def.sliderRange!
      : def.type === 'slider'
        ? def.range!
        : [def.values![0], def.values![def.values!.length - 1]]
  const norm = (v: number) => Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])))
  const ticks = def.values ? def.values.map(norm) : []
  // Discrete levers: the viable band spans whole options, so pad half a step around the threshold.
  const half = def.values && def.values.length > 1 ? 0.5 / (def.values.length - 1) : 0
  const thr = norm(t.threshold)
  return {
    cur: norm(current),
    thr,
    viableFrom: t.direction === 'above' ? Math.max(0, thr - half) : 0,
    viableTo: t.direction === 'above' ? 1 : Math.min(1, thr + half),
    ticks,
  }
}
