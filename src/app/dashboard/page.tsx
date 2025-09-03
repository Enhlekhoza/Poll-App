'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Poll } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserPolls()
    }
  }, [user])

  const fetchUserPolls = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our Poll type
      const transformedPolls: Poll[] = data.map((poll: any) => ({
        id: poll.id,
        question: poll.question,
        description: poll.description,
        user_id: poll.user_id,
        created_at: poll.created_at,
        options: poll.options.map((option: any) => ({
          id: option.id,
          poll_id: option.poll_id,
          text: option.text,
          votes: option.votes || 0
        }))
      }))

      setPolls(transformedPolls)
    } catch (error: any) {
      toast.error('Error fetching polls: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        setDeleting(pollId)
        
        // First delete all votes for this poll
        const { error: votesError } = await supabase
          .from('votes')
          .delete()
          .eq('poll_id', pollId)
        
        if (votesError) throw votesError
        
        // Then delete all options
        const { error: optionsError } = await supabase
          .from('poll_options')
          .delete()
          .eq('poll_id', pollId)
        
        if (optionsError) throw optionsError
        
        // Finally delete the poll itself
        const { error: pollError } = await supabase
          .from('polls')
          .delete()
          .eq('id', pollId)
        
        if (pollError) throw pollError
        
        // Update the UI
        setPolls(polls.filter(poll => poll.id !== pollId))
        toast.success('Poll deleted successfully')
      } catch (error: any) {
        toast.error('Error deleting poll: ' + error.message)
      } finally {
        setDeleting(null)
      }
    }
  }

  const getTotalVotes = (poll: Poll) => {
    return poll.options.reduce((sum, option) => sum + option.votes, 0)
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>Please log in to view your dashboard</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any polls yet</p>
            <Link href="/polls/create">
              <Button>Create Your First Poll</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => (
            <Card key={poll.id}>
              <CardHeader>
                <CardTitle className="text-xl">{poll.question}</CardTitle>
                {poll.description && (
                  <CardDescription>{poll.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  {poll.options.length} options · {getTotalVotes(poll)} votes
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Link href={`/polls/${poll.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Link href={`/polls/${poll.id}/share`}>
                    <Button variant="outline" size="sm">Share</Button>
                  </Link>
                  <Link href={`/polls/${poll.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeletePoll(poll.id)}
                  disabled={deleting === poll.id}
                >
                  {deleting === poll.id ? 'Deleting...' : 'Delete'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}