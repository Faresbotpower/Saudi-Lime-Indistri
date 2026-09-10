import type { ReactNode } from 'react'
import { strings, type ViewId } from '../../strings'
import { Slash } from './Slash'

/** Common header for every view: title with the slash mark, and a one-line lead. */
export function ViewFrame({ id, children }: { id: ViewId; children?: ReactNode }) {
  const v = strings.views[id]
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-6 flex items-start gap-3">
        <Slash size={28} className="mt-1" />
        <div>
          <h1 className="text-[28px] leading-tight text-ink">{v.title}</h1>
          <p className="mt-1 max-w-[720px] text-[14px] text-muted">{v.lead}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
