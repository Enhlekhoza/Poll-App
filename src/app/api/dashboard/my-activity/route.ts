import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id;

    // Find polls the user has voted on or commented on
    const polls = await db.poll.findMany({
      where: {
        OR: [
          {
            votes: {
              some: {
                userId: userId,
              },
            },
          },
          {
            comments: {
              some: {
                authorId: userId,
              },
            },
          },
        ],
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true, comments: true },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Order by most recent interaction
      },
      take: 10, // Limit to the 10 most recent activities
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}