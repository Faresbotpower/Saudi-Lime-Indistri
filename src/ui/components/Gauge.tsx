import { motion } from 'framer-motion'
import { CountUp } from './CountUp'

/** Half-ring utilization gauge. Teal until 97%, amber above, since a full kiln loses demand. */
export function Gauge({ value, size = 120 }: { value: number; size?: number }) {
  const r = 46
  const stroke = 10
  const color = value >= 0.97 ? '#f2b24c' : '#0f9c7e'
  const d = `M ${50 - r} 50 A ${r} ${r} 0 0 1 ${50 + r} 50`
  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 100 62" className="h-full w-full" aria-hidden="true">
        <path d={d} fill="none" stroke="#efefec" strokeWidth={stroke} strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.max(0.001, Math.min(1, value)), stroke: color }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <CountUp
          value={value * 100}
          format={(v) => `${Math.round(v)}`}
          className="font-heading text-[24px] leading-none text-ink"
        />
        <span className="text-[12px] text-muted">%</span>
      </div>
    </div>
  )
}
