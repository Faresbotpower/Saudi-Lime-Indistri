import type { Assumptions, LeverId, Levers } from './types'

export type ParsedRule = {
  path: string
  op: '>=' | '<=' | '>' | '<' | '==' | '!=' | 'in'
  value: number | string[]
}

/** Everything a rule expression may reference. Engine outputs are keyed by year where indexed. */
export type RuleContext = {
  levers: Levers
  utilization?: Record<string, Record<string, Record<number, number>>>
  classification?: Record<string, { category: string }>
}

const COMPARE = /^([A-Za-z_][\w.]*)(?:\[(\d{4})\])?\s*(>=|<=|>|<|==|!=)\s*(-?\d+(?:\.\d+)?)$/
const MEMBER = /^([A-Za-z_][\w.]*)\s+in\s+\[(.*)\]$/

/** Parse `path[year] op number` or `path in ['a','b']`. Throws on anything else. */
export function parseRule(expr: string): ParsedRule {
  const s = expr.trim()
  const m = COMPARE.exec(s)
  if (m) {
    const path = m[2] ? `${m[1]}.${m[2]}` : m[1]
    return { path, op: m[3] as ParsedRule['op'], value: Number(m[4]) }
  }
  const im = MEMBER.exec(s)
  if (im) {
    const list = im[2]
      .split(',')
      .map((x) => x.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
    return { path: im[1], op: 'in', value: list }
  }
  throw new Error(`Cannot parse rule expression: ${expr}`)
}

function resolve(ctx: RuleContext, path: string): unknown {
  let cur: unknown = ctx.levers as unknown as Record<string, unknown>
  const parts = path.split('.')
  if (parts[0] === 'utilization' || parts[0] === 'classification') {
    cur = ctx[parts[0]]
    parts.shift()
  }
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

/** Evaluate an expression against the context. Missing paths fail closed. */
export function evaluateRule(expr: string, ctx: RuleContext): boolean {
  const r = parseRule(expr)
  const v = resolve(ctx, r.path)
  if (v === undefined || v === null) return false
  if (r.op === 'in') return (r.value as string[]).includes(String(v))
  const x = Number(v)
  const y = r.value as number
  if (Number.isNaN(x)) return false
  switch (r.op) {
    case '>=':
      return x >= y - 1e-9
    case '<=':
      return x <= y + 1e-9
    case '>':
      return x > y + 1e-9
    case '<':
      return x < y - 1e-9
    case '==':
      return Math.abs(x - y) < 1e-9
    case '!=':
      return Math.abs(x - y) >= 1e-9
  }
}

/** Scan grid for a lever from its definition. L1 scans the fine multiplier in 0.05 steps. */
export function leverGrid(id: LeverId, a: Assumptions): number[] {
  const def = (a as unknown as { levers: Array<Record<string, unknown>> }).levers.find(
    (l) => l.id === id,
  )
  if (!def) throw new Error(`Unknown lever ${id}`)
  if (id === 'L1') {
    const [lo, hi] = def.sliderRange as [number, number]
    const out: number[] = []
    for (let v = lo; v <= hi + 1e-9; v += 0.05) out.push(Math.round(v * 100) / 100)
    return out
  }
  if (def.type === 'slider') {
    const [lo, hi] = def.range as [number, number]
    const step = (def.step as number) ?? 1
    const out: number[] = []
    for (let v = lo; v <= hi + 1e-9; v += step) out.push(v)
    return out
  }
  return def.values as number[]
}

export const leverValue = (levers: Levers, id: LeverId): number =>
  id === 'L1' ? levers.L1.multiplier : (levers[id] as number)

export const withLeverValue = (levers: Levers, id: LeverId, value: number): Levers =>
  id === 'L1' ? { ...levers, L1: { ...levers.L1, multiplier: value } } : { ...levers, [id]: value }
