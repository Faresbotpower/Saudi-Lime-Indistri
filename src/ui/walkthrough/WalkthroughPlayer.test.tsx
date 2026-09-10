import { render, screen, act } from '@testing-library/react'
import { WalkthroughPlayer } from './WalkthroughPlayer'
import { steps } from './script'
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

  it('renders nothing until started, then shows the step bar with the caption', () => {
    render(<WalkthroughPlayer />)
    expect(screen.queryByTestId('walkthrough-bar')).toBeNull()
    act(() => useLevers.getState().startWalkthrough())
    expect(screen.getByTestId('walkthrough-bar')).toBeInTheDocument()
    expect(screen.getByTestId('walkthrough-caption')).toHaveTextContent(
      steps[0].caption.slice(0, 40),
    )
    expect(FakeAudio.instances[0].src).toBe(steps[0].audio)
    expect(FakeAudio.instances[0].paused).toBe(false)
  })

  it('plays the story: energy to 140 and the portfolio view in step 2, then advances when audio ends', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    expect(useLevers.getState().view).toBe('financials')
    act(() => FakeAudio.instances[0].end())
    expect(useLevers.getState().walkthrough.step).toBe(1)
    act(() => vi.advanceTimersByTime(3200))
    expect(useLevers.getState().levers.L2).toBe(140)
    act(() => vi.advanceTimersByTime(10000))
    expect(useLevers.getState().view).toBe('portfolio')
    act(() => FakeAudio.instances[1].end())
    act(() => vi.advanceTimersByTime(4000))
    expect(useLevers.getState().levers.L5).toBe(2)
    act(() => vi.advanceTimersByTime(10000))
    expect(useLevers.getState().openInitiativeId).toBe('jeddah_export_terminal')
  })

  it('finishes after the last step and stops on the button', () => {
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    for (let i = 0; i < steps.length; i++) act(() => FakeAudio.instances[i].end())
    expect(useLevers.getState().walkthrough.active).toBe(false)
    act(() => useLevers.getState().startWalkthrough())
    act(() => screen.getByRole('button', { name: strings.walkthrough.stop }).click())
    expect(useLevers.getState().walkthrough.active).toBe(false)
    expect(FakeAudio.instances.at(-1)!.paused).toBe(true)
  })

  it('falls back to the step length when audio cannot play', () => {
    Object.defineProperty(window, 'Audio', { value: undefined, configurable: true, writable: true })
    render(<WalkthroughPlayer />)
    act(() => useLevers.getState().startWalkthrough())
    act(() => vi.advanceTimersByTime(steps[0].seconds * 1000 + 50))
    expect(useLevers.getState().walkthrough.step).toBe(1)
  })
})
