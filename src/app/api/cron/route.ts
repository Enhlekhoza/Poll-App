import { db } from '@/lib/prisma';
import { sendPollClosingEmail } from '@/lib/email/resend';
import { NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    // --- Email reminder for polls closing in 24 hours (existing logic) ---
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

    const upcomingPolls = await db.poll.findMany({
      where: {
        dueDate: {
          lte: twentyFourHoursFromNow,
          gt: new Date(),
        },
      },
      include: {
        author: true,
      },
    });

    for (const poll of upcomingPolls) {
      if (poll.author) {
        await sendPollClosingEmail(poll.author.email, poll.title, poll.id);
      }
    }

    // --- In-app notification for polls that have just ended ---
    const endedPolls = await db.poll.findMany({
      where: {
        dueDate: {
          lte: new Date(),
        },
        notificationSent: false,
      },
      include: {
        author: true,
      },
    });

    for (const poll of endedPolls) {
      if (poll.author) {
        await db.notification.create({
          data: {
            recipientId: poll.authorId,
            pollId: poll.id,
            message: `Your poll "${poll.title}" has ended. Check out the results!`,
          },
        });
      }
    }

    // Mark ended polls as notified
    if (endedPolls.length > 0) {
      await db.poll.updateMany({
        where: {
          id: {
            in: endedPolls.map(p => p.id),
          },
        },
        data: {
          notificationSent: true,
        },
      });
    }

    return NextResponse.json({ success: true, notified: endedPolls.length });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false, error: 'Failed to run cron job' });
  }
}
