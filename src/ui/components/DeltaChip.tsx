import { AnimatePresence, motion } from 'framer-motion'
import { strings } from '../../strings'

type Props = { delta: number; format: (d: number) => string; goodWhenUp?: boolean; label?: string }

/** Small chip beside a number: teal for a favourable move, coral for an unfavourable one. Hidden at zero. */
export function DeltaChip({
  delta,
  format,
  goodWhenUp = true,
  label = strings.financials.vsBase,
}: Props) {
  const show = Math.abs(delta) > 1e-6
  const up = delta > 0
  const good = up === goodWhenUp
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          key="chip"
          data-testid="delta-chip"
          data-direction={up ? 'up' : 'down'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${
            good ? 'bg-teal/15 text-teal-dim' : 'bg-coral/12 text-coral'
          }`}
          title={label}
        >
          {format(delta)}
          <span className="text-[10px] font-normal opacity-70">{label}</span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}
