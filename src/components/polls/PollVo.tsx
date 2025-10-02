'use client'

import { Poll } from '@/types/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PollVoProps {
  poll: Poll
}

export function PollVo({ poll }: PollVoProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.title}</CardTitle>
        {poll.description && <p className="text-gray-600 text-sm">{poll.description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {poll.options.map(option => {
            const percentage = totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-sm text-gray-500">
                    {option._count.votes} vote{option._count.votes !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}