import { motion } from 'framer-motion'
import { useState } from 'react'
import type { PlanResult } from '../../engine'
import { planData } from '../../data'
import { strings } from '../../strings'
import { sarm } from '../format'
import { categoryColor } from './categoryColors'

const W = 560
const H = 400
const M = { top: 20, right: 20, bottom: 44, left: 48 }

/** Attractiveness (y) against competitive position (x). Bubbles animate when levers move. */
export function WhereToPlay({ plan }: { plan: PlanResult }) {
  const [hover, setHover] = useState<string | null>(null)
  const th = planData.assumptions.classificationThresholds
  const D = strings.direction
  const x = (v: number) => M.left + (v / 100) * (W - M.left - M.right)
  const y = (v: number) => H - M.bottom - (v / 100) * (H - M.top - M.bottom)
  const maxRev = Math.max(1, ...plan.classification.map((c) => c.revenue2031))
  const r = (rev: number) => 8 + 26 * Math.sqrt(rev / maxRev)
  const cells = [...plan.classification].sort((a, b) => b.revenue2031 - a.revenue2031)
  const hovered = cells.find((c) => c.id === hover)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={D.matrix}>
        {/* Quadrant fills */}
        <rect
          x={x(th.grow.position)}
          y={M.top}
          width={x(100) - x(th.grow.position)}
          height={y(th.grow.attractiveness) - M.top}
          fill="#0f9c7e"
          opacity={0.06}
        />
        <rect
          x={M.left}
          y={y(th.exit.attractiveness)}
          width={x(th.exit.position) - M.left}
          height={y(0) - y(th.exit.attractiveness)}
          fill="#e4634f"
          opacity={0.06}
        />
        {/* Threshold lines */}
        <line
          x1={x(th.grow.position)}
          x2={x(th.grow.position)}
          y1={M.top}
          y2={y(0)}
          stroke="#d6d6d6"
          strokeDasharray="4 4"
        />
        <line
          x1={M.left}
          x2={x(100)}
          y1={y(th.grow.attractiveness)}
          y2={y(th.grow.attractiveness)}
          stroke="#d6d6d6"
          strokeDasharray="4 4"
        />
        {/* Axes */}
        <line x1={M.left} x2={x(100)} y1={y(0)} y2={y(0)} stroke="#d6d6d6" />
        <line x1={M.left} x2={M.left} y1={M.top} y2={y(0)} stroke="#d6d6d6" />
        <text
          x={(M.left + x(100)) / 2}
          y={H - 10}
          textAnchor="middle"
          className="label"
          fill="#6f7a85"
          fontSize={11}
        >
          {D.axisX}
        </text>
        <text
          x={14}
          y={(M.top + y(0)) / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${(M.top + y(0)) / 2})`}
          className="label"
          fill="#6f7a85"
          fontSize={11}
        >
          {D.axisY}
        </text>
        {/* Quadrant labels */}
        <text
          x={x(100) - 8}
          y={M.top + 14}
          textAnchor="end"
          fill="#0f9c7e"
          fontSize={11}
          className="label"
        >
          {D.quadrants.grow}
        </text>
        <text x={M.left + 8} y={M.top + 14} fill="#4a6b85" fontSize={11} className="label">
          {D.quadrants.improve}
        </text>
        <text
          x={x(100) - 8}
          y={y(0) - 8}
          textAnchor="end"
          fill="#6f7a85"
          fontSize={11}
          className="label"
        >
          {D.quadrants.maintain}
        </text>
        <text x={M.left + 8} y={y(0) - 8} fill="#e4634f" fontSize={11} className="label">
          {D.quadrants.exit}
        </text>
        {/* Bubbles */}
        {cells.map((c) => (
          <g
            key={c.id}
            data-testid="bubble"
            onMouseEnter={() => setHover(c.id)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'default' }}
          >
            <motion.circle
              animate={{
                cx: x(c.position),
                cy: y(c.attractiveness),
                r: r(c.revenue2031),
                fill: categoryColor[c.category],
              }}
              initial={false}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              opacity={hover && hover !== c.id ? 0.35 : 0.85}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <motion.text
              animate={{ x: x(c.position), y: y(c.attractiveness) + r(c.revenue2031) + 12 }}
              initial={false}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              textAnchor="middle"
              fontSize={11}
              fill="#173044"
              opacity={hover && hover !== c.id ? 0.4 : 1}
            >
              {D.cellShort[c.id] ?? c.label}
            </motion.text>
          </g>
        ))}
      </svg>
      {hovered && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-[12px] shadow-card">
          <div className="font-heading text-[13px] text-ink">{hovered.label}</div>
          <div className="flex items-center gap-2 text-muted">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: categoryColor[hovered.category] }}
            />
            {D.categories[hovered.category]}
            <span className="num text-ink">SAR {sarm(hovered.revenue2031)}m</span>
          </div>
        </div>
      )}
    </div>
  )
}
