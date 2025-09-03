import { render, screen } from '@testing-library/react'
import { PollResultsChart } from './poll-results-chart'
import { PollOption } from '@/types'

describe('PollResultsChart', () => {
  const mockOptions: PollOption[] = [
    { id: '1', poll_id: 'poll1', text: 'Option 1', votes: 10 },
    { id: '2', poll_id: 'poll1', text: 'Option 2', votes: 5 },
    { id: '3', poll_id: 'poll1', text: 'Option 3', votes: 0 },
  ]

  it('renders all poll options', () => {
    render(<PollResultsChart options={mockOptions} />)
    
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('displays correct vote counts and percentages', () => {
    render(<PollResultsChart options={mockOptions} />)
    
    expect(screen.getByText('10 votes (67%)')).toBeInTheDocument()
    expect(screen.getByText('5 votes (33%)')).toBeInTheDocument()
    expect(screen.getByText('0 votes (0%)')).toBeInTheDocument()
  })

  it('displays the total vote count', () => {
    render(<PollResultsChart options={mockOptions} />)
    
    expect(screen.getByText('Total votes: 15')).toBeInTheDocument()
  })

  it('handles empty options array', () => {
    render(<PollResultsChart options={[]} />)
    
    expect(screen.getByText('Total votes: 0')).toBeInTheDocument()
  })

  it('sorts options by vote count in descending order', () => {
    const { container } = render(<PollResultsChart options={mockOptions} />)
    
    // Get all option text elements
    const optionElements = container.querySelectorAll('.font-medium')
    
    // Check that they appear in the correct order
    expect(optionElements[0].textContent).toBe('Option 1')
    expect(optionElements[1].textContent).toBe('Option 2')
    expect(optionElements[2].textContent).toBe('Option 3')
  })
})