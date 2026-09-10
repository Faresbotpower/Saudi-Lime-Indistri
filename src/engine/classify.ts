import type { CoreResult, Levers, PlanData, Trace, TraceEntry } from './types'

export const CATEGORIES = ['grow', 'maintain', 'improve', 'restructure', 'harvest', 'exit'] as const
export type Category = (typeof CATEGORIES)[number]

export type Cell = {
  id: string
  label: string
  family: string
  market: string
  attractiveness: number
  position: number
  category: Category
  revenue2031: number
  growth: number
  margin: number
  rationale: string
}

export type Classification = {
  cells: Cell[]
  byId: Record<string, Cell>
  /** Category per product family, for rule expressions such as classification.bricks.category. */
  forRules: Record<string, { category: Category }>
  trace: Trace
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const norm = (x: number, lo: number, hi: number) => clamp01((x - lo) / (hi - lo))

/** Capacity fit peaks at 85% utilization: idle assets and saturated assets both score lower. */
const fit = (u: number) => clamp01(1 - Math.abs(u - 0.85) / 0.35)

/**
 * Pipeline step 8. Score each product-market cell on attractiveness (demand growth, price
 * index, margin) and position (share, capacity fit), then map to the six categories with the
 * thresholds in the data. Export markets are included up to the L5 ambition level.
 */
export function classify(levers: Levers, data: PlanData, core: CoreResult): Classification {
  const a = data.assumptions
  const th = a.classificationThresholds
  const last = core.years.length - 1
  const familyOf = Object.fromEntries(a.products.map((p) => [p.id, p.family]))
  const trace: Trace = {}
  const cells: Cell[] = []

  const decide = (attr: number, pos: number, margin: number, growth: number): Category => {
    if (attr < th.exit.attractiveness && pos < th.exit.position) return 'exit'
    if (margin < th.restructure.marginBelow) return 'restructure'
    if (pos >= th.harvest.position && growth < th.harvest.growthBelow) return 'harvest'
    if (attr >= th.grow.attractiveness && pos >= th.grow.position) return 'grow'
    if (attr >= th.improve.attractiveness && pos < th.grow.position) return 'improve'
    if (attr >= th.maintain.attractiveness && pos >= th.maintain.position) return 'maintain'
    return pos >= th.maintain.position ? 'harvest' : 'improve'
  }

  // Domestic sectors.
  for (const s of a.sectors) {
    const fam = familyOf[s.product]
    const growth = s.growth * levers.L1.multiplier
    const priceIndex = core.price.priceIndexByFamily[fam][last]
    const price = core.price.domesticPriceByFamily[fam][last] * core.calibration.price
    const unitCost = core.cost.costPerTonByFamily[fam][last]
    const carbon = fam === 'lime' ? core.cost.carbonCostPerTonLime : 0
    const cost = (unitCost - carbon) * core.calibration.cost + carbon
    const margin = price > 0 ? (price - cost) / price : 0
    const util = core.capacity.utilizationByFamily[fam][last]
    const attractiveness =
      100 *
      (0.4 * norm(growth, -0.02, 0.08) +
        0.3 * norm(priceIndex, 0.9, 1.15) +
        0.3 * norm(margin, 0, 0.4))
    const position = 100 * (0.7 * norm(s.share, 0, 0.6) + 0.3 * fit(util))
    const category = decide(attractiveness, position, margin, growth)
    const servedShare =
      core.capacity.servedByFamily[fam][last] /
      Math.max(1e-9, core.demand.domesticByFamily[fam][last] * core.capacity.demandCalibration[fam])
    const revenue2031 =
      (core.demand.bySector[s.id][last] *
        core.capacity.demandCalibration[fam] *
        Math.min(1, servedShare) *
        price) /
      1000
    const cell: Cell = {
      id: s.id,
      label: s.name,
      family: fam,
      market: s.name,
      attractiveness,
      position,
      category,
      revenue2031,
      growth,
      margin,
      rationale: rationaleFor(category, growth, margin, s.share, util),
    }
    cells.push(cell)
    trace[`classification.${s.id}`] = [
      { rule: 'classify.attractiveness', assumptionKey: `sectors.${s.id}.growth`, value: s.growth },
      {
        rule: 'classify.attractiveness',
        assumptionKey: 'L1',
        leverId: 'L1',
        value: levers.L1.multiplier,
      },
      {
        rule: 'classify.attractiveness',
        assumptionKey: `price.${fam}.index2031`,
        value: Math.round(priceIndex * 100) / 100,
      },
      {
        rule: 'classify.attractiveness',
        assumptionKey: `margin.${fam}.2031`,
        value: Math.round(margin * 100) / 100,
      },
      { rule: 'classify.attractiveness', assumptionKey: 'L2', leverId: 'L2', value: levers.L2 },
      { rule: 'classify.position', assumptionKey: `sectors.${s.id}.share`, value: s.share },
      {
        rule: 'classify.position',
        assumptionKey: `utilization.${fam}.2031`,
        value: Math.round(util * 100) / 100,
      },
      {
        rule: 'classify.category',
        assumptionKey: `classificationThresholds.${category}`,
        value: category,
      },
    ]
  }

  // Export markets, one per level at or below the ambition.
  const exportLabels: Record<number, string> = {
    1: 'Export, GCC',
    2: 'Export, East Africa and South Asia',
  }
  const exportIds: Record<number, string> = { 1: 'export_gcc', 2: 'export_extended' }
  for (let level = 1; level <= levers.L5; level++) {
    const potential = a.export.potentialKt[String(level)]
    const prev = level > 1 ? a.export.potentialKt[String(level - 1)] : potential.map(() => 0)
    const incremental = potential.map((v, i) => v - prev[i])
    const first = incremental.find((v) => v > 0) ?? 0
    const lastKt = incremental[incremental.length - 1]
    const growth =
      first > 0 && lastKt > 0
        ? Math.pow(lastKt / first, 1 / Math.max(1, incremental.length - 1)) - 1
        : 0
    const exportPrice = core.price.exportPrice[last] * core.calibration.price
    const domesticList = core.price.domesticPriceByFamily.lime[0] * core.calibration.price
    const logistics =
      level >= 2 ? a.export.logisticsCostPerTon.extended : a.export.logisticsCostPerTon.gcc
    const variableCost = core.cost.costPerTonByFamily.lime[last]
    const margin = exportPrice > 0 ? (exportPrice - variableCost - logistics) / exportPrice : 0
    const served = core.capacity.exportServed[last]
    const activeLevel = core.demand.exportLevel
    const servedRatio =
      activeLevel >= level && lastKt > 0
        ? clamp01(
            Math.min(served, potential[potential.length - 1]) / potential[potential.length - 1],
          )
        : 0
    const jeddahUtil = core.capacity.utilizationBySite.jeddah?.[last] ?? 0
    const attractiveness =
      100 *
      (0.4 * norm(growth, -0.02, 0.5) +
        0.3 * norm(exportPrice / domesticList, 0.7, 1.0) +
        0.3 * norm(margin, 0, 0.4))
    const position = 100 * (0.5 * servedRatio + 0.5 * fit(jeddahUtil))
    const category = decide(attractiveness, position, margin, growth)
    const revenue2031 = activeLevel >= level ? (Math.min(served, lastKt) * exportPrice) / 1000 : 0
    const id = exportIds[level]
    cells.push({
      id,
      label: exportLabels[level],
      family: 'lime',
      market: exportLabels[level],
      attractiveness,
      position,
      category,
      revenue2031,
      growth,
      margin,
      rationale: rationaleFor(category, growth, margin, servedRatio, jeddahUtil, true),
    })
    trace[`classification.${id}`] = [
      {
        rule: 'classify.attractiveness',
        assumptionKey: `export.potentialKt.${level}`,
        value: lastKt,
      },
      {
        rule: 'classify.attractiveness',
        assumptionKey: 'export.priceDiscountVsDomestic',
        value: a.export.priceDiscountVsDomestic,
      },
      {
        rule: 'classify.attractiveness',
        assumptionKey: `export.logisticsCostPerTon.${level >= 2 ? 'extended' : 'gcc'}`,
        value: logistics,
      },
      { rule: 'classify.attractiveness', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
      { rule: 'classify.position', assumptionKey: 'export.served2031', value: Math.round(served) },
      {
        rule: 'classify.position',
        assumptionKey: 'utilization.jeddah.2031',
        value: Math.round(jeddahUtil * 100) / 100,
      },
      {
        rule: 'classify.category',
        assumptionKey: `classificationThresholds.${category}`,
        value: category,
      },
    ]
  }

  const byId = Object.fromEntries(cells.map((c) => [c.id, c]))
  // Family category for rules: the category of the family's largest cell by 2031 revenue.
  const forRules: Record<string, { category: Category }> = {}
  for (const fam of new Set(cells.map((c) => c.family))) {
    const best = cells
      .filter((c) => c.family === fam)
      .sort((x, y) => y.revenue2031 - x.revenue2031)[0]
    forRules[fam] = { category: best.category }
  }
  return { cells, byId, forRules, trace }
}

function rationaleFor(
  category: Category,
  growth: number,
  margin: number,
  share: number,
  util: number,
  isExport = false,
): string {
  const g = `${(growth * 100).toFixed(1)}% growth`
  const m = `${(margin * 100).toFixed(0)}% margin`
  const p = isExport
    ? `${(share * 100).toFixed(0)}% of potential served`
    : `${(share * 100).toFixed(0)}% share`
  const u = `${(util * 100).toFixed(0)}% utilization`
  switch (category) {
    case 'grow':
      return `Attractive market (${g}, ${m}) and a strong position (${p}). Invest to grow.`
    case 'maintain':
      return `Solid position (${p}) in a moderate market (${g}). Hold share, protect margin.`
    case 'improve':
      return `Attractive market (${g}, ${m}) but a weak position (${p}). Build share or capability.`
    case 'restructure':
      return `Margin too thin (${m}) at ${u}. Fix the cost base before growing.`
    case 'harvest':
      return `Strong position (${p}) in a flat market (${g}). Minimise investment, take the cash.`
    case 'exit':
      return `Unattractive market (${g}, ${m}) and a weak position (${p}). Plan an orderly exit.`
  }
}

export const traceEntriesFor = (t: Trace, key: string): TraceEntry[] => t[key] ?? []
