import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PlanResult } from '../../engine'
import type { LeverId } from '../../engine/types'
import { planData } from '../../data'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'
import {
  buildGraph,
  litPath,
  PLAN_LINES,
  type Graph,
  type Hover,
  type LitPath,
} from '../strataGraph'
import { prefersReducedMotion } from '../format'
import { Slash } from './Slash'

type Band = 'assumptions' | 'initiatives' | 'plan'
const BANDS: Band[] = ['assumptions', 'initiatives', 'plan']
const DELAY: Record<Band, number> = { assumptions: 0, initiatives: 0.12, plan: 0.24 }
const statusFill: Record<string, string> = { in: '#1de9b6', deferred: '#f2b24c', out: '#e4634f' }

type Edge = { x1: number; y1: number; x2: number; y2: number; band: Band }
type Lit = { hover: Hover | null; path: LitPath; edges: Edge[] }
const DARK: Lit = {
  hover: null,
  path: { levers: [], assumptions: [], initiatives: [], lines: [], shifts: [], objectives: [] },
  edges: [],
}

/** Connector geometry between lit chips, measured from the DOM at hover time. */
function measureEdges(
  graph: Graph,
  path: LitPath,
  container: HTMLElement | null,
  chips: Map<string, HTMLElement>,
): Edge[] {
  if (!container) return []
  const box = container.getBoundingClientRect()
  const at = (band: Band, id: string) => {
    const el = chips.get(`${band}:${id}`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left - box.left + r.width / 2, top: r.top - box.top, bottom: r.bottom - box.top }
  }
  const edges: Edge[] = []
  const lit = new Set(path.levers)
  for (const a of path.assumptions) {
    const from = at('assumptions', a)
    if (!from) continue
    const levers = graph.assumptionLevers[a].filter((l) => lit.has(l))
    const targets = path.initiatives.filter((i) =>
      levers.some((l) => graph.leverInitiatives[l].includes(i)),
    )
    const tos = targets.length
      ? targets.map((i) => at('initiatives', i))
      : path.lines.map((l) => at('plan', l))
    for (const to of tos)
      if (to) edges.push({ x1: from.x, y1: from.bottom, x2: to.x, y2: to.top, band: 'initiatives' })
  }
  for (const i of path.initiatives) {
    const from = at('initiatives', i)
    if (!from) continue
    for (const line of path.lines.filter((l) => graph.initiativeLines[i].includes(l))) {
      const to = at('plan', line)
      if (to) edges.push({ x1: from.x, y1: from.bottom, x2: to.x, y2: to.top, band: 'plan' })
    }
  }
  return edges
}

export function StrataReveal({ plan }: { plan: PlanResult }) {
  const setLitLevers = useLevers((s) => s.setLitLevers)
  const graph = useMemo(() => buildGraph(planData, plan), [plan])
  const [lit, setLit] = useState<Lit>(DARK)
  const containerRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef(new Map<string, HTMLElement>())
  const chipHover = useRef<Hover | null>(null)

  const light = useCallback(
    (hover: Hover | null) => {
      if (!hover) {
        setLit(DARK)
        return
      }
      const path = litPath(graph, hover)
      setLit({
        hover,
        path,
        edges: measureEdges(graph, path, containerRef.current, chipRefs.current),
      })
    },
    [graph],
  )

  // The rail's hover reaches the reveal through the store; a chip hover wins while it lasts.
  useEffect(() => {
    const apply = (rail: LeverId | null, shift: string | null = null) =>
      light(
        chipHover.current ??
          (shift ? { kind: 'shift', id: shift } : rail ? { kind: 'lever', id: rail } : null),
      )
    const unsub = useLevers.subscribe((s, prev) => {
      if (s.hoveredLever !== prev.hoveredLever || s.hoveredShift !== prev.hoveredShift)
        apply(s.hoveredLever, s.hoveredShift)
    })
    const t = window.setTimeout(
      () => apply(useLevers.getState().hoveredLever, useLevers.getState().hoveredShift),
      0,
    )
    const onResize = () =>
      apply(useLevers.getState().hoveredLever, useLevers.getState().hoveredShift)
    window.addEventListener('resize', onResize)
    return () => {
      unsub()
      window.clearTimeout(t)
      window.removeEventListener('resize', onResize)
    }
  }, [light])

  // Chip hovers light the matching lever cards in the rail.
  useEffect(() => {
    setLitLevers(lit.hover && lit.hover.kind !== 'lever' ? lit.path.levers : [])
    return () => setLitLevers([])
  }, [lit, setLitLevers])

  const enterChip = (h: Hover) => {
    chipHover.current = h
    light(h)
  }
  const leaveChip = () => {
    chipHover.current = null
    const { hoveredLever: rail, hoveredShift: shift } = useLevers.getState()
    light(shift ? { kind: 'shift', id: shift } : rail ? { kind: 'lever', id: rail } : null)
  }

  const reduced = prefersReducedMotion()
  const anyLit = lit.hover !== null
  const path = lit.path
  const initName = Object.fromEntries(planData.initiatives.initiatives.map((i) => [i.id, i.name]))
  const initStatus = Object.fromEntries(plan.initiatives.map((i) => [i.id, i.status]))
  const D = strings.direction

  const chipsFor = (band: Band): { id: string; label: string; lit: boolean; fill: string }[] => {
    if (band === 'assumptions')
      return graph.assumptions.map((a) => ({
        id: a,
        label: strings.assumptionKeys[a] ?? a,
        lit: path.assumptions.includes(a),
        fill: '#1de9b6',
      }))
    if (band === 'initiatives')
      return graph.initiatives.map((i) => ({
        id: i,
        label: initName[i],
        lit: path.initiatives.includes(i),
        fill: statusFill[initStatus[i]],
      }))
    return PLAN_LINES.map((l) => ({
      id: l,
      label: D.lines[l],
      lit: path.lines.includes(l),
      fill: '#1de9b6',
    }))
  }
  const hoverFor = (band: Band, id: string): Hover =>
    band === 'assumptions'
      ? { kind: 'assumption', id }
      : band === 'initiatives'
        ? { kind: 'initiative', id }
        : { kind: 'line', id: id as never }

  return (
    <section
      data-testid="strata-reveal"
      data-tour="strata"
      className="relative overflow-hidden rounded-card bg-ink text-white"
    >
      <div className="flex items-start justify-between gap-6 px-6 pt-5">
        <div>
          <h2 className="text-[20px] text-white">{D.reveal}</h2>
          <p className="mt-0.5 text-[13px] text-muted-dark">{D.revealLead}</p>
        </div>
        <p className="num shrink-0 pt-1 text-[13px] text-muted-dark" aria-live="polite">
          {anyLit
            ? D.lit(path.assumptions.length, path.initiatives.length, path.lines.length)
            : D.idle}
        </p>
      </div>

      <div ref={containerRef} className="relative mt-4">
        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true">
          {lit.edges.map((e, k) => (
            <motion.path
              key={`${lit.hover?.kind}-${lit.hover?.id}-${k}`}
              d={`M ${e.x1} ${e.y1} C ${e.x1} ${(e.y1 + e.y2) / 2}, ${e.x2} ${(e.y1 + e.y2) / 2}, ${e.x2} ${e.y2}`}
              stroke="#1de9b6"
              strokeWidth={1}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.35 }}
              transition={
                reduced
                  ? { duration: 0.12 }
                  : { duration: 0.35, delay: DELAY[e.band], ease: 'easeOut' }
              }
            />
          ))}
        </svg>

        {BANDS.map((band, bi) => (
          <div
            key={band}
            data-testid={`band-${band}`}
            className={`relative grid grid-cols-[140px_1fr] gap-4 border-t border-line-dark px-6 py-4 ${
              bi === 0 ? 'bg-ink' : bi === 1 ? 'bg-ink-2' : 'bg-ink-3'
            }`}
          >
            <div className="pt-1">
              <div className="num text-[11px] text-muted-dark">{D.bandIndex[band]}</div>
              <div className="flex items-center gap-1.5 font-heading text-[15px] text-white">
                <Slash size={12} />
                {D.bands[band]}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {chipsFor(band).map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  data-testid="chip"
                  data-id={c.id}
                  data-lit={c.lit ? 'true' : 'false'}
                  ref={(el) => {
                    if (el) chipRefs.current.set(`${band}:${c.id}`, el)
                    else chipRefs.current.delete(`${band}:${c.id}`)
                  }}
                  onMouseEnter={() => enterChip(hoverFor(band, c.id))}
                  onMouseLeave={leaveChip}
                  onFocus={() => enterChip(hoverFor(band, c.id))}
                  onBlur={leaveChip}
                  animate={{
                    backgroundColor: c.lit ? c.fill : 'rgba(255,255,255,0.05)',
                    color: c.lit ? '#0a151e' : anyLit ? 'rgba(163,163,163,0.45)' : '#a3a3a3',
                    borderColor: c.lit ? c.fill : anyLit ? 'rgba(34,56,74,0.5)' : '#22384a',
                  }}
                  transition={
                    reduced ? { duration: 0.12 } : { duration: 0.2, delay: c.lit ? DELAY[band] : 0 }
                  }
                  className="relative z-20 flex items-center gap-1.5 rounded-full border px-3 py-1 text-left text-[13px] leading-tight"
                >
                  {band === 'initiatives' && (
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: c.lit ? '#0a151e' : c.fill, opacity: c.lit ? 0.6 : 1 }}
                    />
                  )}
                  {c.label}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
