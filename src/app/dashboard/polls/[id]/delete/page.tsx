"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Poll } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DeletePollPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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
      
      // Combine poll with its options
      const fullPoll = {
        ...pollData,
        options: optionsData,
      }
      
      // Check if user is the owner
      if (user?.id !== pollData.user_id) {
        toast.error('You do not have permission to delete this poll')
        router.push(`/polls/${id}`)
        return
      }
      
      setPoll(fullPoll)
      setLoading(false)
    }
    
    fetchPoll()
  }, [id, user, router])
  
  const handleDelete = async () => {
    if (!poll) return
    
    setDeleting(true)
    
    try {
      // Delete votes first (foreign key constraint)
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('poll_id', id)
      
      if (votesError) throw votesError
      
      // Delete options
      const { error: optionsError } = await supabase
        .from('poll_options')
        .delete()
        .eq('poll_id', id)
      
      if (optionsError) throw optionsError
      
      // Delete the poll
      const { error: pollError } = await supabase
        .from('polls')
        .delete()
        .eq('id', id)
      
      if (pollError) throw pollError
      
      toast.success('Poll deleted successfully')
      router.push('/polls')
    } catch (error) {
      toast.error('Failed to delete poll')
      console.error(error)
      setDeleting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
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
  
  return (
    <ProtectedRoute>
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">Delete Poll</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p className="text-center">Are you sure you want to delete this poll?</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium">{poll.title}</h3>
                {poll.description && <p className="text-sm text-gray-600 mt-1">{poll.description}</p>}
                <p className="text-sm text-gray-500 mt-2">{poll.options.length} options · Created on {new Date(poll.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-red-500">This action cannot be undone. All votes and options will be permanently deleted.</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between space-x-4">
            <Button variant="outline" asChild className="w-full">
              <Link href={`/polls/${id}`}>Cancel</Link>
            </Button>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Poll'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  )
}