import type { Assumptions } from './types'

/** Base year first, then the plan years: [2026, 2027, ..., 2031]. */
export const yearsOf = (a: Assumptions): number[] => [a.baseYear, ...a.planYears]

export const zeros = (n: number): number[] => new Array<number>(n).fill(0)

export const sumSeries = (list: number[][], n: number): number[] => {
  const out = zeros(n)
  for (const s of list) for (let i = 0; i < n; i++) out[i] += s[i] ?? 0
  return out
}
