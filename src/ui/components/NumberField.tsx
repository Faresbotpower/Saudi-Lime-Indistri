import { useState } from 'react'

type Props = {
  id: string
  label: string
  unit: string
  value: number
  edited?: boolean
  step?: number
  min?: number
  max?: number
  onChange: (value: number | undefined) => void
  dark?: boolean
}

/** A typed number with its unit. Commits on every valid keystroke; an empty field clears the override. */
export function NumberField({
  id,
  label,
  unit,
  value,
  edited,
  step,
  min,
  max,
  onChange,
  dark = true,
}: Props) {
  const [text, setText] = useState(String(value))
  const [seen, setSeen] = useState(value)
  // A new value from outside (a slider, a preset, a reset) replaces the typed text.
  if (value !== seen) {
    setSeen(value)
    if (Number(text) !== value) setText(String(value))
  }
  return (
    <label htmlFor={id} className="grid grid-cols-[1fr_96px_auto] items-center gap-2 py-1">
      <span
        className={`flex items-center gap-1.5 text-[13px] ${dark ? 'text-muted-dark' : 'text-navy'}`}
      >
        {edited && (
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal"
            aria-label="edited"
          />
        )}
        <span className="truncate" title={label}>
          {label}
        </span>
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (e.target.value === '') onChange(undefined)
          else {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) onChange(n)
          }
        }}
        className={`num w-full rounded-md border px-2 py-1 text-right text-[13px] outline-none transition-colors duration-150 ${
          dark
            ? `border-line-dark bg-ink text-white focus:border-teal ${edited ? 'border-teal/60' : ''}`
            : `border-line bg-white text-ink focus:border-teal-dim ${edited ? 'border-teal-dim/60' : ''}`
        }`}
      />
      <span
        className={`w-[92px] truncate text-[11px] ${dark ? 'text-muted-dark' : 'text-muted'}`}
        title={unit}
      >
        {unit}
      </span>
    </label>
  )
}
