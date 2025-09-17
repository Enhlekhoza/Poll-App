"use client"

import { useEffect, useState } from "react"
import { getPollById, votePoll } from "@/lib/actions/poll-actions"
import { Poll } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PollResultsChart } from "@/components/polls/PollResultsChart"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { SharePoll } from "./SharePoll"
import { CommentForm } from "./CommentForm"
import { CommentList } from "./CommentList"

interface PollDetailsDisplayProps {
  pollId: string
  isDashboardView?: boolean
}

export function PollDetailsDisplay({ pollId, isDashboardView = false }: PollDetailsDisplayProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [userVoted, setUserVoted] = useState(false)
  const [refreshComments, setRefreshComments] = useState(false)
  const { user } = useAuth()

  const fetchPoll = async () => {
    setLoading(true)
    const { poll, error } = await getPollById(pollId)
    if (error) {
      toast.error(error)
      setPoll(null)
    } else {
      setPoll(poll)
      // TODO: Implement a more robust check if the current user has already voted
      // For now, we rely on the backend's votePoll to prevent double voting.
    }
    setLoading(false)
  }

  useEffect(() => {
    if (pollId) {
      fetchPoll()
    }
  }, [pollId])

  const handleVote = async (optionId: string) => {
    if (!poll) return;

    setVoting(true);

    // Optimistic UI Update
    const originalPoll = { ...poll }; // Store original poll state
    const updatedOptions = poll.options.map(option =>
      option.id === optionId ? { ...option, votes: option.votes + 1 } : option
    );
    setPoll({ ...poll, options: updatedOptions });
    setUserVoted(true); // Assume vote will succeed

    const { success, error } = await votePoll(pollId, optionId);

    if (error) {
      toast.error(error);
      setPoll(originalPoll); // Revert UI on error
      setUserVoted(false); // Revert voted state
    } else {
      toast.success("Vote cast successfully!");
      // No need to re-fetch poll if optimistic update was correct
      // However, re-fetching ensures consistency if other users voted simultaneously
      fetchPoll(); 
    }
    setVoting(false);
  };

  const handleCommentAdded = () => {
    setRefreshComments(!refreshComments);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
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

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0)

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{poll.title}</CardTitle>
          {poll.description && (
            <CardDescription className="text-lg text-gray-600">
              {poll.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Options:</h3>
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between rounded-md border p-4">
                <p className="text-lg">{option.text}</p>
                <Button
                  onClick={() => handleVote(option.id)}
                  disabled={voting || userVoted}
                  className="ml-4"
                >
                  {voting ? <LoadingSpinner className="mr-2" /> : "Vote"}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Results:</h3>
            {totalVotes === 0 ? (
              <p>No votes yet. Be the first to vote!</p>
            ) : (
              <PollResultsChart data={poll.options.map(option => ({ name: option.text, votes: option.votes }))} />
            )}
            <p className="text-sm text-gray-500">Total Votes: {totalVotes}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          {isDashboardView ? (
            <Link href="/dashboard/polls">
              <Button variant="outline">Back to Polls</Button>
            </Link>
          ) : (
            <div></div> // Empty div for spacing if not dashboard view
          )}
          <div className="flex gap-2">
            {isDashboardView && user?.id === poll.user_id && (
              <Link href={`/dashboard/polls/${poll.id}/edit`}>
                <Button size="sm">Edit Poll</Button>
              </Link>
            )}
            <SharePoll pollId={poll.id} />
          </div>
        </CardFooter>
      </Card>

      <div className="max-w-2xl mx-auto mt-8">
        <h3 className="text-xl font-semibold mb-4">Comments</h3>
        <CommentForm pollId={poll.id} onCommentAdded={handleCommentAdded} />
        <CommentList pollId={poll.id} refreshComments={refreshComments} />
      </div>
    </div>
  )
}