import { evaluateRule, leverGrid, parseRule, withLeverValue, leverValue } from '../rules'
import { base, withL, assumptions } from './fixtures'

const ctx = (levers = base()) => ({
  levers,
  utilization: { central: { lime: { 2029: 0.85 } }, western: { lime: { 2029: 0.7 } } },
  classification: { bricks: { category: 'harvest' } },
})

describe('rule expressions', () => {
  it('parses a lever comparison', () => {
    expect(parseRule('L5 >= 2')).toEqual({ path: 'L5', op: '>=', value: 2 })
    expect(parseRule('L1.multiplier >= 0.85')).toEqual({
      path: 'L1.multiplier',
      op: '>=',
      value: 0.85,
    })
    expect(parseRule('L2 <= 130')).toEqual({ path: 'L2', op: '<=', value: 130 })
  })

  it('parses an indexed engine output and a membership test', () => {
    expect(parseRule('utilization.central.lime[2029] >= 0.80')).toEqual({
      path: 'utilization.central.lime.2029',
      op: '>=',
      value: 0.8,
    })
    expect(parseRule("classification.bricks.category in ['harvest','exit']")).toEqual({
      path: 'classification.bricks.category',
      op: 'in',
      value: ['harvest', 'exit'],
    })
  })

  it('evaluates lever comparisons against the lever values', () => {
    expect(evaluateRule('L5 >= 2', ctx(withL({ L5: 2 })))).toBe(true)
    expect(evaluateRule('L5 >= 2', ctx(withL({ L5: 1 })))).toBe(false)
    expect(
      evaluateRule(
        'L1.multiplier >= 0.85',
        ctx(withL({ L1: { option: 'delayed', multiplier: 0.8 } })),
      ),
    ).toBe(false)
    expect(evaluateRule('L2 <= 130', ctx(withL({ L2: 130 })))).toBe(true)
  })

  it('evaluates engine outputs and membership', () => {
    expect(evaluateRule('utilization.central.lime[2029] >= 0.80', ctx())).toBe(true)
    expect(evaluateRule('utilization.western.lime[2029] >= 0.80', ctx())).toBe(false)
    expect(evaluateRule("classification.bricks.category in ['harvest','exit']", ctx())).toBe(true)
  })

  it('fails closed when the path is missing from the context', () => {
    expect(evaluateRule('classification.lime.category in ["grow"]', ctx())).toBe(false)
  })

  it('throws on an expression it cannot parse, so bad data is caught in tests', () => {
    expect(() => parseRule('L2 !! 3')).toThrow()
  })
})

describe('lever grids', () => {
  it('produces the scan grid for every lever from the lever definitions', () => {
    expect(leverGrid('L2', assumptions)).toEqual([
      80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160,
    ])
    expect(leverGrid('L4', assumptions)).toEqual([1, 2, 3])
    expect(leverGrid('L6', assumptions)).toEqual([0, 40, 120])
    expect(leverGrid('L3', assumptions)[0]).toBe(200)
    expect(leverGrid('L3', assumptions).at(-1)).toBe(1500)
    const l1 = leverGrid('L1', assumptions)
    expect(l1[0]).toBeCloseTo(0.7, 9)
    expect(l1.at(-1)).toBeCloseTo(1.3, 9)
    expect(l1).toHaveLength(13)
  })

  it('reads and writes a lever value, treating L1 as its multiplier', () => {
    expect(leverValue(base(), 'L1')).toBe(1)
    expect(leverValue(base(), 'L3')).toBe(600)
    const moved = withLeverValue(base(), 'L1', 0.8)
    expect(moved.L1).toEqual({ option: 'onPlan', multiplier: 0.8 })
    expect(withLeverValue(base(), 'L2', 140).L2).toBe(140)
  })
})
