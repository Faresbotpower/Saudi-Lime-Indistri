const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const one = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const two = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Format a scorecard value for its unit: ratios with one decimal, indices with two, money and tons whole. */
export function fmtKpi(value: number, unit: string): string {
  if (unit.startsWith('%')) return one.format(value)
  if (unit.startsWith('x') || unit.startsWith('tCO2')) return two.format(value)
  return int.format(value)
}

export const kpiDelta = (live: number, target: number): number => live - target
