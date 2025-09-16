"use client"

import { useParams } from "next/navigation"
import { PollDetailsDisplay } from "@/components/polls/PollDetailsDisplay"

export default function PublicPollDetailsPage() {
  const { id } = useParams()
  const pollId = Array.isArray(id) ? id[0] : id

  if (!pollId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Invalid Poll ID.</p>
      </div>
    )
  }

  return <PollDetailsDisplay pollId={pollId} isDashboardView={false} />
}
