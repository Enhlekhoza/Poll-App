import { Poll, PollOption, User } from '@/types'

/**
 * Mock data utilities for testing the EditPollForm component
 */

/**
 * Creates a mock poll option with the given properties
 */
export const createMockPollOption = (overrides?: Partial<PollOption>): PollOption => ({
  id: `option-${Math.random().toString(36).substring(2, 9)}`,
  text: 'Mock Option',
  votes: 0,
  poll_id: 'poll-123',
  ...overrides,
})

/**
 * Creates a mock poll with the given properties
 */
export const createMockPoll = (overrides?: Partial<Poll>): Poll => ({
  id: 'poll-123',
  title: 'Mock Poll Title',
  description: 'Mock Poll Description',
  created_at: new Date().toISOString(),
  user_id: 'user-123',
  options: [
    createMockPollOption({ id: 'option-1', text: 'Option 1', votes: 5 }),
    createMockPollOption({ id: 'option-2', text: 'Option 2', votes: 3 }),
  ],
  ...overrides,
})

/**
 * Creates a mock user with the given properties
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  ...overrides,
})

/**
 * Mock Supabase response for successful operations
 */
export const mockSuccessResponse = {
  data: {},
  error: null,
}

/**
 * Mock Supabase response for failed operations
 */
export const mockErrorResponse = {
  data: null,
  error: new Error('Mock database error'),
}

/**
 * Setup mock for Supabase client to return success responses
 */
export const setupSuccessfulSupabaseMock = (supabaseMock: any) => {
  supabaseMock.from.mockImplementation(() => ({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockSuccessResponse),
    }),
    insert: jest.fn().mockResolvedValue(mockSuccessResponse),
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockSuccessResponse),
      single: jest.fn().mockResolvedValue(mockSuccessResponse),
    }),
  }))
}

/**
 * Setup mock for Supabase client to return error responses
 */
export const setupErrorSupabaseMock = (supabaseMock: any) => {
  supabaseMock.from.mockImplementation(() => ({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockErrorResponse),
    }),
    insert: jest.fn().mockResolvedValue(mockErrorResponse),
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockErrorResponse),
      single: jest.fn().mockResolvedValue(mockErrorResponse),
    }),
  }))
}