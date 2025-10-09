'use client'

import { useEffect, useState } from "react"
import { LoadingSpinner } from "../ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { toast } from "sonner"

interface Comment {
  id: string
  text: string
  author: {
    email: string
  }
}

interface CommentListProps {
  pollId: string
  refreshComments?: boolean
}

export function CommentList({ pollId, refreshComments }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/polls/${pollId}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments || [])
      } else {
        toast.error(data.error || "Failed to load comments")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load comments")
    }
    setLoading(false)
  }

  useEffect(() => {
    if (pollId) fetchComments()
  }, [pollId, refreshComments])

  if (loading) return <LoadingSpinner />

  if (comments.length === 0) return <p className="text-gray-500">No comments yet.</p>

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{comment.author.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{comment.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}