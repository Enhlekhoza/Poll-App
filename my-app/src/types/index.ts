export interface Poll {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  createdAt: Date
  createdBy: string
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface User {
  id: string
  email: string
  name: string
}