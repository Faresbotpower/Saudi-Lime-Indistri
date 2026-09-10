import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { strings } from '../../strings'
import { prefersReducedMotion } from '../format'
import { markIntroSeen } from './introState'


/** 2.5 s: dark, the slash draws in, the wordmark fades up, then the shell takes over. Click skips. */
export function Intro({ onDone }: { onDone: () => void }) {
  const reduced = prefersReducedMotion()
  const done = useRef(false)
  const finish = () => {
    if (done.current) return
    done.current = true
    markIntroSeen()
    onDone()
  }
  useEffect(() => {
    const t = window.setTimeout(finish, reduced ? 400 : 2500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      data-testid="intro"
      role="button"
      tabIndex={0}
      aria-label={strings.intro.skip}
      onClick={finish}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && finish()}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-ink text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.4 }}
    >
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
      <motion.div
        className="mt-6 font-heading text-[40px] font-medium tracking-[0.18em]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduced ? { duration: 0.12 } : { duration: 0.6, delay: 0.8, ease: [0.2, 0.8, 0.2, 1] }
        }
      >
        STRATA
      </motion.div>
      <motion.div
        className="mt-3 text-[14px] text-muted-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0.12 } : { duration: 0.5, delay: 1.3 }}
      >
        {strings.intro.tagline}
      </motion.div>
      <motion.div
        className="label absolute bottom-8 text-muted-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduced ? 0 : 1.6 }}
      >
        {strings.intro.skip}
      </motion.div>
    </motion.div>
  )
}
