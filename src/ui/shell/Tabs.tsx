import { motion } from 'framer-motion'
import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { viewOrder } from './viewOrder'

export function Tabs() {
  const view = useLevers((s) => s.view)
  const setView = useLevers((s) => s.setView)

  return (
    <nav
      aria-label="Views"
      className="flex shrink-0 items-end gap-1 border-b border-line px-6 pt-3"
    >
      {viewOrder.map((id, i) => {
        const active = id === view
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setView(id)}
            className={`relative px-4 pb-3 pt-2 font-heading text-[15px] transition-colors duration-150 ${
              active ? 'text-ink' : 'text-muted hover:text-navy'
            }`}
          >
            <span className="num mr-2 text-[12px] text-muted">{i + 1}</span>
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
