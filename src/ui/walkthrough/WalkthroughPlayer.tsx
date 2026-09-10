import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { Slash } from '../components/Slash'
import { steps, type AnimateLever } from './script'

/**
 * Runs the walkthrough: plays each step's narration, fires its actions at their offsets,
 * advances when the audio ends (or after the step's length if audio cannot play).
 */
export function WalkthroughPlayer() {
  const active = useLevers((s) => s.walkthrough.active)
  const step = useLevers((s) => s.walkthrough.step)
  const setStep = useLevers((s) => s.setWalkthroughStep)
  const stop = useLevers((s) => s.stopWalkthrough)
  const timers = useRef<number[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!active) return
    const current = steps[step]
    if (!current) {
      stop()
      return
    }
    const api = useLevers.getState()
    const clear = () => {
      for (const t of timers.current) window.clearTimeout(t)
      timers.current = []
    }
    const animate: AnimateLever = (id, from, to, size, ms) => {
      const n = Math.max(1, Math.round(Math.abs(to - from) / size))
      for (let k = 1; k <= n; k++) {
        const v = from + ((to - from) * k) / n
        timers.current.push(
          window.setTimeout(() => useLevers.getState().setLever(id, Math.round(v)), (ms * k) / n),
        )
      }
    }
    for (const a of current.actions)
      timers.current.push(
        window.setTimeout(() => a.run(useLevers.getState(), animate), a.at * 1000),
      )

    let advanced = false
    const next = () => {
      if (advanced) return
      advanced = true
      if (step + 1 < steps.length) setStep(step + 1)
      else stop()
    }
    let fallback: number | null = null
    let audio: HTMLAudioElement | null = null
    if (typeof Audio === 'function') {
      audio = new Audio(current.audio)
      audioRef.current = audio
      audio.addEventListener('ended', next)
      audio.addEventListener('error', () => {
        fallback = window.setTimeout(next, current.seconds * 1000)
      })
      const p = audio.play()
      if (p && typeof p.catch === 'function')
        p.catch(() => {
          fallback = window.setTimeout(next, current.seconds * 1000)
        })
    } else {
      fallback = window.setTimeout(next, current.seconds * 1000)
    }
    void api
    return () => {
      clear()
      if (fallback !== null) window.clearTimeout(fallback)
      if (audio) {
        audio.pause()
        audio.removeEventListener('ended', next)
      }
      audioRef.current = null
    }
  }, [active, step, setStep, stop])

  const W = strings.walkthrough
  const current = steps[step]
  return (
    <AnimatePresence>
      {active && current && (
        <motion.div
          key="walkthrough-bar"
          data-testid="walkthrough-bar"
          role="status"
          className="fixed bottom-6 left-1/2 z-[90] w-[min(920px,calc(100%-48px))] -translate-x-1/2 rounded-card border border-line-dark bg-ink/95 px-5 py-4 text-white shadow-[0_16px_48px_rgba(11,39,53,0.35)] backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-start gap-4">
            <Slash size={22} className="mt-1" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="label text-muted-dark">
                  {W.step} <span className="num">{step + 1}</span> {W.of}{' '}
                  <span className="num">{steps.length}</span>
                </span>
                <span className="font-heading text-[15px] text-white">{current.title}</span>
                <span className="ml-auto flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-1.5 w-5 rounded-full ${i < step ? 'bg-teal' : i === step ? 'bg-teal/60' : 'bg-line-dark'}`}
                    />
                  ))}
                </span>
              </div>
              <p
                data-testid="walkthrough-caption"
                className="mt-1.5 text-[14px] leading-relaxed text-muted-dark"
              >
                {current.caption}
              </p>
            </div>
            <button
              type="button"
              onClick={stop}
              className="shrink-0 rounded-full border border-line-dark px-4 py-1.5 font-heading text-[13px] text-white transition-colors duration-150 hover:border-coral hover:text-coral"
            >
              {W.stop}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
