"use client"

import { useEffect, useState, useCallback } from "react"
import { getUserPolls } from "@/lib/actions/poll-actions"
import { Poll } from "@/types/index"
import { PollCard } from "@/components/polls/poll-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

const POLLS_PER_PAGE = 9; // Define how many polls to load per page

export default function DashboardPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchPolls = useCallback(async (currentOffset: number) => {
    setLoadingMore(true)
    const { polls: newPolls, hasMore: newHasMore, error } = await getUserPolls(POLLS_PER_PAGE, currentOffset)
    if (error) {
      toast.error(error)
    } else {
      setPolls((prevPolls) => [...prevPolls, ...newPolls])
      setHasMore(newHasMore || false)
      setOffset((prevOffset) => prevOffset + newPolls.length)
    }
    setLoadingMore(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPolls(0) // Initial load
  }, [fetchPolls])

  const handleLoadMore = () => {
    fetchPolls(offset)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Link href="/dashboard/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Poll
          </Button>
        </Link>
      </div>

      {polls.length === 0 && !hasMore ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">You haven't created any polls yet.</p>
          <Link href="/dashboard/create">
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Poll
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? <LoadingSpinner className="mr-2" /> : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}