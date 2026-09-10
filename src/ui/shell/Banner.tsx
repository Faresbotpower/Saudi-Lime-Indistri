import { strings } from '../../strings'

/** Permanent, non-dismissable notice. */
export function Banner() {
  return (
    <div
      role="note"
      title={strings.app.illustrativeLong}
      className="label flex items-center gap-2 rounded-full border border-amber/60 px-3 py-1 text-amber"
    >
      <span className="block h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
      {strings.app.illustrative}
    </div>
  )
}
