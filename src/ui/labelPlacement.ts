export type LabelInput = { id: string; x: number; y: number; r: number; text: string }
export type Placement = { above: boolean; dx: number }

const CHAR = 6.2
const LINE = 13

/**
 * Bubble labels sit below their bubble. When a label would overlap one already placed,
 * it moves above its bubble; if that still collides it nudges right.
 */
export function placeLabels(items: LabelInput[]): Record<string, Placement> {
  const placed: { x1: number; x2: number; y1: number; y2: number }[] = []
  const out: Record<string, Placement> = {}
  const box = (it: LabelInput, above: boolean, dx: number) => {
    const w = it.text.length * CHAR
    const y = above ? it.y - it.r - LINE : it.y + it.r + 4
    return { x1: it.x + dx - w / 2, x2: it.x + dx + w / 2, y1: y, y2: y + LINE }
  }
  const hits = (b: { x1: number; x2: number; y1: number; y2: number }) =>
    placed.some((p) => b.x1 < p.x2 && b.x2 > p.x1 && b.y1 < p.y2 && b.y2 > p.y1)
  for (const it of items) {
    const options: Placement[] = [
      { above: false, dx: 0 },
      { above: true, dx: 0 },
      { above: false, dx: 40 },
      { above: true, dx: 40 },
    ]
    const pick = options.find((o) => !hits(box(it, o.above, o.dx))) ?? options[0]
    out[it.id] = pick
    placed.push(box(it, pick.above, pick.dx))
  }
  return out
}
