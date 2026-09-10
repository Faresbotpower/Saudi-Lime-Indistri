import { leverDefs, scenarioOrder, type LeverDef, type LeverId, type LeverValues } from '../../data'
import { strings } from '../../strings'
import { useLevers } from '../../state/levers'
import { Slash } from '../components/Slash'
import { useRafThrottle } from '../useRafThrottle'
import { LeverInputs } from '../components/LeverInputs'

const fmt = new Intl.NumberFormat('en-US')

function Segmented({
  options,
  labels,
  value,
  onChange,
}: {
  options: string[]
  labels: Record<string, string>
  value: string
  onChange: (o: string) => void
}) {
  return (
    <div
      role="radiogroup"
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => {
        const active = o === value
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o)}
            className={`rounded-lg border px-2 py-1.5 text-center font-heading text-[13px] leading-tight transition-colors duration-150 ${
              active
                ? 'border-teal bg-teal/10 text-teal'
                : 'border-line-dark text-muted-dark hover:border-muted-dark hover:text-white'
            }`}
          >
            {labels[o] ?? o}
          </button>
        )
      })}
    </div>
  )
}

function Slider({
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  ariaLabel: string
}) {
  const fill = ((value - min) / (max - min)) * 100
  const throttled = useRafThrottle<number>(onChange)
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => throttled(Number(e.target.value))}
      style={{ ['--fill' as string]: `${fill}%` }}
    />
  )
}

function leverValueLabel(def: LeverDef, levers: LeverValues): string {
  switch (def.id) {
    case 'L1':
      return `${strings.levers.L1.options[levers.L1.option]}, ${levers.L1.multiplier.toFixed(2)}x`
    case 'L2':
      return `${levers.L2}`
    case 'L3':
      return `SAR ${fmt.format(levers.L3)}m`
    case 'L4':
    case 'L5':
    case 'L6': {
      const idx = def.values!.indexOf(levers[def.id])
      const opt = def.options![idx]
      const spec = strings.levers[def.id] as {
        options: Record<string, string>
        long?: Record<string, string>
      }
      const label = spec.long?.[opt] ?? spec.options[opt] ?? opt
      return def.id === 'L6' && levers.L6 > 0 ? `${label}, SAR ${levers.L6}/t` : label
    }
  }
}

function Lever({ def }: { def: LeverDef }) {
  const levers = useLevers((s) => s.levers)
  const setLever = useLevers((s) => s.setLever)
  const setHovered = useLevers((s) => s.setHoveredLever)
  const lit = useLevers((s) => s.litLevers.includes(def.id))

  const control = (() => {
    switch (def.id) {
      case 'L1':
        return (
          <div className="grid gap-2">
            <Segmented
              options={def.options!}
              labels={strings.levers.L1.options}
              value={levers.L1.option}
              onChange={(o) =>
                setLever('L1', { ...levers.L1, option: o as LeverValues['L1']['option'] })
              }
            />
            <div className="mt-1">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="label text-muted-dark">{strings.levers.L1.fine}</span>
                <span className="num text-[13px] text-muted-dark">
                  {def.sliderRange![0].toFixed(1)}x to {def.sliderRange![1].toFixed(1)}x
                </span>
              </div>
              <Slider
                min={def.sliderRange![0]}
                max={def.sliderRange![1]}
                step={0.05}
                value={levers.L1.multiplier}
                ariaLabel={strings.levers.L1.fine}
                onChange={(v) => setLever('L1', { ...levers.L1, multiplier: v })}
              />
            </div>
          </div>
        )
      case 'L2':
      case 'L3':
        return (
          <div className="flex items-center gap-3">
            <span className="num w-8 text-[13px] text-muted-dark">{def.range![0]}</span>
            <Slider
              min={def.range![0]}
              max={def.range![1]}
              step={def.step ?? 1}
              value={levers[def.id]}
              ariaLabel={def.name}
              onChange={(v) => setLever(def.id, v)}
            />
            <span className="num w-10 text-right text-[13px] text-muted-dark">
              {fmt.format(def.range![1])}
            </span>
          </div>
        )
      default: {
        const idx = def.values!.indexOf(levers[def.id] as number)
        const labels = strings.levers[def.id as 'L4' | 'L5' | 'L6'].options as Record<
          string,
          string
        >
        return (
          <Segmented
            options={def.options!}
            labels={labels}
            value={def.options![idx]}
            onChange={(o) => setLever(def.id, def.values![def.options!.indexOf(o)] as never)}
          />
        )
      }
    }
  })()

  return (
    <section
      data-lit={lit ? 'true' : 'false'}
      className={`group rounded-card border bg-ink-2 p-4 transition-colors duration-200 hover:border-[#2f4a5f] ${
        lit ? 'border-teal shadow-[0_0_0_1px_var(--teal)]' : 'border-line-dark'
      }`}
      onMouseEnter={() => setHovered(def.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="label text-muted-dark">{def.id}</span>
          <h3 className="text-[14px] font-medium tracking-normal text-white">{def.name}</h3>
        </div>
      </div>
      <div className="num mb-3 font-heading text-[20px] text-teal">
        {leverValueLabel(def, levers)}
      </div>
      {control}
      <p className="mt-3 text-[13px] leading-snug text-muted-dark">{def.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {def.moves.map((k) => (
          <span key={k} className="rounded-chip bg-ink-3 px-2 py-0.5 text-[11px] text-muted-dark">
            {strings.assumptionKeys[k] ?? k}
          </span>
        ))}
      </div>
      <LeverInputs id={def.id} />
    </section>
  )
}

export function LeverRail() {
  const scenario = useLevers((s) => s.scenario)
  const applyPreset = useLevers((s) => s.applyPreset)
  const explain = useLevers((s) => s.explain)
  const toggleExplain = useLevers((s) => s.toggleExplain)

  return (
    <aside
      data-tour="rail"
      className="flex w-[320px] shrink-0 flex-col border-r border-line-dark bg-ink text-white"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Slash size={12} />
          <span className="label text-muted-dark">{strings.rail.presets}</span>
        </div>
        <div data-tour="presets" className="mb-6 grid grid-cols-4 gap-1">
          {scenarioOrder.map((id) => {
            const active = id === scenario
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(id)}
                className={`rounded-full border py-1.5 font-heading text-[13px] transition-colors duration-150 ${
                  active
                    ? 'border-teal bg-teal text-ink'
                    : 'border-line-dark text-muted-dark hover:border-muted-dark hover:text-white'
                }`}
              >
                {strings.scenarios[id]}
              </button>
            )
          })}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Slash size={12} />
          <span className="label text-muted-dark">{strings.rail.levers}</span>
        </div>
        <div className="grid gap-3">
          {leverDefs.map((def) => (
            <Lever key={def.id} def={def} />
          ))}
        </div>
        <section
          className="mt-3 rounded-card border border-line-dark bg-ink-2 p-4"
          data-testid="base-inputs-card"
        >
          <h3 className="text-[14px] font-medium tracking-normal text-white">
            {strings.inputs.base}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-muted-dark">{strings.inputs.baseLead}</p>
          <LeverInputs id="base" />
        </section>
      </div>

      <div className="border-t border-line-dark px-4 py-4">
        <label
          data-tour="explain"
          className="flex cursor-pointer items-center justify-between gap-3"
        >
          <span>
            <span className="block font-heading text-[14px] text-white">
              {strings.rail.explain}
            </span>
            <span className="block text-[13px] text-muted-dark">{strings.rail.explainHint}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={explain}
            aria-label={strings.rail.explain}
            onClick={toggleExplain}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${explain ? 'bg-teal' : 'bg-ink-3'}`}
          >
            <span
              className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                explain ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>
    </aside>
  )
}

export type { LeverId }
