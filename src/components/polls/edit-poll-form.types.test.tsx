import { render, screen, fireEvent } from '@testing-library/react'
import { EditPollForm } from './edit-poll-form'
import type { Poll } from '@/types/index'

// Mock dependencies
jest.mock('sonner')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    refresh: jest.fn(),
    push: jest.fn(),
  })),
}))

describe('EditPollForm Type Compatibility Tests', () => {
  it('accepts a Poll object with all required fields from index.ts', () => {
    // Create a minimal poll with only required fields from Poll type
    const minimalPoll: Poll = {
      id: 'poll-min',
      title: 'Minimal Poll',
      description: null, // Add description as null to satisfy the type
      createdAt: new Date(),
      author: { id: 'user-123', name: 'testuser' },
      options: [
        { id: 'option-min-1', text: 'Min Option 1', _count: { votes: 0 } },
        { id: 'option-min-2', text: 'Min Option 2', _count: { votes: 0 } },
      ],
    }
    
    // This should render without type errors
    render(<EditPollForm poll={minimalPoll} />)
    
    // Verify the component renders with the minimal poll data
    expect(screen.getByLabelText(/Poll Title/i)).toHaveValue('Minimal Poll')
    expect(screen.getByLabelText(/Description/i)).toHaveValue('')
  })

  it('accepts a Poll object with all optional fields from index.ts', () => {
    // Create a complete poll with all optional fields
    const completePoll: Poll = {
      id: 'poll-complete',
      title: 'Complete Poll',
      description: 'This poll has all fields',
      createdAt: new Date(),
      author: { id: 'user-123', name: 'testuser' },
      options: [
        { id: 'option-complete-1', text: 'Complete Option 1', _count: { votes: 20 } },
        { id: 'option-complete-2', text: 'Complete Option 2', _count: { votes: 22 } },
      ],
    }
    
    // This should render without type errors
    render(<EditPollForm poll={completePoll} />)
    
    // Verify the component renders with the complete poll data
    expect(screen.getByLabelText(/Poll Title/i)).toHaveValue('Complete Poll')
    expect(screen.getByLabelText(/Description/i)).toHaveValue('This poll has all fields')
  })

  it('correctly handles PollOption objects from index.ts', () => {
    // Create poll options using the PollOption type
    const options: Poll['options'] = [
      { id: 'option-1', text: 'First Option', _count: { votes: 10 } },
      { id: 'option-2', text: 'Second Option', _count: { votes: 5 } },
    ]
    
    const pollWithTypedOptions: Poll = {
      id: 'poll-options',
      title: 'Poll with Typed Options',
      description: null, // Add description as null to satisfy the type
      createdAt: new Date(),
      author: { id: 'user-123', name: 'testuser' },
      options,
    }
    
    render(<EditPollForm poll={pollWithTypedOptions} />)
    
    // Verify the options are rendered correctly
    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/)
    expect(optionInputs[0]).toHaveValue('First Option')
    expect(optionInputs[1]).toHaveValue('Second Option')
    
    // Test adding a new option
    fireEvent.click(screen.getByText('Add Option'))
    
    // The new option should be added to the form
    expect(screen.getAllByPlaceholderText(/Option \d+/).length).toBe(3)
  })
})