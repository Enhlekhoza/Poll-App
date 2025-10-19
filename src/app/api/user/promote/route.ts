import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id;

    // Check the user's current role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If the user is already a CREATOR or higher, do nothing
    if (user.role === 'CREATOR' || user.role === 'PREMIUM_CREATOR' || user.role === 'ADMIN') {
      return NextResponse.json({ message: 'User already has creator privileges' });
    }

    // Upgrade the user's role to CREATOR
    await db.user.update({
      where: { id: userId },
      data: { role: 'CREATOR' },
    });

    return NextResponse.json({ message: 'User role upgraded to CREATOR' });
  } catch (error) {
    console.error('Failed to upgrade user role:', error);
    return NextResponse.json({ error: 'Failed to upgrade user role' }, { status: 500 });
  }
}