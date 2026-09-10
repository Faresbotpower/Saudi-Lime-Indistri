import { render, screen, fireEvent, within } from '@testing-library/react'
import App from './App'
import { strings } from './strings'
import { useLevers } from './state/levers'

describe('shell', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().enter()
  })

  it('renders the six tabs, six levers and the permanent banner', () => {
    render(<App />)
    expect(screen.getAllByRole('tab')).toHaveLength(7)
    for (const id of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
      expect(screen.getByText(id)).toBeInTheDocument()
    expect(screen.getByText(strings.app.illustrative)).toBeInTheDocument()
    expect(screen.getByAltText('Sia')).toBeInTheDocument()
  })

  it('renders base preset values in the rail', () => {
    render(<App />)
    expect(screen.getByText('On plan, 1.00x')).toBeInTheDocument()
    expect(screen.getByText('SAR 600m')).toBeInTheDocument()
  })

  it('switches scenario name to Custom when a lever moves, and back on reset', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Energy cost'), { target: { value: '140' } })
    const header = screen.getByRole('banner')
    expect(within(header).getByText(strings.scenarios.custom)).toBeInTheDocument()
    fireEvent.click(screen.getByText(strings.app.reset))
    expect(within(header).getByText(strings.scenarios.base)).toBeInTheDocument()
  })

  it('applies a preset', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: strings.scenarios.downside }))
    expect(screen.getByText('SAR 350m')).toBeInTheDocument()
  })
})

describe('view switching', () => {
  beforeEach(() => {
    useLevers.getState().reset()
    useLevers.getState().enter()
  })

  it('switches the main view when a tab is clicked', async () => {
    const { findByTestId } = render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: /Growth portfolio/ }))
    expect(await findByTestId('capital-strip')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Strategic direction/ }))
    expect(await findByTestId('strata-reveal')).toBeInTheDocument()
  })
})
