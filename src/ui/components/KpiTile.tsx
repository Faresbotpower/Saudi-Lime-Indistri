import { CountUp } from './CountUp'
import { DeltaChip } from './DeltaChip'

type Props = {
  label: string
  value: number
  base: number
  unit: string
  format: (v: number) => string
  formatDelta: (d: number) => string
  goodWhenUp?: boolean
  note?: string
}

export function KpiTile({
  label,
  value,
  base,
  unit,
  format,
  formatDelta,
  goodWhenUp = true,
  note,
}: Props) {
  return (
    <div data-testid="kpi-tile" className="rounded-card bg-white p-5 shadow-card">
      <div className="label text-muted">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <CountUp
          value={value}
          format={format}
          className="font-heading text-[40px] leading-none tracking-[-0.02em] text-ink"
        />
        <span className="text-[13px] text-muted">{unit}</span>
      </div>
      <div className="mt-3 flex min-h-[22px] items-center gap-2">
        <DeltaChip delta={value - base} format={formatDelta} goodWhenUp={goodWhenUp} />
        {note && <span className="text-[12px] text-muted">{note}</span>}
      </div>
    </div>
  )
}
