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

  it('has eleven chapters with titles, captions and a reading pace', () => {
    expect(chapters).toHaveLength(11)
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

  it('advances at reading pace and walks the app: presets in chapter 2, a card in chapter 5, an actual in chapter 9', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    expect(useLevers.getState().view).toBe('financials')
    act(() => vi.advanceTimersByTime(chapters[0].seconds * 1000 + 20))
    expect(useLevers.getState().walkthrough.step).toBe(1)
    act(() => vi.advanceTimersByTime(7500))
    expect(useLevers.getState().scenario).toBe('growth')
    act(() => vi.advanceTimersByTime(5000))
    expect(useLevers.getState().scenario).toBe('base')
    const skipTo = (n: number) => {
      while (useLevers.getState().walkthrough.step < n)
        act(() =>
          useLevers.getState().setWalkthroughStep(useLevers.getState().walkthrough.step + 1),
        )
    }
    skipTo(4)
    act(() => vi.advanceTimersByTime(100))
    expect(useLevers.getState().view).toBe('portfolio')
    act(() => vi.advanceTimersByTime(16000))
    expect(useLevers.getState().openInitiativeId).toBe('pcc_plant')
    skipTo(8)
    act(() => vi.advanceTimersByTime(4500))
    expect(useLevers.getState().view).toBe('tracker')
    expect(useLevers.getState().actuals).toEqual({ L2: 140 })
  })

  it('spotlights the focused element when it exists', () => {
    const anchor = document.createElement('div')
    anchor.setAttribute('data-tour', 'rail')
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
