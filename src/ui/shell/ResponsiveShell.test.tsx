import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../../App'
import { useLevers } from '../../state/levers'

const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = (query) => ({
    ...originalMatchMedia(query),
    matches: query.includes('max-width') || query.includes('prefers-reduced-motion'),
  })
  useLevers.getState().stopWalkthrough()
  useLevers.getState().reset()
  useLevers.getState().enter()
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
})

it('opens the compact lever drawer, edits a lever and returns keyboard focus on Escape', () => {
  render(<App />)
  const toggle = screen.getByRole('button', { name: 'Show levers' })
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  fireEvent.click(toggle)
  expect(document.getElementById('lever-drawer')).not.toHaveAttribute('inert')
  fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
  expect(useLevers.getState().levers.L2).toBe(140)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  expect(toggle).toHaveFocus()
})

it('reveals mobile controls for walkthrough rail focus and closes them for chart focus', () => {
  render(<App />)
  act(() => useLevers.getState().startWalkthrough())
  act(() => useLevers.getState().setWalkthroughStep(8))
  expect(document.getElementById('lever-drawer')).not.toHaveAttribute('inert')
  act(() => useLevers.getState().setWalkthroughStep(9))
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  act(() => useLevers.getState().stopWalkthrough())
})

it('keeps walkthrough Stop reachable in the compact drawer keyboard loop', () => {
  render(<App />)
  act(() => useLevers.getState().startWalkthrough())
  act(() => useLevers.getState().setWalkthroughStep(8))
  const close = screen.getByRole('button', { name: 'Close levers' })
  close.focus()
  fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
  expect(screen.getByRole('button', { name: 'Stop' })).toHaveFocus()
  act(() => useLevers.getState().stopWalkthrough())
})

it('replays the spotlight focus when resizing into compact mode during a rail chapter', () => {
  let compact = false
  window.matchMedia = (query) => ({
    ...originalMatchMedia(query),
    matches: query.includes('max-width') ? compact : query.includes('prefers-reduced-motion'),
  })
  const { rerender } = render(<App />)
  act(() => useLevers.getState().startWalkthrough())
  act(() => useLevers.getState().setWalkthroughStep(8))
  compact = true
  rerender(<App />)
  expect(screen.getByRole('button', { name: 'Hide levers' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  expect(document.getElementById('lever-drawer')).not.toHaveAttribute('inert')
  act(() => useLevers.getState().stopWalkthrough())
})

it('keeps desktop controls on demand and opens them for walkthrough steps', () => {
  window.matchMedia = (query) => ({
    ...originalMatchMedia(query),
    matches: query.includes('prefers-reduced-motion'),
  })
  render(<App />)
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  fireEvent.click(screen.getByRole('button', { name: 'Show levers' }))
  expect(screen.getByRole('dialog', { name: 'Scenario controls' })).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  act(() => useLevers.getState().startWalkthrough())
  act(() => useLevers.getState().setWalkthroughStep(8))
  expect(document.getElementById('lever-drawer')).not.toHaveAttribute('inert')
  act(() => useLevers.getState().setWalkthroughStep(9))
  expect(document.getElementById('lever-drawer')).toHaveAttribute('inert')
  act(() => useLevers.getState().stopWalkthrough())
})
