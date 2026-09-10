import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import { Slash } from './Slash'

/** The small slash that opens the Explain sheet for a trace key. Renders only when the toggle is on. */
export function ExplainButton({ traceKey, dark = false }: { traceKey: string; dark?: boolean }) {
  const on = useLevers((s) => s.explain)
  const open = useLevers((s) => s.openExplain)
  if (!on) return null
  return (
    <button
      type="button"
      aria-label={strings.explain.icon}
      title={strings.explain.title}
      onClick={(e) => {
        e.stopPropagation()
        open(traceKey)
      }}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
        dark
          ? 'border-line-dark hover:border-teal'
          : 'border-line hover:border-teal-dim hover:bg-teal/10'
      }`}
    >
      <Slash size={12} color={dark ? '#1de9b6' : '#0f9c7e'} />
    </button>
  )
}
