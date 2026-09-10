import { render, screen, act } from '@testing-library/react'
import { WalkthroughPlayer } from './WalkthroughPlayer'
import { chapters } from './script'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = []
  src: string
  paused = true
  constructor(src: string) {
    super()
    this.src = src
    FakeAudio.instances.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  end() {
    this.dispatchEvent(new Event('ended'))
  }
}

describe('walkthrough player', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeAudio.instances = []
    Object.defineProperty(window, 'Audio', { value: FakeAudio, configurable: true, writable: true })
    useLevers.getState().reset()
    useLevers.getState().stopWalkthrough()
  })
  afterEach(() => vi.useRealTimers())

  it('has eleven chapters with audio, titles and captions', () => {
    expect(chapters).toHaveLength(11)
    for (const c of chapters) {
      expect(c.audio).toMatch(/\/walkthrough\/chapter\d+\.m4a/)
      expect(c.title.length).toBeGreaterThan(2)
      expect(c.caption.length).toBeGreaterThan(40)
    }
  })

  it('renders nothing until started, then shows the chapter bar with the caption and plays the audio', () => {
    render(<WalkthroughPlayer />)
    expect(screen.queryByTestId('walkthrough-bar')).toBeNull()
    act(() => useLevers.getState().startWalkthrough())
    expect(screen.getByTestId('walkthrough-bar')).toBeInTheDocument()
    expect(screen.getByTestId('walkthrough-caption')).toHaveTextContent(
      chapters[0].caption.slice(0, 40),
    )
    expect(FakeAudio.instances[0].src).toBe(chapters[0].audio)
    expect(FakeAudio.instances[0].paused).toBe(false)
  })

  it('walks the app: presets in chapter 2, portfolio card in chapter 5, tracker actual in chapter 9', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    expect(useLevers.getState().view).toBe('financials')
    act(() => FakeAudio.instances[0].end())
    expect(useLevers.getState().walkthrough.step).toBe(1)
    act(() => vi.advanceTimersByTime(7500))
    expect(useLevers.getState().scenario).toBe('growth')
    act(() => vi.advanceTimersByTime(5000))
    expect(useLevers.getState().scenario).toBe('base')
    for (const i of [1, 2, 3]) act(() => FakeAudio.instances[i].end())
    expect(useLevers.getState().walkthrough.step).toBe(4)
    act(() => vi.advanceTimersByTime(100))
    expect(useLevers.getState().view).toBe('portfolio')
    act(() => vi.advanceTimersByTime(16000))
    expect(useLevers.getState().openInitiativeId).toBe('pcc_plant')
    for (const i of [4, 5, 6, 7]) act(() => FakeAudio.instances[i].end())
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
    act(() => FakeAudio.instances[0].end())
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByTestId('spotlight')).toHaveAttribute('data-active', 'true')
    anchor.remove()
  })

  it('skips to the next chapter and stops on the buttons', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    act(() => screen.getByRole('button', { name: strings.walkthrough.next }).click())
    expect(useLevers.getState().walkthrough.step).toBe(1)
    expect(FakeAudio.instances[0].paused).toBe(true)
    act(() => screen.getByRole('button', { name: strings.walkthrough.stop }).click())
    expect(useLevers.getState().walkthrough.active).toBe(false)
  })

  it('falls back to the chapter length when audio cannot play', () => {
    Object.defineProperty(window, 'Audio', { value: undefined, configurable: true, writable: true })
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    act(() => vi.advanceTimersByTime(chapters[0].seconds * 1000 + 50))
    expect(useLevers.getState().walkthrough.step).toBe(1)
  })
})
