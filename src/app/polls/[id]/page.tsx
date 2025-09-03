"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Poll, PollOption } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PollResultsChart } from '@/components/polls/poll-results-chart'

export default function PollDetailPage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true)
      
      // Fetch poll with its options
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .single()
      
      if (pollError) {
        toast.error('Failed to load poll')
        setLoading(false)
        return
      }
      
      // Fetch options for this poll
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', id)
      
      if (optionsError) {
        toast.error('Failed to load poll options')
        setLoading(false)
        return
      }
      
      // Check if user has already voted
      if (user) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('poll_id', id)
          .eq('user_id', user.id)
          .single()
        
        setHasVoted(!!voteData)
      }
      
      // Calculate total votes
      const total = optionsData.reduce((sum: number, option: PollOption) => sum + option.votes, 0)
      setTotalVotes(total)
      
      // Combine poll with its options
      const fullPoll = {
        ...pollData,
        options: optionsData,
      }
      
      setPoll(fullPoll)
      setLoading(false)
    }
    
    fetchPoll()
  }, [id, user])
  
  const handleVote = async () => {
    if (!selectedOption) {
      toast.error('Please select an option')
      return
    }
    
    setVoting(true)
    
    try {
      // Record the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          poll_id: id,
          option_id: selectedOption,
          user_id: user?.id || null,
        })
      
      if (voteError) throw voteError
      
      // Increment the vote count for the selected option
      const { error: updateError } = await supabase.rpc('increment_vote', {
        option_id_param: selectedOption
      })
      
      if (updateError) throw updateError
      
      // Update local state
      setPoll(prev => {
        if (!prev) return null
        
        const updatedOptions = prev.options.map(option => {
          if (option.id === selectedOption) {
            return { ...option, votes: option.votes + 1 }
          }
          return option
        })
        
        return { ...prev, options: updatedOptions }
      })
      
      setTotalVotes(prev => prev + 1)
      setHasVoted(true)
      toast.success('Vote recorded!')
    } catch (error) {
      toast.error('Failed to record vote')
      console.error(error)
    } finally {
      setVoting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!poll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Poll not found</h1>
        <Button asChild>
          <Link href="/polls">Back to Polls</Link>
        </Button>
      </div>
    )
  }
  
  const isOwner = user && user.id === poll.user_id
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="mt-2">{poll.description}</CardDescription>
              )}
            </div>
            {isOwner && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/polls/${id}/edit`}>Edit</Link>
                </Button>
                <Button variant="destructive" size="sm" asChild>
                  <Link href={`/polls/${id}/delete`}>Delete</Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {hasVoted ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Results</h3>
                <PollResultsChart options={poll.options} />
              </div>
            ) : (
              <div className="space-y-4">
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      id={option.id}
                      name="poll-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      disabled={voting}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor={option.id} className="flex-1 cursor-pointer text-sm md:text-base">
                      {option.text}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-500">Total votes: {totalVotes}</p>
              {!hasVoted ? (
                <Button 
                  onClick={handleVote} 
                  disabled={!selectedOption || voting}
                  className="px-6"
                >
                  {voting ? 'Voting...' : 'Submit Vote'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setHasVoted(false)}
                  className="text-sm"
                >
                  Back to Voting
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" asChild>
            <Link href="/polls">Back to Polls</Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href={`/polls/${id}/share`}>Share Poll</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}