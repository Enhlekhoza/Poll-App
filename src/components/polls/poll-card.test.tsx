import { render, screen } from '@testing-library/react'
import { PollCard } from './poll-card'
import { Poll } from '@/types'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('PollCard', () => {
  const mockPoll: Poll = {
    id: 'poll-123',
    question: 'Test Question',
    description: 'Test Description',
    user_id: 'user-123',
    created_at: '2023-01-01T00:00:00Z',
    options: [
      { id: 'option-1', poll_id: 'poll-123', text: 'Option 1', votes: 5 },
      { id: 'option-2', poll_id: 'poll-123', text: 'Option 2', votes: 10 },
    ],
  }

  it('renders poll question', () => {
    render(<PollCard poll={mockPoll} />)
    expect(screen.getByText('Test Question')).toBeInTheDocument()
  })

  it('renders poll description when available', () => {
    render(<PollCard poll={mockPoll} />)
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not render description when not available', () => {
    const pollWithoutDescription = { ...mockPoll, description: undefined }
    render(<PollCard poll={pollWithoutDescription} />)
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('displays correct option count and total votes', () => {
    render(<PollCard poll={mockPoll} />)
    expect(screen.getByText('2 options · 15 votes')).toBeInTheDocument()
  })

  it('renders view poll button when showActions is true', () => {
    render(<PollCard poll={mockPoll} />)
    expect(screen.getByText('View Poll')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/polls/poll-123')
  })

  it('does not render view poll button when showActions is false', () => {
    render(<PollCard poll={mockPoll} showActions={false} />)
    expect(screen.queryByText('View Poll')).not.toBeInTheDocument()
  })
})