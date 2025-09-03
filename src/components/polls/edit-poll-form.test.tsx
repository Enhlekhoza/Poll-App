import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditPollForm } from './edit-poll-form'
import type { Poll, PollOption } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// This test file focuses on comprehensive testing of the EditPollForm component
// with special attention to the Poll and PollOption types from index.ts

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('EditPollForm', () => {
  // Sample poll data using the Poll type from index.ts
  const mockPoll: Poll = {
    id: 'poll-123',
    title: 'Test Poll',
    description: 'Test Description',
    created_at: '2023-01-01T00:00:00Z',
    user_id: 'user-123',
    options: [
      { id: 'option-1', text: 'Option 1', votes: 5, poll_id: 'poll-123' },
      { id: 'option-2', text: 'Option 2', votes: 3, poll_id: 'poll-123' },
    ],
  }
  
  // Create a poll with optional description field omitted to test type handling
  const pollWithoutDescription: Poll = {
    id: 'poll-456',
    title: 'Poll Without Description',
    created_at: '2023-01-02T00:00:00Z',
    user_id: 'user-123',
    options: [
      { id: 'option-3', text: 'Option A', votes: 0, poll_id: 'poll-456' },
      { id: 'option-4', text: 'Option B', votes: 0, poll_id: 'poll-456' },
    ],
  }

  const mockRouter = { refresh: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders with the correct initial values', () => {
    render(<EditPollForm poll={mockPoll} />)
    
    // Check if title and description are pre-filled
    expect(screen.getByLabelText(/Poll Title/i)).toHaveValue('Test Poll')
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description')
    
    // Check if options are pre-filled
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    expect(optionInputs[0]).toHaveValue('Option 1')
    expect(optionInputs[1]).toHaveValue('Option 2')
  })
  
  it('handles poll without description (optional field in Poll type)', () => {
    render(<EditPollForm poll={pollWithoutDescription} />)
    
    // Check if title is pre-filled
    expect(screen.getByLabelText(/Poll Title/i)).toHaveValue('Poll Without Description')
    
    // Check if description is empty string (component handles undefined description)
    expect(screen.getByLabelText(/Description/i)).toHaveValue('')
    
    // Check if options are pre-filled
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    expect(optionInputs[0]).toHaveValue('Option A')
    expect(optionInputs[1]).toHaveValue('Option B')
  })

  it('allows adding a new option', () => {
    render(<EditPollForm poll={mockPoll} />)
    
    // Initially there should be 2 options
    expect(screen.getAllByPlaceholderText(/Option \d/).length).toBe(2)
    
    // Click add option button
    fireEvent.click(screen.getByText('Add Option'))
    
    // Now there should be 3 options
    expect(screen.getAllByPlaceholderText(/Option \d/).length).toBe(3)
  })

  it('prevents removing options if only 2 remain', () => {
    render(<EditPollForm poll={mockPoll} />)
    
    // Initially there should be 2 options and no remove buttons
    expect(screen.queryAllByText('Remove').length).toBe(0)
    
    // Add an option so we can test removal
    fireEvent.click(screen.getByText('Add Option'))
    
    // Now there should be 3 options and 3 remove buttons
    expect(screen.getAllByText('Remove').length).toBe(3)
    
    // Remove two options
    fireEvent.click(screen.getAllByText('Remove')[0])
    fireEvent.click(screen.getAllByText('Remove')[0])
    
    // Now there should be only 2 options and no remove buttons
    expect(screen.getAllByPlaceholderText(/Option \d/).length).toBe(2)
    expect(screen.queryAllByText('Remove').length).toBe(0)
  })

  it('validates form before submission', async () => {
    render(<EditPollForm poll={mockPoll} />)
    
    // Clear the title
    fireEvent.change(screen.getByLabelText(/Poll Title/i), { target: { value: '' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Check if validation error is shown
    expect(toast.error).toHaveBeenCalledWith('Poll title is required')
    
    // Clear an option
    fireEvent.change(screen.getAllByPlaceholderText(/Option \d/)[0], { target: { value: '' } })
    
    // Set title back
    fireEvent.change(screen.getByLabelText(/Poll Title/i), { target: { value: 'Test Poll' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Check if validation error is shown for empty option
    expect(toast.error).toHaveBeenCalledWith('All options must have text')
  })

  it('submits the form and updates the poll successfully', async () => {
    // Mock successful responses
    const mockUpdateResponse = { error: null }
    const mockInsertResponse = { error: null }
    
    ;(supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockUpdateResponse)
        }),
        insert: jest.fn().mockResolvedValue(mockInsertResponse),
      }
    })

    render(<EditPollForm poll={mockPoll} />)
    
    // Update title
    fireEvent.change(screen.getByLabelText(/Poll Title/i), { target: { value: 'Updated Poll Title' } })
    
    // Update description
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Updated Description' } })
    
    // Update an option
    fireEvent.change(screen.getAllByPlaceholderText(/Option \d/)[0], { target: { value: 'Updated Option 1' } })
    
    // Add a new option
    fireEvent.click(screen.getByText('Add Option'))
    fireEvent.change(screen.getAllByPlaceholderText(/Option \d/)[2], { target: { value: 'New Option 3' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Wait for async operations
    await waitFor(() => {
      // Check if success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Poll updated successfully!')
      
      // Check if router.refresh was called
      expect(mockRouter.refresh).toHaveBeenCalled()
    })
  })
  
  it('correctly handles PollOption type when adding and updating options', async () => {
    // Mock successful responses
    const mockUpdateResponse = { error: null }
    const mockInsertResponse = { error: null }
    const updateSpy = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockUpdateResponse)
    })
    const insertSpy = jest.fn().mockResolvedValue(mockInsertResponse)
    
    ;(supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        update: updateSpy,
        insert: insertSpy,
      }
    })

    render(<EditPollForm poll={mockPoll} />)
    
    // Add multiple new options to test PollOption type handling
    fireEvent.click(screen.getByText('Add Option'))
    fireEvent.click(screen.getByText('Add Option'))
    
    // Update option values
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    fireEvent.change(optionInputs[2], { target: { value: 'New Option 1' } })
    fireEvent.change(optionInputs[3], { target: { value: 'New Option 2' } })
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Wait for async operations
    await waitFor(() => {
      // Verify that insert was called with correctly typed data
      // The inserted data should match the PollOption type structure (without id)
      expect(insertSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          poll_id: 'poll-123',
          text: 'New Option 1',
          votes: 0
        }),
        expect.objectContaining({
          poll_id: 'poll-123',
          text: 'New Option 2',
          votes: 0
        })
      ])
      
      // Check if success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Poll updated successfully!')
    })
  })

  it('handles errors during form submission', async () => {
    // Mock error response
    const mockError = { error: new Error('Database error') }
    
    ;(supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockError)
        }),
      }
    })

    render(<EditPollForm poll={mockPoll} />)
    
    // Submit the form
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Wait for async operations
    await waitFor(() => {
      // Check if error toast was shown
      expect(toast.error).toHaveBeenCalledWith('Database error')
      
      // Check that router.refresh was not called
      expect(mockRouter.refresh).not.toHaveBeenCalled()
    })
  })
  
  it('validates Poll type structure during form submission', async () => {
    // Create a poll with the minimum required fields according to Poll type
    const minimalPoll: Poll = {
      id: 'poll-min',
      title: 'Minimal Poll',
      created_at: new Date().toISOString(),
      user_id: 'user-123',
      options: [
        { id: 'option-min-1', text: 'Min Option 1', votes: 0, poll_id: 'poll-min' },
        { id: 'option-min-2', text: 'Min Option 2', votes: 0, poll_id: 'poll-min' },
      ],
    }
    
    // Mock successful responses
    const mockUpdateResponse = { error: null }
    ;(supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockUpdateResponse)
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      }
    })

    render(<EditPollForm poll={minimalPoll} />)
    
    // Submit the form without making any changes
    fireEvent.click(screen.getByText('Update Poll'))
    
    // Wait for async operations
    await waitFor(() => {
      // Check if success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Poll updated successfully!')
      
      // Verify that the update was called with the correct structure
      // matching the Poll type (title and description fields)
      expect(supabase.from).toHaveBeenCalledWith('polls')
      const updateFn = supabase.from('polls').update
      expect(updateFn).toHaveBeenCalledWith({
        title: 'Minimal Poll',
        description: null // Description is optional in Poll type
      })
    })
  })
})