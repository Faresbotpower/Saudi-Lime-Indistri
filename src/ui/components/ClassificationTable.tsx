import { motion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { presetPlans } from '../../state/plan'
import { strings } from '../../strings'
import { categoryChip } from './categoryColors'

export function ClassificationTable({ plan }: { plan: PlanResult }) {
  const D = strings.direction
  const base = Object.fromEntries(presetPlans().base.classification.map((c) => [c.id, c.category]))
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th className="label px-3 py-2 font-medium text-muted">{D.cols.cell}</th>
            <th className="label px-3 py-2 font-medium text-muted">{D.cols.category}</th>
            <th className="label px-3 py-2 font-medium text-muted">{D.cols.rationale}</th>
            <th className="label px-3 py-2 font-medium text-muted">{D.cols.delta}</th>
          </tr>
        </thead>
        <tbody>
          {plan.classification.map((c) => {
            const was = base[c.id]
            const changed = was !== undefined && was !== c.category
            return (
              <motion.tr
                key={c.id}
                layout
                data-testid="class-row"
                className="border-t border-line align-top text-navy"
              >
                <td className="px-3 py-2 font-heading text-[14px] text-ink">{c.label}</td>
                <td className="px-3 py-2">
                  <span
                    className={`label inline-block rounded-full px-2 py-0.5 ${categoryChip[c.category]}`}
                  >
                    {D.categories[c.category]}
                  </span>
                </td>
                <td className="px-3 py-2 text-[13px] leading-snug text-muted">{c.rationale}</td>
                <td className="px-3 py-2 text-[13px] whitespace-nowrap">
                  {changed ? (
                    <motion.span
                      data-testid="class-delta"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-ink"
                    >
                      {D.categories[was]} → {D.categories[c.category]}
                    </motion.span>
                  ) : (
                    <span className="text-muted">
                      {plan.scenarioName === 'base' ? '' : D.unchanged}
                    </span>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
