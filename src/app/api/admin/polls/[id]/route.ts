import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Function to check if the user is an admin
async function isAdmin(session: any) {
  if (!session?.user?.id) return false;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!await isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pollId = params.id;

  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    // Prisma requires cascading deletes to be handled transactionally
    // to ensure data integrity. We need to delete votes and comments first.
    await db.$transaction([
      db.vote.deleteMany({ where: { pollId } }),
      db.comment.deleteMany({ where: { pollId } }),
      db.option.deleteMany({ where: { pollId } }),
      db.poll.delete({ where: { id: pollId } }),
    ]);

    return NextResponse.json({ message: 'Poll deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete poll ${pollId}:`, error);
    // Check for specific Prisma error if the record is not found
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
  }
}