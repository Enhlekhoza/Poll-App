import { render, screen } from '@testing-library/react'
import { PollResultsChart } from './poll-results-chart'
import { Poll } from '@/types/index'

describe('PollResultsChart', () => {
  const mockOptions: Poll['options'] = [
    { id: '1', text: 'Option 1', _count: { votes: 10 } },
    { id: '2', text: 'Option 2', _count: { votes: 5 } },
    { id: '3', text: 'Option 3', _count: { votes: 0 } },
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