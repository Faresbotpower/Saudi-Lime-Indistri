import { render, screen, fireEvent, within } from '@testing-library/react'
import { Report } from './Report'
import { TopBar } from '../shell/TopBar'
import { useLevers } from '../../state/levers'
import { strings } from '../../strings'

describe('printable report', () => {
  beforeEach(() => useLevers.getState().reset())

  it('renders every deliverable section with the scenario and lever values', () => {
    render(<Report />)
    const r = screen.getByTestId('report')
    for (const h of strings.report.sections)
      expect(
        within(r).getByText((t) => t.trim().endsWith(h) && t.trim().includes('. ')),
      ).toBeInTheDocument()
    expect(within(r).getAllByText(strings.scenarios.base).length).toBeGreaterThan(0)
    expect(within(r).getAllByText(/Energy cost/).length).toBeGreaterThan(0)
    expect(within(r).getAllByRole('table').length).toBeGreaterThanOrEqual(5)
    expect(within(r).getByText(strings.app.illustrativeLong, { exact: false })).toBeInTheDocument()
  })

  it('the export button prints', () => {
    const print = vi.fn()
    Object.defineProperty(window, 'print', { value: print, configurable: true, writable: true })
    render(<TopBar />)
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: strings.report.export }))
    expect(useLevers.getState().printing).toBe(true)
    vi.advanceTimersByTime(100)
    expect(print).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
