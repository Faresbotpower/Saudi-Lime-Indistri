import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TopBar } from './ui/shell/TopBar'
import { LeverRail } from './ui/shell/LeverRail'
import { Tabs } from './ui/shell/Tabs'
import { Cover } from './ui/shell/Cover'
import { ExplainSheet } from './ui/components/ExplainSheet'
import { WalkthroughPlayer } from './ui/walkthrough/WalkthroughPlayer'
import { Report } from './ui/report/Report'
import { views } from './ui/views'
import { useLevers } from './state/levers'

export default function App() {
  const view = useLevers((s) => s.view)
  const showCover = useLevers((s) => s.showCover)
  const printing = useLevers((s) => s.printing)
  const setPrinting = useLevers((s) => s.setPrinting)
  useEffect(() => {
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    return () => window.removeEventListener('afterprint', done)
  }, [setPrinting])
  const reduced = useReducedMotion()
  const [assembled, setAssembled] = useState(() => !useLevers.getState().showCover)
  const View = views[view]
  const ease = [0.2, 0.8, 0.2, 1] as const

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{showCover && <Cover key="cover" />}</AnimatePresence>
      <div id="app-shell" className="flex h-full min-w-[1024px] flex-col overflow-hidden">
        <motion.div
          initial={assembled ? false : { opacity: 0, y: -8 }}
          animate={showCover ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.4, ease }}
        >
          <TopBar />
        </motion.div>
        <div className="flex min-h-0 flex-1">
          <motion.div
            className="flex min-h-0"
            initial={assembled ? false : { x: -80, opacity: 0 }}
            animate={showCover ? undefined : { x: 0, opacity: 1 }}
            transition={{ duration: reduced ? 0.12 : 0.5, ease }}
            onAnimationComplete={() => setAssembled(true)}
          >
            <LeverRail />
          </motion.div>
          <main className="flex min-w-0 flex-1 flex-col bg-sand">
            <Tabs />
            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                  transition={{ duration: reduced ? 0.12 : 0.2, ease }}
                >
                  {!showCover && <View />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <ExplainSheet />
      <WalkthroughPlayer />
      {printing && <Report />}
    </MotionConfig>
  )
}
