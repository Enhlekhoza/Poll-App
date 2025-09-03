import { Poll } from '@/types'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PollCardProps {
  poll: Poll
  showActions?: boolean
}

export function PollCard({ poll, showActions = true }: PollCardProps) {
  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0)
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{poll.question}</CardTitle>
        {poll.description && (
          <p className="text-gray-600 text-sm">{poll.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-gray-500">
          {poll.options.length} options · {totalVotes} votes
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="mt-auto pt-4">
          <Link href={`/polls/${poll.id}`} className="w-full">
            <Button variant="outline" className="w-full">
              View Poll
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}
