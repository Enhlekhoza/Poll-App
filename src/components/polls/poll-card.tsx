import { Poll } from '@/types/index'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit, Eye, MoreHorizontal, Share2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface PollCardProps {
  poll: Poll
  showActions?: boolean
}

export function PollCard({ poll, showActions = true }: PollCardProps) {
  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0)
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{poll.title}</CardTitle>
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
        <CardFooter className="mt-auto pt-4 flex items-center justify-between gap-3">
          <Link href={`/dashboard/polls/${poll.id}`} className="flex-1">
            <Button className="w-full">
              <Eye className="w-4 h-4 mr-2" /> View
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/polls/${poll.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/polls/${poll.id}/share`}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/polls/${poll.id}/delete`}>
                  <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Delete
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      )}
    </Card>
  )
}