interface PollCardProps {
  poll: {
    id: string
    question: string
    totalVotes: number
  }
}

export function PollCard({ poll }: PollCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">{poll.question}</h2>
      <p className="text-gray-600">{poll.totalVotes} votes</p>
    </div>
  )
}
