import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PollCard } from "@/components/polls/poll-card"

export default async function UserProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    include: {
      polls: {
        where: { visibility: "public" },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.image || ""} alt={user.name || ""} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{user.name}</h1>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Public Polls</h2>
        {user.polls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <p>This user has not created any public polls yet.</p>
        )}
      </div>
    </div>
  )
}