import { useCallback, useEffect, useRef } from 'react'

/**
 * Leading edge fires at once; further calls inside the same animation frame (about 16 ms)
 * coalesce into one trailing call with the last value.
 */
export function useRafThrottle<T>(fn: (value: T) => void): (value: T) => void {
  const latest = useRef<T | null>(null)
  const frame = useRef<number | null>(null)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  }, [fn])
  useEffect(
    () => () => {
      if (frame.current !== null && typeof cancelAnimationFrame === 'function')
        cancelAnimationFrame(frame.current)
    },
    [],
  )
  return useCallback((value: T) => {
    if (typeof requestAnimationFrame !== 'function') {
      fnRef.current(value)
      return
    }
    if (frame.current === null) {
      fnRef.current(value)
      latest.current = null
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        if (latest.current !== null) {
          const v = latest.current
          latest.current = null
          fnRef.current(v)
        }
      })
      return
    }
    latest.current = value
  }, [])
}
