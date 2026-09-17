import { MotionConfig } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TopBar } from './ui/shell/TopBar'
import { LeverRail } from './ui/shell/LeverRail'
import { Tabs } from './ui/shell/Tabs'
import { Cover } from './ui/shell/Cover'
import { ExplainSheet } from './ui/components/ExplainSheet'
import { WalkthroughPlayer } from './ui/walkthrough/WalkthroughPlayer'
import { Report } from './ui/report/Report'
import { views } from './ui/views'
import { useLevers } from './state/levers'
import { useCompactLayout } from './ui/shell/useCompactLayout'
import './ui/shell/responsive.css'

export default function App() {
  const view = useLevers((s) => s.view)
  const showCover = useLevers((s) => s.showCover)
  const printing = useLevers((s) => s.printing)
  const setPrinting = useLevers((s) => s.setPrinting)
  const touring = useLevers((s) => s.walkthrough.active)
  const compact = useCompactLayout()
  const [railOpen, setRailOpen] = useState(false)
  const [preparingEntry, setPreparingEntry] = useState(false)
  const drawer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const followFocus = (event: Event) => {
      const selector = (event as CustomEvent<string | null>).detail
      const target = selector ? document.querySelector(selector) : null
      setRailOpen(Boolean(target && drawer.current?.contains(target)))
    }
    window.addEventListener('strata:tour-focus', followFocus)
    window.dispatchEvent(new Event('strata:tour-focus-request'))
    return () => window.removeEventListener('strata:tour-focus', followFocus)
  }, [compact])
  useEffect(() => {
    if (!railOpen) return
    const returnFocus = document.getElementById('lever-toggle')
    drawer.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRailOpen(false)
      if (event.key !== 'Tab') return
      const items = [
        ...(drawer.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
        ) ?? []),
      ].filter((el) => !el.closest('[hidden]'))
      if (touring)
        items.push(
          ...document.querySelectorAll<HTMLButtonElement>('[data-testid="walkthrough-bar"] button'),
        )
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnFocus?.focus()
    }
  }, [compact, railOpen, touring])
  const viewScroll = useRef<HTMLDivElement>(null)
  useEffect(() => {
    viewScroll.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [view, showCover])
  useEffect(() => {
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    return () => window.removeEventListener('afterprint', done)
  }, [setPrinting])
  const View = views[view]

  return (
    <MotionConfig reducedMotion="user">
      {showCover && <Cover onExitStart={() => setPreparingEntry(true)} />}
      <div
        id="app-shell"
        className="flex h-full min-w-0 flex-col overflow-hidden"
        data-touring={touring}
        aria-hidden={showCover}
        {...(showCover ? { inert: '' } : {})}
      >
        <TopBar compact railOpen={railOpen} onToggleRail={() => setRailOpen(!railOpen)} />
        <div className="app-workspace flex min-h-0 flex-1">
          {railOpen && (
            <button
              type="button"
              className="rail-backdrop"
              tabIndex={-1}
              aria-label="Close lever panel"
              onClick={() => setRailOpen(false)}
            />
          )}
          <div
            id="lever-drawer"
            ref={drawer}
            className="lever-drawer flex min-h-0"
            data-open={railOpen}
            role={railOpen ? 'dialog' : undefined}
            aria-modal={railOpen && !touring ? true : undefined}
            aria-label="Scenario controls"
            aria-hidden={!railOpen}
            {...(!railOpen ? { inert: '' } : {})}
          >
            {
              <div className="rail-drawer-heading">
                <span>Scenario controls</span>
                <button type="button" onClick={() => setRailOpen(false)} aria-label="Close levers">
                  Close <span aria-hidden="true">×</span>
                </button>
              </div>
            }
            <LeverRail />
          </div>
          <main
            className="app-main flex min-w-0 flex-1 flex-col bg-sand"
            {...(railOpen ? { inert: '' } : {})}
          >
            <Tabs />
            <div ref={viewScroll} className="view-scroll relative min-h-0 flex-1 overflow-y-auto">
              <div
                key={view}
                className="view-transition"
                role="tabpanel"
                id={`view-panel-${view}`}
                aria-labelledby={`view-tab-${view}`}
              >
                {(!showCover || preparingEntry) && <View />}
              </div>
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
