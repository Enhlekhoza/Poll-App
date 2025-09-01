import { PollCard } from '@/components/polls/poll-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Mock data - replace with actual data fetching
const mockPolls = [
  { id: '1', question: 'Favorite programming language?', totalVotes: 150 },
  { id: '2', question: 'Best frontend framework?', totalVotes: 89 },
  { id: '3', question: 'Preferred database system?', totalVotes: 67 },
]

export default function PollsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Polls</h1>
        <Button asChild>
          <Link href="/create-poll">Create New Poll</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {mockPolls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
    </div>
  )
}