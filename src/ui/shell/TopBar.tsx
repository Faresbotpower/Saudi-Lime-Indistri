import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { Banner } from './Banner'
import { Slash } from '../components/Slash'
import logoWhite from '../../../assets/sia_logo_white.png'

export function TopBar() {
  const scenario = useLevers((s) => s.scenario)
  const reset = useLevers((s) => s.reset)
  const goHome = useLevers((s) => s.goHome)
  const isBase = scenario === 'base'

  return (
    <header className="flex h-16 shrink-0 items-center gap-6 border-b border-line-dark bg-ink px-6 text-white">
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

      <div className="ml-auto flex items-center gap-4">
        <Banner />
        <div className="flex items-center gap-2 border-l border-line-dark pl-4">
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
        <img src={logoWhite} alt="Sia" className="ml-2 h-7 w-auto" />
      </div>
    </header>
  )
}
