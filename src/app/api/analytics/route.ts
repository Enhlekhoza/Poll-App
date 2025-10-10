import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  try {
    const userId = session.user.id;

    const totalPolls = await db.poll.count({
      where: { authorId: userId },
    });

    const totalVotes = await db.vote.count({
      where: {
        poll: {
          authorId: userId,
        },
      },
    });

    const polls = await db.poll.findMany({
      where: { authorId: userId },
      include: {
        _count: {
          select: { votes: true, comments: true },
        },
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    const mostVotedPoll = polls.reduce((prev, current) => (prev._count.votes > current._count.votes) ? prev : current, polls[0]);

    const engagementRate = totalPolls > 0 ? (totalVotes / totalPolls) : 0;

    const analyticsData = {
      totalPolls,
      totalVotes,
      engagementRate,
      mostVotedPoll: {
        id: mostVotedPoll.id,
        title: mostVotedPoll.title,
        votes: mostVotedPoll._count.votes,
      },
      polls: polls.map(p => ({
        id: p.id,
        title: p.title,
        votes: p._count.votes,
        comments: p._count.comments,
        options: p.options.map(o => ({
            text: o.text,
            votes: o._count.votes
        }))
      }))
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
