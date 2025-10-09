import { NextApiRequest, NextApiResponse } from "next"
import { db } from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pollId } = req.query
  if (!pollId || typeof pollId !== "string") return res.status(400).json({ error: "Poll ID is required" })

  try {
    const comments = await db.comment.findMany({
      where: { pollId },
      include: { author: { select: { email: true, id: true } } },
      orderBy: { createdAt: "desc" },
    })
    res.status(200).json({ comments })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch comments" })
  }
}