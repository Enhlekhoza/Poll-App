"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/ProtectedRoute"
import { PollCard } from "@/components/polls/poll-card"
import { Poll } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Poll type is imported from @/types

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const { data, error } = await supabase
          .from('polls')
          .select(`
            *,
            options:poll_options(*)
          `)
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
        console.error('Error fetching polls:', error.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPolls()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-xl font-medium">No polls available</h2>
        <Link href="/polls/create">
          <Button>Create Your First Poll</Button>
        </Link>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Polls</h1>
          <Link href="/polls/create">
            <Button>Create Poll</Button>
          </Link>
        </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map(poll => (
          <div key={poll.id} className="hover:shadow-lg transition-shadow">
            <PollCard poll={poll} />
          </div>
        ))}
      </div>
    </ProtectedRoute>
  )
}