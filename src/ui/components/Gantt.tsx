import { motion } from 'framer-motion'
import type { PlanResult, RoadmapItem } from '../../engine'
import { planData } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'

const ROW = 44
const HEAD = 46
const FIRST = 2027
const LAST = 2031
const QUARTERS = (LAST - FIRST + 1) * 4

const q = (year: number, quarter: number) => ((year - FIRST) * 4 + quarter) / QUARTERS

type Row =
  | { kind: 'head'; label: string; layer: string }
  | { kind: 'item'; item: RoadmapItem; layer: string }

/** Five-year Gantt by quarter, grouped in the RFQ layers, with ghosts, dependency lines and milestones. */
export function Gantt({ plan }: { plan: PlanResult }) {
  const R = strings.roadmap
  const critical = new Set(plan.roadmap.criticalPath)
  const rows: Row[] = []
  for (const layer of plan.roadmap.layers) {
    rows.push({ kind: 'head', label: layer.label, layer: layer.layer })
    for (const item of layer.items) rows.push({ kind: 'item', item, layer: layer.layer })
  }
  const rowTop = (i: number) =>
    rows.slice(0, i).reduce((s, r) => s + (r.kind === 'head' ? HEAD : ROW), 0)
  const total = rowTop(rows.length)
  const indexOf = Object.fromEntries(
    rows.map((r, i) => [r.kind === 'item' ? r.item.id : `head-${r.layer}`, i]),
  )
  const years = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i)

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[960px] grid-cols-[320px_1fr]">
        {/* Header */}
        <div />
        <div className="relative h-8 border-b border-line">
          {years.map((y) => (
            <div
              key={y}
              className="absolute top-0 flex h-8 items-center border-l border-line pl-2 font-heading text-[13px] text-ink"
              style={{ left: `${q(y, 0) * 100}%`, width: `${(4 / QUARTERS) * 100}%` }}
            >
              <span className="num">{y}</span>
              <span className="ml-2 flex gap-2 text-[10px] text-muted">
                {R.quarters.map((qq) => (
                  <span key={qq}>{qq}</span>
                ))}
              </span>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="relative" style={{ height: total }}>
          {rows.map((r, i) => (
            <div
              key={r.kind === 'item' ? r.item.id : r.layer}
              className="absolute inset-x-0 flex items-center pr-4"
              style={{ top: rowTop(i), height: r.kind === 'head' ? HEAD : ROW }}
            >
              {r.kind === 'head' ? (
                <span
                  data-testid="layer"
                  data-layer={r.layer}
                  className="label leading-tight text-muted"
                >
                  {r.label}
                </span>
              ) : (
                <span
                  className={`truncate text-[13px] ${r.item.status === 'in' ? 'text-ink' : 'text-muted'}`}
                  title={r.item.name}
                >
                  {r.item.name}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative" style={{ height: total }}>
          {/* Grid */}
          {Array.from({ length: QUARTERS + 1 }, (_, k) => (
            <span
              key={k}
              className={`absolute inset-y-0 w-px ${k % 4 === 0 ? 'bg-line' : 'bg-line/40'}`}
              style={{ left: `${(k / QUARTERS) * 100}%` }}
            />
          ))}
          {rows.map((r, i) =>
            r.kind === 'head' ? (
              <div
                key={r.layer}
                className="absolute inset-x-0 bg-sand-2/60"
                style={{ top: rowTop(i), height: HEAD }}
              >
                {plan.roadmap.layers.find((l) => l.layer === r.layer)!.items.length === 0 && (
                  <span className="ml-2 text-[11px] leading-9 text-muted">{R.empty}</span>
                )}
              </div>
            ) : null,
          )}

          {/* Dependency lines */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 1000 ${total}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {plan.roadmap.links.map((l) => {
              const from = rows[indexOf[l.from]]
              const to = rows[indexOf[l.to]]
              if (!from || !to || from.kind !== 'item' || to.kind !== 'item') return null
              const x1 = q(from.item.end, 4) * 1000
              const y1 = rowTop(indexOf[l.from]) + ROW / 2
              const x2 = q(to.item.start, 0) * 1000
              const y2 = rowTop(indexOf[l.to]) + ROW / 2
              const xm = Math.max(x1 + 8, x2 - 12)
              return (
                <motion.path
                  key={`${l.from}-${l.to}`}
                  data-testid="dependency-line"
                  d={`M ${x1} ${y1} L ${xm} ${y1} L ${xm} ${y2} L ${x2} ${y2}`}
                  fill="none"
                  stroke="#0f9c7e"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                />
              )
            })}
          </svg>

          {/* Bars */}
          {rows.map((r, i) => {
            if (r.kind !== 'item') return null
            const it = r.item
            const left = q(it.start, 0) * 100
            const width = (q(it.end, 4) - q(it.start, 0)) * 100
            const isCritical = it.status === 'in' && critical.has(it.id)
            const site = planData.assumptions.sites.find((s) => s.id === it.site)?.name
            const title = `${it.name} · ${it.start} to ${it.end}${site ? ` · ${site}` : ''}`
            return (
              <div
                key={it.id}
                className="absolute inset-x-0"
                style={{ top: rowTop(i), height: ROW }}
              >
                {it.status === 'in' ? (
                  <motion.div
                    data-testid={`bar-${it.id}`}
                    data-start={it.start}
                    data-end={it.end}
                    data-critical={isCritical ? 'true' : 'false'}
                    title={title}
                    className={`absolute top-2.5 h-6 rounded-md ${isCritical ? 'bg-teal' : 'bg-ink'}`}
                    initial={false}
                    animate={{ left: `${left}%`, width: `${width}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.35 }}
                  >
                    <span
                      data-testid="bar"
                      className={`block truncate px-2 text-[11px] leading-6 ${isCritical ? 'text-ink' : 'text-white'}`}
                    >
                      {isCritical ? R.critical : ''}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    data-testid={`ghost-${it.id}`}
                    title={title}
                    className="absolute top-2.5 h-6 rounded-md border border-dashed border-amber bg-amber/10"
                    initial={false}
                    animate={{ left: `${left}%`, width: `${width}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.35 }}
                  >
                    <span
                      data-testid="ghost"
                      className="block truncate px-2 text-[11px] leading-6 text-[#8a5a00]"
                    >
                      {it.needsCapital !== undefined ? R.needs(sarm(it.needsCapital)) : R.ghost}
                    </span>
                  </motion.div>
                )}
                {it.status === 'in' && (
                  <motion.span
                    data-testid={`milestone-${it.id}`}
                    title={`${R.milestone} ${it.milestone}`}
                    className={`absolute top-[15px] h-3.5 w-3.5 rotate-45 border-2 border-white ${isCritical ? 'bg-teal' : 'bg-ink'}`}
                    initial={false}
                    animate={{ left: `calc(${q(it.milestone, 4) * 100}% - 7px)` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.35 }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
