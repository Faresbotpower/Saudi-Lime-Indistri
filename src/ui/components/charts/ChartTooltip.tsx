import { sarm } from '../../format'

type Item = { name?: string; value?: number | string; color?: string; dataKey?: string | number }
type Props = { active?: boolean; label?: string | number; payload?: Item[]; unit?: string }

/** One tooltip for every chart: year on top, series below, tabular numbers. */
export function ChartTooltip({ active, label, payload, unit = 'SAR m' }: Props) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] shadow-card">
      <div className="mb-1 font-heading text-[13px] text-ink">{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="num text-ink">
            {typeof p.value === 'number' ? sarm(p.value) : p.value}{' '}
            <span className="text-muted">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
