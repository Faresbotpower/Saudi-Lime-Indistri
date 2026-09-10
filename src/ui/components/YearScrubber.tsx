import { motion } from 'framer-motion'
import { strings } from '../../strings'

type Props = { years: number[]; index: number; onChange: (i: number) => void }

/** Segmented year picker. Keyboard arrows move it. */
export function YearScrubber({ years, index, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="label text-muted">{strings.operations.year}</span>
      <div
        role="radiogroup"
        className="relative flex rounded-full border border-line bg-white p-1"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onChange(Math.min(years.length - 1, index + 1))
          if (e.key === 'ArrowLeft') onChange(Math.max(0, index - 1))
        }}
      >
        {years.map((y, i) => {
          const active = i === index
          return (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={String(y)}
              onClick={() => onChange(i)}
              className={`relative z-10 rounded-full px-4 py-1 font-heading text-[13px] transition-colors duration-150 ${
                active ? 'text-ink' : 'text-muted hover:text-navy'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="year-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-teal/25"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="num">{y}</span>
              {i === 0 && (
                <span className="ml-1 text-[10px] uppercase tracking-wider text-muted">actual</span>
              )}
            </button>
          )
        })}
      </div>
      <span className="text-[12px] text-muted">{strings.operations.scrubberHint}</span>
    </div>
  )
}
