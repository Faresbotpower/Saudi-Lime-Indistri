import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../format'

type Props = { value: number; format: (v: number) => string; duration?: number; className?: string }

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Counts from the previous value to the new one, 400 ms ease-out. Renders the value directly under reduced motion. */
export function CountUp({ value, format, duration = 400, className }: Props) {
  const reduced = prefersReducedMotion() || typeof requestAnimationFrame !== 'function'
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      from.current = value
      return
    }
    const start = from.current
    if (start === value) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - t0) / duration))
      from.current = start + (value - start) * easeOut(t)
      setShown(from.current)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else raf.current = null
    }
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [value, duration, reduced])

  return (
    <span key={value} className={`num number-pop ${className ?? ''}`} data-testid="kpi-value">
      {format(reduced ? value : shown)}
    </span>
  )
}
