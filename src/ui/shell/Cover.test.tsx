import { act, render, screen, fireEvent } from '@testing-library/react'
import { Cover } from './Cover'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'

describe('Cover', () => {
  beforeEach(() => {
    window.sessionStorage.removeItem('strata-entered')
    useLevers.getState().goHome()
  })

  it('shows the wordmark, the Sia logo with powered by, and the illustrative note', () => {
    render(<Cover />)
    expect(screen.getByText('STRATA')).toBeInTheDocument()
    expect(screen.getByText(strings.cover.poweredBy)).toBeInTheDocument()
    expect(screen.getByAltText('Sia')).toBeInTheDocument()
    expect(screen.getByText(strings.app.illustrative)).toBeInTheDocument()
  })

  it('enters on the button and remembers it for the session', () => {
    render(<Cover />)
    fireEvent.click(screen.getByRole('button', { name: strings.cover.enter }))
    expect(useLevers.getState().showCover).toBe(false)
    expect(window.sessionStorage.getItem('strata-entered')).toBe('1')
  })

  it('enters on the Enter key', () => {
    render(<Cover />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useLevers.getState().showCover).toBe(false)
  })

  it('starts the walkthrough from the cover', () => {
    render(<Cover />)
    fireEvent.click(screen.getByRole('button', { name: strings.cover.walkthrough }))
    expect(useLevers.getState().showCover).toBe(false)
    expect(useLevers.getState().walkthrough).toEqual({ active: true, step: 0 })
  })

  it('finishes the exit transition before starting walkthrough timing', () => {
    vi.useFakeTimers()
    const original = window.matchMedia
    window.matchMedia = (query) => ({ ...original(query), matches: false })
    try {
      render(<Cover />)
      fireEvent.click(screen.getByRole('button', { name: strings.cover.walkthrough }))
      expect(screen.getByTestId('cover')).toHaveClass('cover--leaving')
      expect(useLevers.getState().showCover).toBe(true)
      expect(useLevers.getState().walkthrough.active).toBe(false)
      act(() => vi.advanceTimersByTime(800))
      expect(useLevers.getState().showCover).toBe(false)
      expect(useLevers.getState().walkthrough).toEqual({ active: true, step: 0 })
    } finally {
      window.matchMedia = original
      vi.useRealTimers()
      useLevers.getState().stopWalkthrough()
    }
  })
})
