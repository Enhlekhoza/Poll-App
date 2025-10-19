import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get('public') === 'true';
  const tag = searchParams.get('tag');

  // Fetching public polls does not require authentication
  if (isPublic) {
    try {
      const whereClause: any = { visibility: 'PUBLIC' };
      if (tag) {
        whereClause.tags = {
          some: {
            tag: {
              name: {
                equals: tag,
                mode: 'insensitive',
              },
            },
          },
        };
      }

      const polls = await db.poll.findMany({
        where: whereClause,
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
          createdAt: 'desc',
        }
      });
      return NextResponse.json(polls);
    } catch (error) {
      console.error('Failed to fetch public polls:', error);
      return NextResponse.json({ error: 'Failed to fetch public polls' }, { status: 500 });
    }
  }

  // Existing logic for fetching user-specific polls
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id;

    const polls = await db.poll.findMany({
      where: { authorId: userId },
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
        createdAt: 'desc',
      }
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error('Failed to fetch polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}
