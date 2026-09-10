import { motion } from 'framer-motion'
import type { Trigger } from '../../engine'
import { triggerBar } from '../triggerText'

/** Inline bar of the lever range: viable region tinted, threshold tick, marker at the current value. */
export function TriggerBar({
  trigger,
  current,
  status,
}: {
  trigger: Trigger
  current: number
  status: 'in' | 'deferred' | 'out'
}) {
  const b = triggerBar(trigger, current)
  const tint =
    status === 'out' ? 'bg-coral/25' : status === 'deferred' ? 'bg-amber/35' : 'bg-teal/30'
  const marker = status === 'out' ? 'bg-coral' : status === 'deferred' ? 'bg-amber' : 'bg-teal-dim'
  return (
    <div className="relative h-2 w-full rounded-full bg-sand-2" aria-hidden="true">
      <div
        className={`absolute inset-y-0 rounded-full ${tint}`}
        style={{ left: `${b.viableFrom * 100}%`, right: `${(1 - b.viableTo) * 100}%` }}
      />
      {b.ticks.map((t) => (
        <span
          key={t}
          className="absolute top-1/2 h-1 w-px -translate-y-1/2 bg-line"
          style={{ left: `${t * 100}%` }}
        />
      ))}
      <span
        className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink"
        style={{ left: `${b.thr * 100}%` }}
      />
      <motion.span
        className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${marker}`}
        animate={{ left: `calc(${b.cur * 100}% - 5px)` }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />
    </div>
  )
}
