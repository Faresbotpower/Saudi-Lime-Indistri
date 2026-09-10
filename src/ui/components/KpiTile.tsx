import { motion } from 'framer-motion'
import { CountUp } from './CountUp'
import { DeltaChip } from './DeltaChip'
import { ExplainButton } from './ExplainButton'
import { prefersReducedMotion } from '../format'

type Props = {
  label: string
  value: number
  base: number
  unit: string
  format: (v: number) => string
  formatDelta: (d: number) => string
  goodWhenUp?: boolean
  note?: string
  traceKey?: string
  /** Stagger position on first paint, 40 ms per step. */
  index?: number
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
  traceKey,
  index = 0,
}: Props) {
  const reduced = prefersReducedMotion()
  return (
    <motion.div
      data-testid="kpi-tile"
      className="rounded-card bg-white p-5 shadow-card"
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.35, delay: reduced ? 0 : index * 0.04 }}
    >
      <div className="flex items-center justify-between">
        <div className="label text-muted">{label}</div>
        {traceKey && <ExplainButton traceKey={traceKey} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <CountUp
          value={value}
          format={format}
          className="font-heading text-[40px] leading-none tracking-[-0.02em] text-ink"
        />
        <span className="text-[14px] text-muted">{unit}</span>
      </div>
      <div className="mt-3 flex min-h-[22px] items-center gap-2">
        <DeltaChip delta={value - base} format={formatDelta} goodWhenUp={goodWhenUp} />
        {note && <span className="text-[13px] text-muted">{note}</span>}
      </div>
    </motion.div>
  )
}
