import { Poll, Comment } from '@/types/index'

/**
 * Mock data utilities for testing the EditPollForm component
 */

/**
 * Creates a mock poll option with the given properties
 */
export const createMockPollOption = (overrides?: Partial<Poll['options'][0]>): Poll['options'][0] => ({
  id: `option-${Math.random().toString(36).substring(2, 9)}`,
  text: 'Mock Option',
  _count: { votes: 0 },
  ...overrides,
})

/**
 * Creates a mock poll with the given properties
 */
export const createMockPoll = (overrides?: Partial<Poll>): Poll => ({
  id: 'poll-123',
  title: 'Mock Poll Title',
  description: 'Mock Poll Description',
  createdAt: new Date(),
  author: { id: 'user-123', name: 'testuser' },
  options: [
    createMockPollOption({ id: 'option-1', text: 'Option 1', _count: { votes: 5 } }),
    createMockPollOption({ id: 'option-2', text: 'Option 2', _count: { votes: 3 } }),
  ],
  ...overrides,
})