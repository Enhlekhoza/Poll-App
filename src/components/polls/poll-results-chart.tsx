'use client'

import { PollOption } from '@/types'

interface PollResultsChartProps {
  options: PollOption[]
  className?: string
}

export function PollResultsChart({ options, className }: PollResultsChartProps) {
  // Calculate total votes
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)
  
  // Sort options by votes (descending)
  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes)
  
  // Generate colors for bars
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ]
  
  return (
    <div className={`space-y-4 ${className}`}>
      {sortedOptions.map((option, index) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
        const barColor = colors[index % colors.length]
        
        return (
          <div key={option.id} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium truncate max-w-[70%]" title={option.text}>
                {option.text}
              </span>
              <span className="text-gray-600">
                {option.votes} votes ({percentage}%)
              </span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
      
      <div className="text-xs text-gray-500 text-right pt-2">
        Total votes: {totalVotes}
      </div>
    </div>
  )
}