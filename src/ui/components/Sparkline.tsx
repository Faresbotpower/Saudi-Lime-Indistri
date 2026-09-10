import { motion } from 'framer-motion'

type Props = { values: number[]; index: number; height?: number }

/** Six small bars, one per year, the picked year in teal. */
export function Sparkline({ values, index, height = 36 }: Props) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex items-end gap-1" style={{ height }} aria-hidden="true">
      {values.map((v, i) => (
        <motion.span
          key={i}
          className={`w-full rounded-sm ${i === index ? 'bg-teal-dim' : 'bg-line'}`}
          initial={false}
          animate={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        />
      ))}
    </div>
  )
}
