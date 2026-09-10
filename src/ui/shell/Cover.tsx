import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { prefersReducedMotion } from '../format'
import logoWhite from '../../../assets/sia_logo_white.png'

/** Cover page: the slash draws in, the wordmark fades up, then Enter or the walkthrough. */
export function Cover() {
  const enter = useLevers((s) => s.enter)
  const start = useLevers((s) => s.startWalkthrough)
  const reduced = prefersReducedMotion()
  const t = (delay: number, duration = 0.5) =>
    reduced ? { duration: 0.12 } : { duration, delay, ease: [0.2, 0.8, 0.2, 1] as const }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && enter()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter])

  return (
    <motion.div
      data-testid="cover"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.45 }}
    >
      {/* Ghost slash, the Sia motif, behind everything */}
      <svg
        className="pointer-events-none absolute right-[8%] top-[10%] h-[80%] opacity-[0.06]"
        viewBox="0 0 60 200"
        fill="none"
        aria-hidden="true"
      >
        <path d="M58 2 2 198" stroke="#1de9b6" strokeWidth="2" />
        <path d="M40 2 -16 198" stroke="#1de9b6" strokeWidth="2" />
      </svg>

      <svg width="72" height="120" viewBox="0 0 36 60" fill="none" aria-hidden="true">
        <motion.path
          d="M31 4 5 56"
          stroke="#1de9b6"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={reduced ? { duration: 0.12 } : { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <motion.h1
        className="mt-6 font-heading text-[48px] font-medium tracking-[0.18em]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(0.7, 0.6)}
      >
        STRATA
      </motion.h1>
      <motion.p
        className="mt-3 text-[16px] text-muted-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(1.1)}
      >
        {strings.cover.tagline}
      </motion.p>
      <motion.p
        className="mt-1 text-[14px] text-muted-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(1.25)}
      >
        {strings.app.client}
      </motion.p>

      <motion.div
        className="mt-10 flex items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t(1.5)}
      >
        <button
          type="button"
          onClick={enter}
          className="rounded-full bg-teal px-8 py-3 font-heading text-[16px] font-medium text-ink transition-transform duration-150 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {strings.cover.enter}
        </button>
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 rounded-full border border-line-dark px-6 py-3 font-heading text-[15px] text-white transition-colors duration-150 hover:border-teal hover:text-teal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3 6v4h3l4 3V3L6 6H3z" />
            <path
              d="M12 5.5a3.5 3.5 0 0 1 0 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {strings.cover.walkthrough}
        </button>
      </motion.div>
      <motion.p
        className="mt-3 text-[13px] text-muted-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(1.7)}
      >
        {strings.cover.walkthroughHint}
      </motion.p>

      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(1.9)}
      >
        <div className="flex items-center gap-3">
          <span className="label text-muted-dark">{strings.cover.poweredBy}</span>
          <img src={logoWhite} alt="Sia" className="h-8 w-auto" />
        </div>
        <span className="label text-amber/80">{strings.app.illustrative}</span>
      </motion.div>
    </motion.div>
  )
}
