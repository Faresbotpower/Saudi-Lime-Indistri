import './analytics.css'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlanResult } from '../../engine'
import { presetPlans, useData } from '../../state/plan'
import { strings } from '../../strings'
import { categoryChip } from './categoryColors'
import { ExplainButton } from './ExplainButton'

export function ClassificationTable({ plan }: { plan: PlanResult }) {
  const reduced = useReducedMotion()
  const D = strings.direction
  const base = Object.fromEntries(
    presetPlans(useData()).base.classification.map((c) => [c.id, c.category]),
  )
  return (
    <div
      className="analytics-table-scroll classificationtable rounded-lg border border-line"
      tabIndex={0}
      role="region"
      aria-label={D.cols.cell}
    >
      <table className="w-full text-[16px]">
        <thead>
          <tr className="bg-sand-2 text-left">
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {D.cols.cell}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {D.cols.category}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {D.cols.rationale}
            </th>
            <th scope="col" className="label px-3 py-2 font-medium text-muted">
              {D.cols.delta}
            </th>
          </tr>
        </thead>
        <tbody>
          {plan.classification.map((c) => {
            const was = base[c.id]
            const changed = was !== undefined && was !== c.category
            return (
              <motion.tr
                key={c.id}
                layout={!reduced}
                data-changed={changed}
                transition={{ duration: reduced ? 0.12 : 0.35 }}
                data-testid="class-row"
                className="border-t border-line align-top text-navy"
              >
                <td className="px-3 py-2 font-heading text-[15px] text-ink">
                  <span className="flex items-center gap-2">
                    {c.label}
                    <ExplainButton traceKey={`classification.${c.id}`} />
                  </span>
                </td>
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
                      transition={{ duration: reduced ? 0.12 : 0.3 }}
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
