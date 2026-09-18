// Pure types for the STRATA engine. No React imports anywhere under src/engine.

export type L1Option = 'delayed' | 'onPlan' | 'accelerated'

export type Levers = {
  /** When true the capital envelope is derived from the plan by the envelope rule and L3 is ignored. */
  L3derived?: boolean
  L1: { option: L1Option; multiplier: number }
  L2: number
  L3: number
  L4: number
  L5: number
  L6: number
}

export type LeverId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'

export type Fuel = 'diesel' | 'crude' | 'gas'

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
    /** SAR per GJ by fuel. */
    fuels: Record<Fuel, number>
    gjPerTonLime: number
    /** Kiln energy for bricks, burned with the site fuel where bricks are made. */
    gjPerTonBricks?: number
    siteFuelMix2026: Record<string, Partial<Record<Fuel, number>>>
    /** First year each site runs on gas. */
    gasTransition: Record<string, number>
    /** An energy index at or above this slips the gas allocation one year per site. */
    gasDelayIndex: number
    /** tCO2 per GJ by fuel. */
    emissionFactors: Record<Fuel, number>
    ghgBaseline: { year: number; totalKtCo2: number }
  }
  envelopeRule: {
    taxRate: number
    dividendFloorPctOfEbitda: number
    maxNetDebtToEbitda: number
    netDebt2026: number
    roundTo: number
  }
  previousPlan?: {
    name: string
    year: number
    targets: { revenue2024: number; ebitda2024: number }
    note: string
  }
  logistics?: { model: string }
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
  /** Decarbonization effect once in plan. */
  emissions?: {
    gjReduction?: number
    site?: string
    co2CapturedKt?: number
    fuelCo2ReductionShare?: number
  }
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
  /** Energy cost per ton of lime by year, capacity-weighted across sites, from the fuel mix. */
  energyCostPerTonLimeByYear: number[]
  /** Per site by year, SAR per ton of lime. */
  energyCostPerTonLimeBySite: Record<string, number[]>
  /** Which fuel each site burns each year. */
  fuelBySite: Record<string, ('mix' | 'gas')[]>
  /** Total emissions per ton of lime by year (process plus fuel), capacity-weighted. */
  emissionsPerTonLimeByYear: number[]
  /** Energy cost per ton of lime in the base year if every site were already on gas at the base index. */
  energyCostPerTonLimeOnGas: number
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
  /** Margin by product family and year after calibration: one minus calibrated cost over calibrated price. */
  marginByFamily: Record<string, Series>
  /** The base year restated as if every site were already on gas. */
  proForma2026: ProForma2026
  trace: Trace
}

export type ProForma2026 = {
  revenue: number
  ebitda: number
  energyCostPerTonLimeActual: number
  energyCostPerTonLimeOnGas: number
  energySaving: number
}
