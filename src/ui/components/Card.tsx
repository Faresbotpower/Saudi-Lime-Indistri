import type { ReactNode } from 'react'

type Props = {
  title?: string
  lead?: string
  children: ReactNode
  className?: string
  testId?: string
  /** Anchor for the walkthrough spotlight. */
  tour?: string
}

/** Open analytical section; hierarchy comes from spacing and typography. */
export function Card({ title, lead, children, className, testId, tour }: Props) {
  return (
    <section data-testid={testId} data-tour={tour} className={`data-panel ${className ?? ''}`}>
      {(title || lead) && (
        <div className="mb-4">
          {title && <h2 className="text-[20px] text-ink">{title}</h2>}
          {lead && <p className="mt-0.5 text-[14px] text-muted">{lead}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
