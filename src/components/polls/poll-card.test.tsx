import { render, screen } from '@testing-library/react'
import { PollCard } from './poll-card'
import { Poll } from '@/types/index'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('PollCard', () => {
  const mockPoll: Poll = {
    id: 'poll-123',
    title: 'Test Question',
    description: 'Test Description',
    createdAt: new Date(),
    author: { id: 'user-123', name: 'testuser' },
    options: [
      { id: 'option-1', text: 'Option 1', _count: { votes: 5 } },
      { id: 'option-2', text: 'Option 2', _count: { votes: 10 } },
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
    const pollWithoutDescription: Poll = { ...mockPoll, description: undefined }
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