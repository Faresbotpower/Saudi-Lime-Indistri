import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Intro } from './Intro'
import { INTRO_KEY } from './introState'

describe('Intro', () => {
  beforeEach(() => window.sessionStorage.removeItem(INTRO_KEY))

  it('shows the slash and wordmark, and skips on click, remembering for the session', async () => {
    const onDone = vi.fn()
    render(<Intro onDone={onDone} />)
    expect(screen.getByTestId('intro')).toBeInTheDocument()
    expect(screen.getByText('STRATA')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('intro'))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(window.sessionStorage.getItem(INTRO_KEY)).toBe('1')
  })

  it('reports whether it should play', async () => {
    const { shouldPlayIntro } = await import('./introState')
    expect(shouldPlayIntro()).toBe(true)
    window.sessionStorage.setItem(INTRO_KEY, '1')
    expect(shouldPlayIntro()).toBe(false)
  })
})
