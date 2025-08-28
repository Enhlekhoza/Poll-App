"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { PollForm } from "@/components/polls/poll-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CreatePollPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login?redirect=/polls/create")
  }, [user, loading, router])

  if (loading || !user) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
          <CardDescription>Add a question and multiple options</CardDescription>
        </CardHeader>
        <CardContent>
          <PollForm />
        </CardContent>
      </Card>
    </div>
  )
}