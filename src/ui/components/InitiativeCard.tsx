import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { PlanInitiative } from '../../engine'
import type { Initiative } from '../../engine/types'
import { leverValue } from '../../engine/rules'
import { strings } from '../../strings'
import { sarm, signed, prefersReducedMotion } from '../format'
import { triggerSentence } from '../triggerText'
import { TriggerBar } from './TriggerBar'
import { useLevers } from '../../state/levers'
import { ExplainButton } from './ExplainButton'
import { planData } from '../../data'

const nameOf = (id: string) => planData.initiatives.initiatives.find((i) => i.id === id)?.name ?? id
const objectiveName = (id: string) =>
  planData.objectives.objectives.find((o) => o.id === id)?.name ?? id

const pulseColor = {
  in: 'rgba(29, 233, 182, 0.55)',
  deferred: 'rgba(242, 178, 76, 0.6)',
  out: 'rgba(228, 99, 79, 0.55)',
}

type Props = { init: Initiative; plan: PlanInitiative; onOpen: (id: string) => void }

export function InitiativeCard({ init, plan, onOpen }: Props) {
  const levers = useLevers((s) => s.levers)
  const controls = useAnimationControls()
  const prev = useRef(plan.status)
  const C = strings.portfolio.card

  useEffect(() => {
    if (prev.current !== plan.status) {
      prev.current = plan.status
      if (!prefersReducedMotion())
        void controls.start({
          boxShadow: [`0 0 0 0 ${pulseColor[plan.status]}`, `0 0 0 10px rgba(0,0,0,0)`],
          transition: { duration: 0.6, ease: 'easeOut' },
        })
    }
  }, [plan.status, controls])

  const badge =
    plan.status === 'in'
      ? 'bg-teal/15 text-teal-dim'
      : plan.status === 'deferred'
        ? 'bg-amber/20 text-[#8a5a00]'
        : 'bg-coral/12 text-coral'
  const current = plan.trigger ? leverValue(levers, plan.trigger.leverId) : 0

  return (
    <motion.article
      layout
      layoutId={`card-${init.id}`}
      data-testid="initiative-card"
      data-status={plan.status}
      animate={controls}
      transition={{ layout: { type: 'spring', stiffness: 350, damping: 36, delay: 0.1 } }}
      className="rounded-card bg-white p-4 shadow-card"
    >
      <div data-testid={`card-${init.id}`} className="initiative-layout">
        <div className="initiative-title mb-2 flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpen(init.id)}
            className="text-left font-heading text-[15px] leading-snug text-ink hover:text-teal-dim"
          >
            {init.name}
          </button>
          <span className="flex shrink-0 items-center gap-1.5">
            <ExplainButton traceKey={`initiative.${init.id}`} />
            <span className={`label shrink-0 rounded-full px-2 py-0.5 ${badge}`}>
              {strings.portfolio.layers[init.layer] ?? init.layer}
            </span>
          </span>
        </div>
        <dl className="num grid grid-cols-3 gap-2 text-[13px]">
          <div>
            <dt className="label text-muted">
              {C.capex} <span className="initiative-unit">SAR m</span>
            </dt>
            <dd className="text-ink">{sarm(plan.capex)}</dd>
          </div>
          <div>
            <dt className="label text-muted">
              {C.npv} <span className="initiative-unit">SAR m</span>
            </dt>
            <dd className={plan.npv < 0 ? 'text-coral' : 'text-ink'}>{signed(plan.npv)}</dd>
          </div>
          <div>
            <dt className="label text-muted">
              {C.ebitda} <span className="initiative-unit">SAR m</span>
            </dt>
            <dd className="text-ink">{sarm(plan.ebitdaRunRate)}</dd>
          </div>
        </dl>
        <div className="initiative-cascade mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <span className="label">{C.serves}</span>
          {init.objectives.map((o) => (
            <span
              key={o}
              className="num rounded-chip bg-teal/10 px-1.5 py-0.5 text-[11px] text-teal-dim"
              title={objectiveName(o)}
            >
              {o}
            </span>
          ))}
          <span aria-hidden="true">·</span>
          <span className="num">{C.projects(init.projects.length)}</span>
        </div>
        <div className="initiative-ownership mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <span>{init.owner}</span>
          {plan.startYear && plan.status !== 'out' && (
            <span className="num">
              · {C.start} {plan.startYear}
            </span>
          )}
          {init.dependencies.map((d) => (
            <span key={d} className="rounded-chip bg-sand-2 px-1.5 py-0.5 text-[11px] text-navy">
              {C.dependsOn} {nameOf(d)}
            </span>
          ))}
        </div>
        <div className="initiative-reason mt-3" data-testid="trigger">
          <span className="initiative-reason-label">
            Why {strings.portfolio.columns[plan.status].toLowerCase()}
          </span>
          <p className="mb-1.5 text-[13px] text-navy">{triggerSentence(plan, levers.L3)}</p>
          {plan.trigger && !(plan.status === 'deferred' && plan.reason !== 'capital') && (
            <TriggerBar trigger={plan.trigger} current={current} status={plan.status} />
          )}
        </div>
      </div>
    </motion.article>
  )
}
