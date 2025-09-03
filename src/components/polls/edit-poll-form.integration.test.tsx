import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditPollForm } from './edit-poll-form'
import { createMockPoll, setupSuccessfulSupabaseMock, setupErrorSupabaseMock } from './edit-poll-form.test.utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Import the types to ensure we're using them correctly
import { Poll, PollOption } from '@/types'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('sonner')
jest.mock('next/navigation')

describe('EditPollForm Integration Tests', () => {
  const mockRouter = { refresh: jest.fn(), push: jest.fn() }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Type Integration', () => {
    it('correctly handles Poll and PollOption types from index.ts', () => {
      // Create a poll with the correct type structure
      const typedPoll: Poll = createMockPoll()
      
      // Render the component with the typed poll
      render(<EditPollForm poll={typedPoll} />)
      
      // Verify the component renders with the typed data
      expect(screen.getByLabelText(/Poll Title/i)).toHaveValue(typedPoll.title)
      expect(screen.getByLabelText(/Description/i)).toHaveValue(typedPoll.description)
      
      // Check if options from the typed poll are rendered
      typedPoll.options.forEach((option: PollOption) => {
        const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
        const optionInput = optionInputs.find(input => input.getAttribute('value') === option.text)
        expect(optionInput).toBeInTheDocument()
      })
    })

    it('handles optional description field from Poll type', () => {
      // Create a poll without a description (using the optional field from the type)
      const pollWithoutDescription: Poll = createMockPoll({ description: undefined })
      
      render(<EditPollForm poll={pollWithoutDescription} />)
      
      // Verify the description field is empty
      expect(screen.getByLabelText(/Description/i)).toHaveValue('')
    })
  })

  describe('Form Submission', () => {
    it('correctly formats data according to Poll and PollOption types when submitting', async () => {
      // Setup mock for successful submission
      setupSuccessfulSupabaseMock(supabase)
      
      const typedPoll: Poll = createMockPoll()
      render(<EditPollForm poll={typedPoll} />)
      
      // Update form fields
      fireEvent.change(screen.getByLabelText(/Poll Title/i), { target: { value: 'Updated Title' } })
      fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Updated Description' } })
      
      // Add a new option (which should conform to PollOption type)
      fireEvent.click(screen.getByText('Add Option'))
      const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
      fireEvent.change(optionInputs[2], { target: { value: 'New Option' } })
      
      // Submit the form
      fireEvent.click(screen.getByText('Update Poll'))
      
      // Wait for the submission to complete
      await waitFor(() => {
        // Verify the success message
        expect(toast.success).toHaveBeenCalledWith('Poll updated successfully!')
      })
      
      // Verify that supabase was called with correctly typed data
      expect(supabase.from).toHaveBeenCalledWith('polls')
    })

    it('handles errors while maintaining type integrity', async () => {
      // Setup mock for failed submission
      setupErrorSupabaseMock(supabase)
      
      const typedPoll: Poll = createMockPoll()
      render(<EditPollForm poll={typedPoll} />)
      
      // Submit the form
      fireEvent.click(screen.getByText('Update Poll'))
      
      // Wait for the submission to complete
      await waitFor(() => {
        // Verify the error message
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases with Types', () => {
    it('handles a poll with many options', () => {
      // Create a poll with many options
      const manyOptions: PollOption[] = Array.from({ length: 10 }, (_, i) => ({
        id: `option-${i}`,
        text: `Option ${i + 1}`,
        votes: i,
        poll_id: 'poll-123'
      }))
      
      const pollWithManyOptions: Poll = createMockPoll({ options: manyOptions })
      
      render(<EditPollForm poll={pollWithManyOptions} />)
      
      // Verify all options are rendered
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/)
      expect(optionInputs.length).toBe(10)
      
      // Verify the remove buttons are present for all options
      const removeButtons = screen.getAllByText('Remove')
      expect(removeButtons.length).toBe(10)
    })

    it('handles options with zero votes', () => {
      // Create options with zero votes
      const zeroVoteOptions: PollOption[] = [
        { id: 'option-1', text: 'Zero Vote Option 1', votes: 0, poll_id: 'poll-123' },
        { id: 'option-2', text: 'Zero Vote Option 2', votes: 0, poll_id: 'poll-123' }
      ]
      
      const pollWithZeroVotes: Poll = createMockPoll({ options: zeroVoteOptions })
      
      render(<EditPollForm poll={pollWithZeroVotes} />)
      
      // Verify the options are rendered correctly
      const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
      expect(optionInputs[0]).toHaveValue('Zero Vote Option 1')
      expect(optionInputs[1]).toHaveValue('Zero Vote Option 2')
    })
  })
})