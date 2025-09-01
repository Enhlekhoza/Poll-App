"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Poll {
  id: string
  title: string
  description: string | null
  created_at: string
  user_id: string
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolls = async () => {
      const { data, error } = await supabase.from("polls").select("*").order("created_at", { ascending: false })
      if (!error && data) setPolls(data)
      setLoading(false)
    }
    fetchPolls()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Loading polls...</p></div>
  if (polls.length === 0) return <div className="flex items-center justify-center min-h-screen"><p>No polls yet.</p></div>

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Polls</h1>
        <Link href="/polls/create">
          <Button>Create Poll</Button>
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {polls.map(poll => (
          <Card key={poll.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{poll.title}</CardTitle>
              {poll.description && <CardDescription>{poll.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created at: {new Date(poll.created_at).toLocaleString()}
              </p>
              <Link href={`/polls/${poll.id}`} className="mt-4 inline-block">
                <Button variant="outline">View Poll</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}