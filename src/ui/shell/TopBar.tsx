import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { Banner } from './Banner'
import { Slash } from '../components/Slash'
import logoWhite from '../../../assets/sia_logo_white.png'

export function TopBar({
  compact = false,
  railOpen = false,
  onToggleRail,
}: {
  compact?: boolean
  railOpen?: boolean
  onToggleRail?: () => void
}) {
  const scenario = useLevers((s) => s.scenario)
  const reset = useLevers((s) => s.reset)
  const goHome = useLevers((s) => s.goHome)
  const editedInputs = useLevers((s) => Object.keys(s.overrides).length)
  const resetOverrides = useLevers((s) => s.resetOverrides)
  const setPrinting = useLevers((s) => s.setPrinting)
  const isBase = scenario === 'base'

  return (
    <header className="app-topbar flex h-16 shrink-0 items-center gap-6 border-b border-line-dark bg-ink px-6 text-white">
      <button
        type="button"
        onClick={goHome}
        title={strings.cover.home}
        className="flex items-center gap-2 rounded-md transition-opacity duration-150 hover:opacity-80"
      >
        <Slash size={22} />
        <span className="font-heading text-[20px] font-medium tracking-[0.12em]">
          {strings.app.name}
        </span>
      </button>
      <span className="hidden text-[13px] text-muted-dark lg:block">{strings.app.client}</span>

      <div className="topbar-actions ml-auto flex items-center gap-4">
        {compact && (
          <button
            id="lever-toggle"
            type="button"
            aria-label={railOpen ? 'Hide levers' : 'Show levers'}
            aria-expanded={railOpen}
            aria-controls="lever-drawer"
            onClick={onToggleRail}
            className="lever-toggle"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M3 5h14M3 10h14M3 15h14" />
              <path d="M7 2v6m6-1v6m-5-1v6" strokeWidth="3" />
            </svg>
            Shape the scenario
          </button>
        )}
        {editedInputs > 0 && (
          <button
            type="button"
            onClick={() => resetOverrides()}
            title={strings.inputs.resetAll}
            data-testid="inputs-chip"
            className="label flex items-center gap-2 rounded-full border border-teal/60 px-3 py-1 text-teal transition-colors duration-150 hover:bg-teal/10"
          >
            <span className="block h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
            {strings.inputs.editedChip(editedInputs)}
          </button>
        )}
        <Banner />
        <div className="topbar-scenario flex items-center gap-2 border-l border-line-dark pl-4">
          <span className="label text-muted-dark">{strings.app.scenario}</span>
          <span className="font-heading text-[16px]">{strings.scenarios[scenario]}</span>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={isBase}
          className="rounded-full border border-line-dark px-4 py-1.5 font-heading text-[13px] text-white transition-colors duration-150 hover:border-teal hover:text-teal disabled:cursor-default disabled:opacity-40 disabled:hover:border-line-dark disabled:hover:text-white"
        >
          {strings.app.reset}
        </button>
        <button
          type="button"
          data-tour="export"
          onClick={() => {
            setPrinting(true)
            window.setTimeout(() => window.print(), 80)
          }}
          className="rounded-full border border-line-dark px-4 py-1.5 font-heading text-[13px] text-white transition-colors duration-150 hover:border-teal hover:text-teal"
        >
          {strings.report.export}
        </button>
        <img src={logoWhite} alt="Sia" className="ml-2 h-7 w-auto" />
      </div>
    </header>
  )
}
