"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Poll } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolls = async () => {
      const { data, error } = await supabase.from("polls").select("*")
      if (!error && data) setPolls(data)
      setLoading(false)
    }
    fetchPolls()
  }, [])

  if (loading) return <p>Loading polls...</p>
  if (polls.length === 0) return <p>No polls yet.</p>

  return (
    <div className="max-w-4xl mx-auto py-8 grid md:grid-cols-2 gap-4">
      {polls.map(poll => (
        <Card key={poll.id}>
          <CardHeader>
            <CardTitle>{poll.title}</CardTitle>
            {poll.description && <CardDescription>{poll.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <p>Options: {poll.options.length}</p>
            <p>Created at: {new Date(poll.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}