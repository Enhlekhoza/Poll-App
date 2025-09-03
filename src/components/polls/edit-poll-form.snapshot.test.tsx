import { render } from '@testing-library/react'
import { EditPollForm } from './edit-poll-form'
import { createMockPoll } from './edit-poll-form.test.utils'

// Import the types to ensure we're using them correctly
import { Poll } from '@/types'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('sonner')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    refresh: jest.fn(),
    push: jest.fn(),
  })),
}))

describe('EditPollForm Snapshot Tests', () => {
  it('matches snapshot with default poll data', () => {
    // Create a poll with the correct type structure
    const typedPoll: Poll = createMockPoll()
    
    // Render the component with the typed poll
    const { container } = render(<EditPollForm poll={typedPoll} />)
    
    // Verify the snapshot matches
    expect(container).toMatchSnapshot()
  })

  it('matches snapshot with minimal poll data', () => {
    // Create a poll with minimal data
    const minimalPoll: Poll = createMockPoll({
      description: undefined,
      options: [
        { id: 'option-1', text: 'Option 1', votes: 0, poll_id: 'poll-123' },
        { id: 'option-2', text: 'Option 2', votes: 0, poll_id: 'poll-123' },
      ],
    })
    
    // Render the component with the minimal poll
    const { container } = render(<EditPollForm poll={minimalPoll} />)
    
    // Verify the snapshot matches
    expect(container).toMatchSnapshot()
  })

  it('matches snapshot with many options', () => {
    // Create a poll with many options
    const manyOptions = Array.from({ length: 5 }, (_, i) => ({
      id: `option-${i}`,
      text: `Option ${i + 1}`,
      votes: i,
      poll_id: 'poll-123'
    }))
    
    const pollWithManyOptions: Poll = createMockPoll({ options: manyOptions })
    
    // Render the component with many options
    const { container } = render(<EditPollForm poll={pollWithManyOptions} />)
    
    // Verify the snapshot matches
    expect(container).toMatchSnapshot()
  })
})