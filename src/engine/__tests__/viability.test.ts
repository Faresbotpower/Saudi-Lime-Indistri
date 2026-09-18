import { evaluateViability, contextFor } from '../viability'
import { leverValue, withLeverValue } from '../rules'
import { base, withL, data } from './fixtures'
import type { PlanData } from '../types'

const run = (levers = base(), d: PlanData = data) =>
  evaluateViability(levers, d, (l) => contextFor(l, d))

describe('viability', () => {
  it('marks rule-free initiatives viable on the Base preset', () => {
    const v = run()
    expect(v.pricing_reset.status).toBe('viable')
    expect(v.kiln_efficiency.status).toBe('viable')
    expect(v.pricing_reset.trigger).toBeUndefined()
  })

  it('marks initiatives out when a strategic rule fails and names the rule', () => {
    const v = run()
    expect(v.jeddah_export_terminal.status).toBe('out')
    expect(v.jeddah_export_terminal.reason).toContain('Export ambition')
    expect(v.bolt_on_acquisition.status).toBe('out')
    expect(v.carbon_capture_pilot.status).toBe('out')
  })

  it('computes the trigger point as the nearest lever value that would make the initiative viable', () => {
    const v = run()
    expect(v.jeddah_export_terminal.trigger).toEqual({
      leverId: 'L5',
      threshold: 2,
      direction: 'above',
    })
    expect(v.carbon_capture_pilot.trigger).toEqual({
      leverId: 'L6',
      threshold: 40,
      direction: 'above',
    })
    expect(v.carbon_capture_pilot.trigger).toEqual({
      leverId: 'L6',
      threshold: 40,
      direction: 'above',
    })
  })

  it('gives viable initiatives the boundary at which they would drop out', () => {
    const v = run()
    expect(v.pcc_plant.status).toBe('viable')
    // PCC has two rules; risk appetite (one step away) is nearer than energy (six steps away).
    expect(v.pcc_plant.trigger).toEqual({ leverId: 'L4', threshold: 2, direction: 'above' })
    expect(run(withL({ L2: 130 })).pcc_plant.trigger).toEqual({
      leverId: 'L2',
      threshold: 130,
      direction: 'below',
    })
    expect(v.dololime_line.trigger).toEqual({ leverId: 'L1', threshold: 0.85, direction: 'above' })
  })

  it('organic-only risk appetite puts every inorganic initiative out', () => {
    const v = run(withL({ L4: 1 }))
    for (const i of data.initiatives.initiatives.filter((x) => x.inorganic))
      expect(v[i.id].status).toBe('out')
  })

  it('evaluates engine-output rules such as central lime utilization', () => {
    // With this data the 80% rule holds across the whole L1 range, so no boundary exists.
    expect(run().alkharj_kiln.status).toBe('viable')
    expect(run().alkharj_kiln.trigger).toBeUndefined()
    // A stricter rule shows the scan: out at base, viable above a higher multiplier.
    const strict: PlanData = {
      ...data,
      initiatives: {
        ...data.initiatives,
        initiatives: data.initiatives.initiatives.map((i) =>
          i.id === 'alkharj_kiln'
            ? {
                ...i,
                rules: [
                  {
                    type: 'strategic',
                    expr: 'utilization.central.lime[2029] >= 0.95',
                    label: 'Central lime above 95% by 2029',
                    leverId: 'L1',
                  },
                ],
              }
            : i,
        ),
      },
    }
    const v = run(base(), strict)
    expect(v.alkharj_kiln.status).toBe('out')
    expect(v.alkharj_kiln.trigger?.leverId).toBe('L1')
    expect(v.alkharj_kiln.trigger?.direction).toBe('above')
    expect(v.alkharj_kiln.trigger!.threshold).toBeGreaterThan(1)
    const moved = run(withLeverValue(base(), 'L1', v.alkharj_kiln.trigger!.threshold), strict)
    expect(moved.alkharj_kiln.status).toBe('viable')
  })

  it('defers an initiative whose dependency is out, with reason dependency', () => {
    const d: PlanData = {
      ...data,
      initiatives: {
        ...data.initiatives,
        initiatives: data.initiatives.initiatives.map((i) =>
          i.id === 'kiln_efficiency'
            ? {
                ...i,
                rules: [
                  {
                    type: 'strategic',
                    expr: 'L4 >= 3',
                    label: 'Needs aggressive appetite',
                    leverId: 'L4',
                  },
                ],
              }
            : i,
        ),
      },
    }
    const v = run(base(), d)
    expect(v.kiln_efficiency.status).toBe('out')
    expect(v.pcc_plant.status).toBe('deferred')
    expect(v.pcc_plant.reason).toBe('dependency')
  })

  it('fails closed on rules that need outputs not yet in the context', () => {
    const v = run()
    expect(v.bricks_choice.status).toBe('out')
  })

  it('trigger points, when re-applied as lever values, flip the rule they claim to flip', () => {
    for (const levers of [
      base(),
      withL({ L1: { option: 'delayed', multiplier: 0.7 } }),
      withL({ L2: 150, L4: 1, L5: 0 }),
    ]) {
      const v = run(levers)
      for (const [id, r] of Object.entries(v)) {
        if (!r.trigger || r.status === 'deferred') continue
        const moved = withLeverValue(levers, r.trigger.leverId, r.trigger.threshold)
        const after = run(moved)
        if (r.status === 'out') {
          // The failing rule on that lever now passes.
          expect(after[id].failedRules.map((x) => x.leverId)).not.toContain(r.trigger.leverId)
        } else {
          // Stepping just past the boundary makes it fail.
          const grid = r.trigger.direction === 'above' ? -1 : 1
          const past = withLeverValue(
            levers,
            r.trigger.leverId,
            stepPast(levers, r.trigger.leverId, r.trigger.threshold, grid),
          )
          expect(run(past)[id].status).toBe('out')
          expect(leverValue(moved, r.trigger.leverId)).toBe(r.trigger.threshold)
        }
      }
    }
  })
})

function stepPast(
  levers: ReturnType<typeof base>,
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6',
  threshold: number,
  dir: number,
) {
  void levers
  const steps: Record<string, number> = { L1: 0.05, L2: 5, L3: 50, L4: 1, L5: 1, L6: 40 }
  if (id === 'L6') return dir < 0 ? (threshold === 120 ? 40 : 0) : threshold === 0 ? 40 : 120
  return Math.round((threshold + dir * steps[id]) * 100) / 100
}
