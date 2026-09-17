// Pure types for the STRATA engine. No React imports anywhere under src/engine.

export type L1Option = 'delayed' | 'onPlan' | 'accelerated'

export type Levers = {
  L1: { option: L1Option; multiplier: number }
  L2: number
  L3: number
  L4: number
  L5: number
  L6: number
}

export type LeverId = keyof Levers

export type Site = {
  id: string
  name: string
  region: string
  capacityKt: Record<string, number>
  baseUtilization: number
  emissionsPerTonLime: number
}

export type Product = {
  id: string
  name: string
  family: string
  basePrice: number
  baseCostPerTon: number
  energyShareOfCost: number
}

export type Sector = {
  id: string
  name: string
  product: string
  baseVolumeKt: number
  growth: number
  gigaSensitivity: number
  share: number
}

export type Assumptions = {
  baseYear: number
  planYears: number[]
  discountRate: number
  terminalMultiple: number
  workingCapitalPctOfRevenueDelta: number
  baseCase: {
    revenue: number
    ebitda: number
    capex: number
    headcount: number
    saudization: number
  }
  /** Five-year history the plan starts from; the last entry equals baseCase. */
  history?: { years: number[]; revenue: number[]; ebitda: number[] }
  sites: Site[]
  products: Product[]
  sectors: Sector[]
  gigaPhasing: Record<L1Option, number[]> & { _note?: string }
  export: {
    priceDiscountVsDomestic: number
    logisticsCostPerTon: { gcc: number; extended: number }
    potentialKt: Record<string, number[]>
    requiresInitiative: Record<string, string>
  }
  priceElasticity: { coefficient: number; clamp: [number, number] }
  energy: {
    baseIndex: number
    fuel?: { gasSarPerMmbtu: number; dieselSarPerLitre: number; gasShare: number }
  }
  carbon: { sarPerTon: Record<string, number> }
  people: {
    baseHeadcount: number
    baseSaudization: number
    nitaqatTarget: number
    headcountPerKtLime: number
    headcountPerKtLimestone: number
    baseCostPerTonAllIn: number
  }
  classificationThresholds: Record<string, Record<string, number>>
  scenarios: Record<string, Levers>
  tracker: { editableYear: number; fields: string[] }
}

export type Rule = {
  type: 'strategic' | 'capital' | 'dependency'
  expr: string
  label: string
  leverId: LeverId
}

export type Project = {
  id: string
  name: string
  capex: number
  startYear: number
  durationQuarters: number
  owner: string
  deliverable: string
}

export type PlanId = 'commercial' | 'operations' | 'ai' | 'sustainability' | 'hr'

export type Requirements = {
  people: string
  capex: number
  systems: string
  decisions: string[]
}

export type Initiative = {
  id: string
  name: string
  layer: string
  site: string | null
  owner: string
  objective: string
  rationale: string
  capex: number
  startYearEarliest: number
  rampYears: number
  capacityAddKt?: Record<string, number>
  revenueRunRate: number
  ebitdaRunRate: number
  ebitdaScalesWith?: LeverId
  ebitdaScaleFactor?: number
  headcountDelta: number
  saudizationTarget?: number
  complexity: 'low' | 'medium' | 'high'
  inorganic: boolean
  newProductOrMarket: boolean
  dependencies: string[]
  rules: Rule[]
  /** Scorecard KPI ids (K1) or free text. */
  kpis: string[]
  risks: string[]
  /** Objectives this initiative serves; every initiative has at least one. */
  objectives: string[]
  /** The functional plan it feeds. */
  plan: PlanId
  /** Two to four projects whose capex sums to the initiative capex. */
  projects: Project[]
  /** What the initiative needs to work. */
  requirements: Requirements
}

export type Pathway = 'optimize' | 'modernize' | 'valueChain' | 'adjacency' | 'geography'
export type Perspective = 'financial' | 'customer' | 'internal' | 'learning'

export type Shift = {
  id: string
  name: string
  driver: string
  evidence: string[]
  pathway: Pathway
  levers: LeverId[]
}

export type Objective = {
  id: string
  shift: string
  name: string
  owner: string
  target: { metric: string; value: number; year: number }
  measure: string
  perspective: Perspective
  okrs: { kr: string; by: number; target: number }[]
  detail: { subObjectives: string[]; dependencies: string[]; risks: string[] }
}

export type KpiDef = {
  id: string
  name: string
  perspective: Perspective
  unit: string
  baseline2026: number
  targets: Record<string, number>
  /** Engine output path; the KPI reads live when present. */
  computedFrom?: string
  /** Multiplier applied to the engine value (100 for ratios shown as percent). */
  scale?: number
  lead: boolean
  direction: 'up' | 'down'
  cadence: 'quarterly' | 'annual'
}

export type ObjectivesData = {
  levers: LeverId[]
  pathways: Record<Pathway, string>
  shifts: Shift[]
  objectives: Objective[]
  scorecard: { perspectives: Perspective[]; kpis: KpiDef[] }
}

export type InitiativeData = { layers: { id: string; name: string }[]; initiatives: Initiative[] }

export type PlanData = {
  assumptions: Assumptions
  initiatives: InitiativeData
  objectives: ObjectivesData
}

/** One line of the audit trail behind a number. */
export type TraceEntry = {
  rule: string
  assumptionKey: string
  leverId?: LeverId
  value: number | string
}

export type Trace = Record<string, TraceEntry[]>

/** Capacity brought by a selected initiative, ramped linearly from startYear over rampYears. */
export type CapacityAddition = {
  initiativeId: string
  product: string
  kt: number
  startYear: number
  rampYears: number
  site?: string | null
}

/** Series indexed like `years` (base year first, then the plan years). */
export type Series = number[]

export type DemandResult = {
  years: number[]
  bySector: Record<string, Series>
  domesticByFamily: Record<string, Series>
  exportKt: Series
  exportLevel: number
  trace: Trace
}

export type CapacityResult = {
  years: number[]
  capacityByFamily: Record<string, Series>
  capacityBySite: Record<string, Record<string, Series>>
  servedByFamily: Record<string, Series>
  exportServed: Series
  utilizationByFamily: Record<string, Series>
  utilizationBySite: Record<string, Series>
  utilizationByRegionFamily: Record<string, Record<string, Series>>
  demandCalibration: Record<string, number>
  trace: Trace
}

export type PriceResult = {
  priceIndexByFamily: Record<string, Series>
  domesticPriceByFamily: Record<string, Series>
  exportPrice: Series
  baseUtilizationByFamily: Record<string, number>
  trace: Trace
}

export type CostResult = {
  costPerTonByFamily: Record<string, Series>
  energyCostPerTonByFamily: Record<string, number>
  carbonCostPerTonLime: number
  /** Carbon cost per ton of lime by year (base year 0), honouring tracked actuals. */
  carbonByYear: number[]
  exportLogisticsPerTon: number
  trace: Trace
}

export type CoreResult = {
  years: number[]
  demand: DemandResult
  capacity: CapacityResult
  price: PriceResult
  cost: CostResult
  calibration: { price: number; cost: number }
  baseBusiness: { revenue: Series; cost: Series; ebitda: Series; volumeKt: Series }
  trace: Trace
}
