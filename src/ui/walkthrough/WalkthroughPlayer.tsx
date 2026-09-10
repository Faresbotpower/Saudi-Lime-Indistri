import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { Slash } from '../components/Slash'
import { chapters, type AnimateLever } from './script'

type Rect = { x: number; y: number; w: number; h: number }

/**
 * Runs the explainer: shows each chapter's caption, fires its actions at their offsets,
 * spotlights the part of the screen being described, and advances at reading pace.
 */
export function WalkthroughPlayer() {
  const active = useLevers((s) => s.walkthrough.active)
  const step = useLevers((s) => s.walkthrough.step)
  const setStep = useLevers((s) => s.setWalkthroughStep)
  const stop = useLevers((s) => s.stopWalkthrough)
  const timers = useRef<number[]>([])
  // A chapter's default focus can be overridden by its actions; overrides die with the chapter.
  const [override, setOverride] = useState<{ step: number; sel: string | null } | null>(null)
  const [measured, setMeasured] = useState<{ sel: string; rect: Rect } | null>(null)
  const chapterFocus = active ? (chapters[step]?.focus ?? null) : null
  const focusSel = override && override.step === step ? override.sel : chapterFocus
  const rect = measured && measured.sel === focusSel ? measured.rect : null

  // Spotlight: follow the focused element while a chapter runs.
  useEffect(() => {
    if (!active || !focusSel) return
    const sel = focusSel
    let scrolled = false
    const measure = () => {
      const el = document.querySelector(sel)
      if (!el) return
      if (!scrolled) {
        scrolled = true
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
      const r = el.getBoundingClientRect()
      setMeasured({ sel, rect: { x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16 } })
    }
    const first = window.setTimeout(measure, 350)
    const id = window.setInterval(measure, 300)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [active, focusSel])

  useEffect(() => {
    if (!active) return
    const current = chapters[step]
    if (!current) {
      stop()
      return
    }
    const setFocusSel = (sel: string | null) => setOverride({ step, sel })
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
        window.setTimeout(() => a.run(useLevers.getState(), animate, setFocusSel), a.at * 1000),
      )

    let advanced = false
    const next = () => {
      if (advanced) return
      advanced = true
      if (step + 1 < chapters.length) setStep(step + 1)
      else stop()
    }
    const ends = window.setTimeout(next, current.seconds * 1000)
    return () => {
      clear()
      window.clearTimeout(ends)
    }
  }, [active, step, setStep, stop])

  const W = strings.walkthrough
  const current = chapters[step]
  const skip = () => (step + 1 < chapters.length ? setStep(step + 1) : stop())

  return (
    <AnimatePresence>
      {active && current && (
        <motion.div
          key="walkthrough"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Spotlight */}
          <svg
            className="pointer-events-none fixed inset-0 z-[80] h-full w-full"
            aria-hidden="true"
            data-testid="spotlight"
            data-active={rect ? 'true' : 'false'}
          >
            <defs>
              <mask id="strata-spotlight">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <motion.rect
                    rx={16}
                    fill="black"
                    initial={false}
                    animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
                    transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(10,21,30,0.55)"
              mask="url(#strata-spotlight)"
            />
            {rect && (
              <motion.rect
                rx={16}
                fill="none"
                stroke="#1de9b6"
                strokeWidth={2}
                initial={false}
                animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
                transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              />
            )}
          </svg>

          {/* Narration bar */}
          <motion.div
            data-testid="walkthrough-bar"
            role="status"
            className="fixed bottom-6 left-1/2 z-[90] w-[min(960px,calc(100%-48px))] -translate-x-1/2 rounded-card border border-line-dark bg-ink/95 px-5 py-4 text-white shadow-[0_16px_48px_rgba(11,39,53,0.35)] backdrop-blur"
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
                    <span className="num">{chapters.length}</span>
                  </span>
                  <span className="font-heading text-[16px] text-white">{current.title}</span>
                  <span className="ml-auto flex gap-1">
                    {chapters.map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block h-1.5 w-4 rounded-full ${i < step ? 'bg-teal' : i === step ? 'bg-teal/60' : 'bg-line-dark'}`}
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
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={skip}
                  className="rounded-full border border-line-dark px-4 py-1.5 font-heading text-[13px] text-white transition-colors duration-150 hover:border-teal hover:text-teal"
                >
                  {W.next}
                </button>
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-full border border-line-dark px-4 py-1.5 font-heading text-[13px] text-white transition-colors duration-150 hover:border-coral hover:text-coral"
                >
                  {W.stop}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
