import { motion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { strings } from '../../strings'
import { sarm } from '../format'
import { CountUp } from './CountUp'
import { ExplainButton } from './ExplainButton'

export function CapitalStrip({ plan }: { plan: PlanResult }) {
  const S = strings.portfolio.strip
  const { envelope, committed, headroom } = plan.capital
  const share = envelope > 0 ? Math.min(1, committed / envelope) : 0
  const counts = { in: 0, deferred: 0, out: 0 }
  for (const i of plan.initiatives) counts[i.status] += 1
  return (
    <div data-testid="capital-strip" data-tour="capital" className="grid grid-cols-6 gap-6">
      <div className="col-span-3 rounded-card bg-white p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-2">
            <span className="label text-muted">{S.envelope}</span>
            <ExplainButton traceKey="capital" />
          </span>
          <span className="num text-[13px] text-muted">SAR {sarm(envelope)}m</span>
        </div>
        <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-sand-2">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-teal"
            animate={{ width: `${share * 100}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[13px]">
          <span>
            <span className="label text-muted">{S.committed}</span>{' '}
            <span data-testid="committed" className="num font-heading text-[16px] text-ink">
              SAR <CountUp value={committed} format={sarm} />m
            </span>
          </span>
          <span className="text-right">
            <span className="label text-muted">{S.headroom}</span>{' '}
            <span
              data-testid="headroom"
              className={`num font-heading text-[16px] ${headroom < 0 ? 'text-coral' : 'text-ink'}`}
            >
              SAR <CountUp value={headroom} format={sarm} />m
            </span>
          </span>
        </div>
      </div>
      <div className="col-span-2 rounded-card bg-white p-5 shadow-card">
        <div className="label text-muted">{S.counts}</div>
        <div className="num mt-2 grid grid-cols-3 gap-2 font-heading">
          {(['in', 'deferred', 'out'] as const).map((k) => (
            <div key={k}>
              <div
                className={`text-[28px] leading-none ${k === 'in' ? 'text-teal-dim' : k === 'deferred' ? 'text-[#8a5a00]' : 'text-coral'}`}
              >
                {counts[k]}
              </div>
              <div className="mt-1 text-[13px] text-muted">{strings.portfolio.columns[k]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-card bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="label text-muted">{S.diversification}</div>
          <ExplainButton traceKey="diversification" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span data-testid="diversification" className="num font-heading text-[28px] text-ink">
            <CountUp value={plan.diversificationShare2031 * 100} format={(v) => v.toFixed(0)} />
          </span>
          <span className="text-[13px] text-muted">%</span>
        </div>
      </div>
    </div>
  )
}
