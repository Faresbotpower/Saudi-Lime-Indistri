import type { ReactNode } from 'react'

type Props = {
  title?: string
  lead?: string
  children: ReactNode
  className?: string
  testId?: string
}

/** Light card: 14px radius, one soft shadow, no border. */
export function Card({ title, lead, children, className, testId }: Props) {
  return (
    <section
      data-testid={testId}
      className={`rounded-card bg-white p-5 shadow-card ${className ?? ''}`}
    >
      {(title || lead) && (
        <div className="mb-4">
          {title && <h2 className="text-[20px] text-ink">{title}</h2>}
          {lead && <p className="mt-0.5 text-[13px] text-muted">{lead}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
