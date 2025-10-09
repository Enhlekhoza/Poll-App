"use client";

import { useParams } from "next/navigation";
import { PollDetailsDisplay } from "@/components/polls/PollDetailsDisplay";

export default function DashboardPollDetailsPage() {
  const params = useParams();
  const pollId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  if (!pollId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Invalid Poll ID.</p>
      </div>
    );
  }

  return <PollDetailsDisplay pollId={pollId} isDashboardView={true} />;
}