import { placeLabels } from './labelPlacement'

describe('bubble label placement', () => {
  it('keeps a lone label below its bubble', () => {
    const out = placeLabels([{ id: 'a', x: 100, y: 100, r: 10, text: 'Steel' }])
    expect(out.a.above).toBe(false)
  })

  it('moves the second of two overlapping labels above its bubble', () => {
    const out = placeLabels([
      { id: 'a', x: 100, y: 100, r: 10, text: 'Construction' },
      { id: 'b', x: 112, y: 104, r: 10, text: 'Agriculture' },
    ])
    expect(out.a.above).toBe(false)
    expect(out.b.above).toBe(true)
  })

  it('leaves labels far apart alone', () => {
    const out = placeLabels([
      { id: 'a', x: 100, y: 100, r: 10, text: 'Steel' },
      { id: 'b', x: 300, y: 300, r: 10, text: 'Glass' },
    ])
    expect(out.a.above).toBe(false)
    expect(out.b.above).toBe(false)
  })
})
