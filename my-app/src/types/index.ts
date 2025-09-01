export interface Poll {
  id: string
  title: string
  description?: string
  options: PollOption[]
  created_at: string
  user_id: string
  total_votes?: number
}

export interface PollOption {
  id: string
  text: string
  votes: number
  poll_id: string
}

export interface User {
  id: string
  email: string
  username: string
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  user_id: string | null
  created_at: string
}