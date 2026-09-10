import type { PlanData } from '../engine/types'
import type { LeverId } from '../data'
import { strings } from '../strings'

export type Field = {
  path: string
  label: string
  unit: string
  /** Display = stored value x scale (percentages are stored as ratios). */
  scale?: number
  step?: number
  min?: number
  max?: number
}
export type Group = { id: string; title: string; fields: Field[] }

const U = strings.inputs.units
const L = strings.inputs.labels
const G = strings.inputs.groups
const pct = { scale: 100, step: 0.1, unit: U.pct }

/** The typed inputs behind each lever, generated from the data so new sectors or sites appear on their own. */
export function inputsFor(id: LeverId | 'base', data: PlanData, l1Option: string): Group[] {
  const a = data.assumptions
  switch (id) {
    case 'L1':
      return [
        {
          id: 'demand',
          title: G.demand,
          fields: a.sectors.flatMap((s) => [
            {
              path: `sectors.${s.id}.baseVolumeKt`,
              label: `${s.name}, ${L.baseVolume}`,
              unit: U.kt,
              step: 5,
              min: 0,
            },
            {
              path: `sectors.${s.id}.growth`,
              label: `${s.name}, ${L.growth}`,
              ...pct,
              unit: U.pctYr,
            },
            {
              path: `sectors.${s.id}.gigaSensitivity`,
              label: `${s.name}, ${L.giga}`,
              unit: U.share,
              step: 0.1,
              min: 0,
              max: 1,
            },
          ]),
        },
        {
          id: 'phasing',
          title: `${G.phasing} (${(strings.levers.L1.options as Record<string, string>)[l1Option] ?? l1Option})`,
          fields: a.planYears.map((y, i) => ({
            path: `gigaPhasing.${l1Option}.${i}`,
            label: String(y),
            unit: U.x,
            step: 0.01,
            min: 0.5,
            max: 1.5,
          })),
        },
      ]
    case 'L2':
      return [
        {
          id: 'fuel',
          title: G.fuel,
          fields: [
            { path: 'energy.fuel.gasSarPerMmbtu', label: L.gas, unit: U.mmbtu, step: 0.1, min: 0 },
            {
              path: 'energy.fuel.dieselSarPerLitre',
              label: L.diesel,
              unit: U.litre,
              step: 0.01,
              min: 0,
            },
            { path: 'energy.fuel.gasShare', label: L.gasShare, ...pct, step: 1, min: 0, max: 100 },
          ],
        },
        {
          id: 'energyShare',
          title: G.energyShare,
          fields: a.products.map((p) => ({
            path: `products.${p.id}.energyShareOfCost`,
            label: p.name,
            ...pct,
            step: 1,
            min: 0,
            max: 100,
          })),
        },
      ]
    case 'L3':
      return [
        {
          id: 'capital',
          title: G.capital,
          fields: [
            { path: 'baseCase.capex', label: L.maintenance, unit: U.sarmYr, step: 1, min: 0 },
            { path: 'discountRate', label: L.discount, ...pct, step: 0.5, min: 0, max: 30 },
            { path: 'terminalMultiple', label: L.terminal, unit: U.x, step: 0.5, min: 0, max: 15 },
            {
              path: 'workingCapitalPctOfRevenueDelta',
              label: L.wc,
              ...pct,
              step: 1,
              min: 0,
              max: 50,
            },
          ],
        },
      ]
    case 'L4':
      return []
    case 'L5':
      return [
        {
          id: 'exportPotential',
          title: G.exportPotential,
          fields: [
            ...a.planYears.map((y, i) => ({
              path: `export.potentialKt.1.${i}`,
              label: `${L.gcc} ${y}`,
              unit: U.kt,
              step: 5,
              min: 0,
            })),
            ...a.planYears.map((y, i) => ({
              path: `export.potentialKt.2.${i}`,
              label: `${L.extended} ${y}`,
              unit: U.kt,
              step: 5,
              min: 0,
            })),
          ],
        },
        {
          id: 'exportEconomics',
          title: G.exportEconomics,
          fields: [
            {
              path: 'export.priceDiscountVsDomestic',
              label: L.discountExport,
              ...pct,
              step: 1,
              min: 0,
              max: 60,
            },
            {
              path: 'export.logisticsCostPerTon.gcc',
              label: L.logisticsGcc,
              unit: U.sarT,
              step: 5,
              min: 0,
            },
            {
              path: 'export.logisticsCostPerTon.extended',
              label: L.logisticsExt,
              unit: U.sarT,
              step: 5,
              min: 0,
            },
          ],
        },
      ]
    case 'L6':
      return [
        {
          id: 'emissions',
          title: G.emissions,
          fields: a.sites.map((s) => ({
            path: `sites.${s.id}.emissionsPerTonLime`,
            label: s.name,
            unit: U.tco2T,
            step: 0.01,
            min: 0,
            max: 2,
          })),
        },
      ]
    case 'base':
      return [
        {
          id: 'actuals',
          title: G.actuals,
          fields: [
            { path: 'baseCase.revenue', label: L.revenue, unit: U.sarm, step: 1, min: 0 },
            { path: 'baseCase.ebitda', label: L.ebitda, unit: U.sarm, step: 1 },
            { path: 'baseCase.headcount', label: L.headcount, unit: U.people, step: 10, min: 0 },
            {
              path: 'baseCase.saudization',
              label: L.saudization,
              ...pct,
              step: 1,
              min: 0,
              max: 100,
            },
          ],
        },
        {
          id: 'prices',
          title: G.prices,
          fields: a.products.flatMap((p) => [
            {
              path: `products.${p.id}.basePrice`,
              label: `${p.name}, ${L.price}`,
              unit: U.sarT,
              step: 5,
              min: 0,
            },
            {
              path: `products.${p.id}.baseCostPerTon`,
              label: `${p.name}, ${L.cost}`,
              unit: U.sarT,
              step: 5,
              min: 0,
            },
          ]),
        },
        {
          id: 'capacity',
          title: G.capacity,
          fields: a.sites.flatMap((s) => [
            ...Object.keys(s.capacityKt).map((p) => ({
              path: `sites.${s.id}.capacityKt.${p}`,
              label: `${s.name}, ${a.products.find((x) => x.id === p)?.name ?? p}`,
              unit: U.kt,
              step: 10,
              min: 0,
            })),
            {
              path: `sites.${s.id}.baseUtilization`,
              label: `${s.name}, ${L.utilization}`,
              ...pct,
              step: 1,
              min: 0,
              max: 100,
            },
          ]),
        },
        {
          id: 'people',
          title: G.people,
          fields: [
            { path: 'people.nitaqatTarget', label: L.nitaqat, ...pct, step: 1, min: 0, max: 100 },
            {
              path: 'people.headcountPerKtLime',
              label: L.hcLime,
              unit: U.perKt,
              step: 0.05,
              min: 0,
            },
            {
              path: 'people.headcountPerKtLimestone',
              label: L.hcLimestone,
              unit: U.perKt,
              step: 0.01,
              min: 0,
            },
          ],
        },
        {
          id: 'elasticity',
          title: G.elasticity,
          fields: [
            {
              path: 'priceElasticity.coefficient',
              label: L.elasticity,
              unit: U.coeff,
              step: 0.05,
              min: 0,
              max: 2,
            },
          ],
        },
      ]
  }
}

/** Energy index implied by fuel prices: 100 x (share x gas/base + (1 - share) x diesel/base). */
export function indexFromFuel(
  gas: number,
  diesel: number,
  share: number,
  base: { gasSarPerMmbtu: number; dieselSarPerLitre: number },
): number {
  const g = base.gasSarPerMmbtu > 0 ? gas / base.gasSarPerMmbtu : 1
  const d = base.dieselSarPerLitre > 0 ? diesel / base.dieselSarPerLitre : 1
  return Math.round(100 * (share * g + (1 - share) * d))
}
