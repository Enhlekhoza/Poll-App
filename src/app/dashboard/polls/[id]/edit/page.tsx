"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPollById } from "@/lib/actions/poll-actions"
import { Poll } from "@/types/index"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EditPollForm } from "@/components/polls/EditPollForm"

export default function EditPollPage() {
  const { id } = useParams()
  const pollId = Array.isArray(id) ? id[0] : id
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true)
      if (!pollId) {
        toast.error("Poll ID is missing.")
        setLoading(false)
        return;
      }
      const { poll, error } = await getPollById(pollId)
      if (error) {
        toast.error(error)
        setPoll(null)
      } else {
        setPoll(poll)
      }
      setLoading(false)
    }
    if (pollId) {
      fetchPoll()
    }
  }, [pollId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Poll not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Poll</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Modify your poll details and options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditPollForm poll={poll} />
        </CardContent>
      </Card>
    </div>
  )
}