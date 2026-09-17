import { act, render, screen } from '@testing-library/react'
import { CountUp } from './CountUp'

const format = (value: number) => value.toFixed(2)

describe('CountUp', () => {
  afterEach(() => vi.restoreAllMocks())

  it('continues an interrupted transition from the visible value', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
    let time = 0
    let frame: FrameRequestCallback = () => {}
    vi.spyOn(performance, 'now').mockImplementation(() => time)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { rerender } = render(<CountUp value={0} format={format} />)
    rerender(<CountUp value={100} format={format} />)
    act(() => {
      time = 100
      frame(time)
    })
    const visible = screen.getByTestId('kpi-value').textContent
    rerender(<CountUp value={20} format={format} />)
    act(() => {
      frame(time)
    })
    expect(screen.getByTestId('kpi-value')).toHaveTextContent(visible!)
    act(() => {
      time = 500
      frame(time)
    })
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('20.00')
  })

  it('renders updated values immediately with reduced motion', () => {
    const { rerender } = render(<CountUp value={10} format={format} />)
    rerender(<CountUp value={30} format={format} />)
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('30.00')
  })
})
