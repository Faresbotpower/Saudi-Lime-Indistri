import { AnimatePresence, motion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { planData } from '../../data'
import { strings } from '../../strings'
import { triggerSentence } from '../triggerText'
import { useLevers } from '../../state/levers'
import { Card } from './Card'
import { Slash } from './Slash'

const tone: Record<string, string> = {
  in: 'text-teal-dim',
  deferred: 'text-[#8a5a00]',
  out: 'text-coral',
}

export function TriggersFired({ plan }: { plan: PlanResult }) {
  const T = strings.tracker
  const L3 = useLevers((s) => s.levers.L3)
  const name = Object.fromEntries(planData.initiatives.initiatives.map((i) => [i.id, i.name]))
  const fired = plan.triggersFired
  return (
    <Card title={T.fired} lead={T.firedLead} testId="triggers-fired">
      <AnimatePresence initial={false} mode="popLayout">
        {fired.length === 0 ? (
          <motion.p
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[14px] text-muted"
          >
            {T.none}
          </motion.p>
        ) : (
          fired.map((t) => {
            const planInit = plan.initiatives.find((i) => i.id === t.id)!
            return (
              <motion.div
                key={t.id}
                data-testid="trigger-fired"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 rounded-lg border border-line p-3 last:mb-0"
              >
                <div className="flex items-start gap-2">
                  <Slash
                    size={16}
                    className="mt-0.5"
                    color={t.to === 'in' ? '#0f9c7e' : t.to === 'out' ? '#e4634f' : '#f2b24c'}
                  />
                  <div className="min-w-0">
                    <div className="font-heading text-[15px] text-ink">{name[t.id]}</div>
                    <div className="mt-0.5 text-[13px] text-navy">
                      <span className={tone[t.from]}>{strings.portfolio.columns[t.from]}</span>
                      <span className="text-muted"> → </span>
                      <span className={tone[t.to]}>{strings.portfolio.columns[t.to]}</span>
                      <span className="text-muted"> · {triggerSentence(planInit, L3)}</span>
                    </div>
                    <div className="mt-1 text-[13px]">
                      <span className="label mr-2 text-muted">{T.decision}</span>
                      <span className="text-ink">{T.decisions[t.to]}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </AnimatePresence>
    </Card>
  )
}
