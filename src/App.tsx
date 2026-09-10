import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { TopBar } from './ui/shell/TopBar'
import { LeverRail } from './ui/shell/LeverRail'
import { Tabs } from './ui/shell/Tabs'
import { views } from './ui/views'
import { useLevers } from './state/levers'

export default function App() {
  const view = useLevers((s) => s.view)
  const reduced = useReducedMotion()
  const View = views[view]

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full min-w-[1024px] flex-col overflow-hidden">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <LeverRail />
          <main className="flex min-w-0 flex-1 flex-col bg-sand">
            <Tabs />
            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                  transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <View />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </MotionConfig>
  )
}
