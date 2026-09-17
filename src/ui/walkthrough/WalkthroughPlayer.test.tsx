import { render, screen, act } from '@testing-library/react'
import { WalkthroughPlayer } from './WalkthroughPlayer'
import { chapters } from './script'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'

describe('walkthrough player', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useLevers.getState().reset()
    useLevers.getState().stopWalkthrough()
  })
  afterEach(() => vi.useRealTimers())

  it('has ten chapters with titles, captions and a reading pace', () => {
    expect(chapters).toHaveLength(10)
    for (const c of chapters) {
      expect(c.title.length).toBeGreaterThan(2)
      expect(c.caption.length).toBeGreaterThan(40)
      expect(c.seconds).toBeGreaterThan(8)
    }
  })

  it('renders nothing until started, then shows the chapter bar with the caption', () => {
    render(<WalkthroughPlayer />)
    expect(screen.queryByTestId('walkthrough-bar')).toBeNull()
    act(() => useLevers.getState().startWalkthrough())
    expect(screen.getByTestId('walkthrough-bar')).toBeInTheDocument()
    expect(screen.getByTestId('walkthrough-caption')).toHaveTextContent(
      chapters[0].caption.slice(0, 40),
    )
  })

  it('advances at reading pace and walks the approach: a shift in chapter 2, a card in chapter 4, the quarterly review in chapter 8', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    expect(useLevers.getState().view).toBe('direction')
    act(() => vi.advanceTimersByTime(chapters[0].seconds * 1000 + 20))
    expect(useLevers.getState().walkthrough.step).toBe(1)
    act(() => vi.advanceTimersByTime(4500))
    expect(useLevers.getState().openShift).toBe('S1')
    act(() => vi.advanceTimersByTime(10000))
    expect(useLevers.getState().hoveredShift).toBe('S5')
    const skipTo = (n: number) => {
      while (useLevers.getState().walkthrough.step < n)
        act(() =>
          useLevers.getState().setWalkthroughStep(useLevers.getState().walkthrough.step + 1),
        )
    }
    skipTo(3)
    act(() => vi.advanceTimersByTime(100))
    expect(useLevers.getState().view).toBe('portfolio')
    act(() => vi.advanceTimersByTime(20000))
    expect(useLevers.getState().openInitiativeId).toBe('pcc_plant')
    expect(useLevers.getState().levers.L2).toBe(140)
    skipTo(7)
    act(() => vi.advanceTimersByTime(4500))
    expect(useLevers.getState().view).toBe('tracker')
    expect(useLevers.getState().actuals).toEqual({ L2: 140 })
    act(() => vi.advanceTimersByTime(15000))
    expect(useLevers.getState().trackerMode).toBe('quarterly')
  })

  it('spotlights the focused element when it exists', () => {
    const anchor = document.createElement('div')
    anchor.setAttribute('data-tour', 'cascade')
    document.body.appendChild(anchor)
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    act(() => useLevers.getState().setWalkthroughStep(1))
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByTestId('spotlight')).toHaveAttribute('data-active', 'true')
    anchor.remove()
  })

  it('skips to the next chapter and stops on the buttons, and finishes after the last chapter', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    act(() => screen.getByRole('button', { name: strings.walkthrough.next }).click())
    expect(useLevers.getState().walkthrough.step).toBe(1)
    act(() => screen.getByRole('button', { name: strings.walkthrough.stop }).click())
    expect(useLevers.getState().walkthrough.active).toBe(false)
    act(() => useLevers.getState().startWalkthrough())
    act(() => useLevers.getState().setWalkthroughStep(chapters.length - 1))
    act(() => vi.advanceTimersByTime(chapters[chapters.length - 1].seconds * 1000 + 20))
    expect(useLevers.getState().walkthrough.active).toBe(false)
  })
})
