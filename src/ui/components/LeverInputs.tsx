import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { planData, type LeverId } from '../../data'
import { useLevers } from '../../state/levers'
import { readPath } from '../../state/overrides'
import { useData } from '../../state/plan'
import { strings } from '../../strings'
import { indexFromFuel, inputsFor, type Field } from '../inputSpecs'
import { NumberField } from './NumberField'

type Props = { id: LeverId | 'base'; children?: ReactNode }

/** Disclosure under a lever card: the exact lever value and every assumption it drives, typed. */
export function LeverInputs({ id, children }: Props) {
  const open = useLevers((s) => !!s.inputsOpen[id])
  const setInputsOpen = useLevers((s) => s.setInputsOpen)
  const setOpen = (v: boolean) => setInputsOpen(id, v)
  const levers = useLevers((s) => s.levers)
  const setLever = useLevers((s) => s.setLever)
  const overrides = useLevers((s) => s.overrides)
  const setOverride = useLevers((s) => s.setOverride)
  const resetOverrides = useLevers((s) => s.resetOverrides)
  const data = useData()
  const I = strings.inputs
  const groups = inputsFor(id, data, levers.L1.option)
  const paths = groups.flatMap((g) => g.fields.map((f) => f.path))
  const editedCount = paths.filter((p) => p in overrides).length

  const valueOf = (f: Field): number => {
    const raw = (readPath(data.assumptions, f.path) as number | undefined) ?? 0
    return f.scale ? Math.round(raw * f.scale * 1000) / 1000 : raw
  }
  const write = (f: Field, v: number | undefined) => {
    setOverride(f.path, v === undefined ? undefined : f.scale ? v / f.scale : v)
    if (id === 'L2' && f.path.startsWith('energy.fuel.')) {
      // Fuel prices set the index; the engine keeps working on the index.
      const merged = {
        ...overrides,
        [f.path]: v === undefined ? undefined : f.scale ? v / f.scale : v,
      }
      const base = planData.assumptions.energy.fuel!
      const gas = merged['energy.fuel.gasSarPerMmbtu'] ?? base.gasSarPerMmbtu
      const diesel = merged['energy.fuel.dieselSarPerLitre'] ?? base.dieselSarPerLitre
      const share = merged['energy.fuel.gasShare'] ?? base.gasShare
      setLever('L2', Math.max(0, indexFromFuel(gas, diesel, share, base)))
    }
  }

  const exact = (() => {
    switch (id) {
      case 'L1':
        return {
          label: `${I.exact}, ${strings.levers.short.L1}`,
          unit: I.units.x,
          value: levers.L1.multiplier,
          step: 0.01,
          min: 0.7,
          max: 1.3,
          set: (v: number) => setLever('L1', { ...levers.L1, multiplier: v }),
        }
      case 'L2':
        return {
          label: `${I.exact}, ${strings.levers.short.L2}`,
          unit: I.units.index,
          value: levers.L2,
          step: 1,
          min: 0,
          max: 400,
          set: (v: number) => setLever('L2', v),
        }
      case 'L3':
        return {
          label: `${I.exact}, ${strings.levers.short.L3}`,
          unit: I.units.sarm,
          value: levers.L3,
          step: 1,
          min: 0,
          max: 5000,
          set: (v: number) => setLever('L3', v),
        }
      case 'L6':
        return {
          label: `${I.exact}, ${strings.levers.short.L6}`,
          unit: I.units.sarTco2,
          value: levers.L6,
          step: 1,
          min: 0,
          max: 1000,
          set: (v: number) => setLever('L6', v),
        }
      default:
        return null
    }
  })()

  const dark = true
  return (
    <div className="lever-inputs min-w-0" data-testid={`inputs-${id}`}>
      {exact && (
        <NumberField
          id={`exact-${id}`}
          label={exact.label}
          unit={exact.unit}
          value={exact.value}
          step={exact.step}
          min={exact.min}
          max={exact.max}
          onChange={(v) => {
            if (v !== undefined) exact.set(Math.min(exact.max, Math.max(exact.min, v)))
          }}
          dark={dark}
        />
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`assumptions-${id}`}
        onClick={() => setOpen(!open)}
        className={`mt-1 flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left transition-colors duration-150 ${
          open
            ? 'border-teal/60 text-white'
            : 'border-line-dark text-muted-dark hover:border-teal/60 hover:text-white'
        }`}
      >
        <span className="text-[13px]">
          {I.toggle}
          <span className="num ml-1.5 text-[12px] text-muted-dark">({paths.length})</span>
        </span>
        <span className="flex items-center gap-2 text-[12px]">
          {editedCount > 0 && (
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-teal">
              {I.edited(editedCount)}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={`assumptions-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
            <p className="mt-2 text-[12px] text-muted-dark">{I.hint}</p>
            {groups.length === 0 && <p className="mt-2 text-[13px] text-muted-dark">{I.none}</p>}
            {groups.map((g) => (
              <div key={g.id} className="mt-3">
                <div className="label mb-1 text-muted-dark">{g.title}</div>
                {g.fields.map((f) => (
                  <NumberField
                    key={f.path}
                    id={`field-${f.path}`}
                    label={f.label}
                    unit={f.unit}
                    value={valueOf(f)}
                    edited={f.path in overrides}
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    onChange={(v) => write(f, v)}
                    dark={dark}
                  />
                ))}
              </div>
            ))}
            {editedCount > 0 && (
              <button
                type="button"
                onClick={() => resetOverrides(paths)}
                className="mt-3 rounded-full border border-line-dark px-3 py-1 font-heading text-[12px] text-white transition-colors duration-150 hover:border-coral hover:text-coral"
              >
                {I.reset}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
