import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { viewOrder } from './viewOrder'

export function Tabs() {
  const view = useLevers((s) => s.view)
  const setView = useLevers((s) => s.setView)
  const tabs = useRef<HTMLElement>(null)
  useEffect(() => {
    tabs.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [view])

  return (
    <nav
      aria-label="Views"
      ref={tabs}
      role="tablist"
      onKeyDown={(event) => {
        const index = viewOrder.indexOf(view)
        const next =
          event.key === 'ArrowRight'
            ? (index + 1) % viewOrder.length
            : event.key === 'ArrowLeft'
              ? (index - 1 + viewOrder.length) % viewOrder.length
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? viewOrder.length - 1
                  : null
        if (next === null) return
        event.preventDefault()
        setView(viewOrder[next])
        document.getElementById(`view-tab-${viewOrder[next]}`)?.focus()
      }}
      data-tour="tabs"
      className="view-tabs flex shrink-0 items-end gap-1 border-b border-line px-6 pt-3"
    >
      {viewOrder.map((id, i) => {
        const active = id === view
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`view-tab-${id}`}
            aria-controls={`view-panel-${id}`}
            tabIndex={active ? 0 : -1}
            aria-selected={active}
            onClick={() => setView(id)}
            className={`relative whitespace-nowrap px-3 pb-3 pt-2 font-heading text-[14px] transition-colors duration-150 ${
              active ? 'text-ink' : 'text-muted hover:text-navy'
            }`}
          >
            <span className="num mr-1.5 text-[12px] text-muted">{i + 1}</span>
            {strings.views[id].tab}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-3 -bottom-px h-[2px] bg-teal"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
