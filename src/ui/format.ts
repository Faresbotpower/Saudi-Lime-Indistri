const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const one = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** SAR million, no decimals, thousands separator. */
export const sarm = (x: number): string => int.format(Math.round(x))
/** Percent with one decimal, from a ratio. */
export const pct1 = (ratio: number): string => one.format(ratio * 100)
/** Signed delta in SAR m. */
export const signed = (x: number): string =>
  (x > 0 ? '+' : x < 0 ? '−' : '') + int.format(Math.abs(Math.round(x)))
/** Signed delta in percentage points. */
export const signedPts = (ratioDelta: number): string =>
  (ratioDelta > 0 ? '+' : ratioDelta < 0 ? '−' : '') +
  one.format(Math.abs(ratioDelta * 100)) +
  ' pts'

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
