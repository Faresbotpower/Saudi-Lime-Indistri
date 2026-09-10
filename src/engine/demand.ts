import type { Assumptions, DemandResult, Levers, Trace, TraceEntry } from './types'
import { yearsOf, sumSeries, zeros } from './years'

/** Ids of selected initiatives; export levels that require an initiative need it here. */
export type DemandOptions = { selected: ReadonlySet<string> | readonly string[] }

/**
 * Pipeline step 1. Demand by sector and year:
 *   demand[s][y] = baseVolume[s] * (1 + growth[s] * L1.multiplier) ^ (y - baseYear) * phasing[s][y]
 * where phasing[s][y] = 1 + (gigaPhasing[L1.option][y] - 1) * gigaSensitivity[s].
 * Export demand (lime family) is added from the potential table at the effective L5 level.
 */
export function computeDemand(levers: Levers, a: Assumptions, opts: DemandOptions): DemandResult {
  const years = yearsOf(a)
  const n = years.length
  const phasing = a.gigaPhasing[levers.L1.option]
  const familyOfProduct = Object.fromEntries(a.products.map((p) => [p.id, p.family]))
  const trace: Trace = {}

  const bySector: Record<string, number[]> = {}
  for (const s of a.sectors) {
    const series = zeros(n)
    for (let i = 0; i < n; i++) {
      const t = years[i] - a.baseYear
      const giga = i === 0 ? 1 : 1 + (phasing[i - 1] - 1) * s.gigaSensitivity
      series[i] = s.baseVolumeKt * Math.pow(1 + s.growth * levers.L1.multiplier, t) * giga
    }
    bySector[s.id] = series
    const entries: TraceEntry[] = [
      {
        rule: 'demand.compound',
        assumptionKey: `sectors.${s.id}.baseVolumeKt`,
        value: s.baseVolumeKt,
      },
      { rule: 'demand.compound', assumptionKey: `sectors.${s.id}.growth`, value: s.growth },
      {
        rule: 'demand.compound',
        assumptionKey: 'L1.multiplier',
        leverId: 'L1',
        value: levers.L1.multiplier,
      },
      {
        rule: 'demand.gigaPhasing',
        assumptionKey: `gigaPhasing.${levers.L1.option}`,
        leverId: 'L1',
        value: levers.L1.option,
      },
      {
        rule: 'demand.gigaPhasing',
        assumptionKey: `sectors.${s.id}.gigaSensitivity`,
        value: s.gigaSensitivity,
      },
    ]
    trace[`demand.${s.id}`] = entries
  }

  const domesticByFamily: Record<string, number[]> = {}
  for (const s of a.sectors) {
    const fam = familyOfProduct[s.product]
    domesticByFamily[fam] = sumSeries([domesticByFamily[fam] ?? zeros(n), bySector[s.id]], n)
  }

  // Export: the highest level at or below L5 whose required initiative (if any) is selected.
  const selected = new Set(opts.selected)
  let exportLevel = 0
  for (let level = levers.L5; level >= 0; level--) {
    const req = a.export.requiresInitiative[String(level)]
    if (!req || selected.has(req)) {
      exportLevel = level
      break
    }
  }
  const required = a.export.requiresInitiative[String(levers.L5)]
  const potential = a.export.potentialKt[String(exportLevel)] ?? zeros(n - 1)
  const exportKt = [0, ...potential.slice(0, n - 1)]
  trace['demand.export'] = [
    { rule: 'demand.export', assumptionKey: 'L5', leverId: 'L5', value: levers.L5 },
    {
      rule: 'demand.export',
      assumptionKey: `export.potentialKt.${exportLevel}`,
      value: exportLevel,
    },
    ...(required
      ? [
          {
            rule: 'demand.export.requires',
            assumptionKey: `export.requiresInitiative.${levers.L5}`,
            value: required,
          } as TraceEntry,
        ]
      : []),
  ]

  return { years, bySector, domesticByFamily, exportKt, exportLevel, trace }
}
