import { useCallback, useEffect, useRef, useState } from 'react'
import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { Slash } from '../components/Slash'
import logoWhite from '../../../assets/sia_logo_white.png'

export function Cover({ onExitStart }: { onExitStart?: () => void }) {
  const enter = useLevers((s) => s.enter)
  const start = useLevers((s) => s.startWalkthrough)
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const depart = useCallback(
    (action: () => void) => {
      if (timer.current !== null) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        action()
        return
      }
      setLeaving(true)
      onExitStart?.()
      timer.current = setTimeout(action, 800)
    },
    [onExitStart],
  )
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) depart(enter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter, depart])

  return (
    <div
      data-testid="cover"
      className={`cover${leaving ? ' cover--leaving' : ''}`}
      aria-busy={leaving}
    >
      <div className="cover-art" aria-hidden="true" />
      <div className="cover-shade" aria-hidden="true" />
      <div className="cover-top">
        <div className="cover-brand">
          <Slash size={25} />
          <span>{strings.app.name}</span>
        </div>
        <span className="cover-edition">{strings.design.edition}</span>
        <div className="cover-powered">
          <span>{strings.cover.poweredBy}</span>
          <img src={logoWhite} alt="Sia" />
        </div>
      </div>
      <div className="cover-content">
        <div className="cover-eyebrow">
          <span />
          {strings.app.tagline}
        </div>
        <h1>
          {strings.design.coverLineOne}
          <br />
          <span>{strings.design.coverLineTwo}</span>
        </h1>
        <p className="cover-client">{strings.app.client}</p>
        <div className="cover-actions">
          <button
            type="button"
            disabled={leaving}
            onClick={() => depart(enter)}
            className="cover-enter"
          >
            {strings.cover.enter}
            <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            disabled={leaving}
            onClick={() => depart(start)}
            className="cover-play"
          >
            <span className="play-circle" aria-hidden="true">
              ▶
            </span>
            {strings.cover.walkthrough}
          </button>
        </div>
        <p className="cover-hint">{strings.cover.walkthroughHint}</p>
      </div>
      <div className="cover-strata-note" aria-hidden="true">
        <span className="strata-note-line" />
        <span>{strings.design.strataNote}</span>
      </div>
      <footer className="cover-footer">
        <div className="cover-footer-item">
          <span className="cover-footer-label">{strings.design.horizon}</span>
          <strong>
            2027 <span>/</span> 2031
          </strong>
        </div>
        <div className="cover-footer-item cover-method">
          <span className="cover-footer-label">{strings.design.foundation}</span>
          <strong>{strings.design.layers}</strong>
        </div>
        <div className="cover-footer-credit">
          <span>{strings.app.builtBy}</span>
          <span className="cover-disclaimer">
            <i />
            {strings.app.illustrative}
          </span>
        </div>
      </footer>
    </div>
  )
}
