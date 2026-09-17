import type { PlanData } from '../engine/types'

export type Overrides = Record<string, number>

/** Walk a dotted path; array segments resolve by index or by item id. */
export function readPath(root: unknown, path: string): unknown {
  let cur: unknown = root
  for (const seg of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    if (Array.isArray(cur)) {
      const idx = Number(seg)
      cur =
        Number.isInteger(idx) && String(idx) === seg
          ? cur[idx]
          : cur.find((x) => x && typeof x === 'object' && (x as { id?: string }).id === seg)
    } else {
      cur = (cur as Record<string, unknown>)[seg]
    }
  }
  return cur
}

function writePath(root: unknown, path: string, value: number): boolean {
  const segs = path.split('.')
  let cur: unknown = root
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    if (cur === null || typeof cur !== 'object') return false
    if (Array.isArray(cur)) {
      const idx = Number(seg)
      cur =
        Number.isInteger(idx) && String(idx) === seg
          ? cur[idx]
          : cur.find((x) => x && typeof x === 'object' && (x as { id?: string }).id === seg)
    } else {
      cur = (cur as Record<string, unknown>)[seg]
    }
  }
  if (cur === null || typeof cur !== 'object') return false
  const last = segs[segs.length - 1]
  if (Array.isArray(cur)) {
    const idx = Number(last)
    if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return false
    cur[idx] = value
    return true
  }
  const obj = cur as Record<string, unknown>
  if (!(last in obj) || typeof obj[last] !== 'number') return false
  obj[last] = value
  return true
}

export const overridePaths = (o: Overrides): string[] => Object.keys(o)

/** A deep copy of the assumptions with the overrides written in. Unknown paths are ignored. */
export function applyOverrides(data: PlanData, overrides: Overrides): PlanData {
  const paths = overridePaths(overrides)
  if (paths.length === 0) return data
  const assumptions = JSON.parse(JSON.stringify(data.assumptions)) as PlanData['assumptions']
  for (const p of paths) writePath(assumptions, p, overrides[p])
  return { assumptions, initiatives: data.initiatives, objectives: data.objectives }
}
