import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const count = await db.poll.count({
      where: {
        authorId: session.user.id,
        visibility: "PRIVATE",
      },
    })
    return NextResponse.json({ count })
  } catch (error) {
    console.error("Failed to fetch private poll count:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
