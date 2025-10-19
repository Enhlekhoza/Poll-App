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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!await isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = params.id;
  const { role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
  }

  // Validate the role
  const allowedRoles = ["USER", "CREATOR", "PREMIUM_CREATOR", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Failed to update role for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}