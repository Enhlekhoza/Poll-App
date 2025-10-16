import { db } from '@/lib/prisma';
import { sendPollClosingEmail } from '@/lib/email/resend';
import { NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

    const polls = await db.poll.findMany({
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

    for (const poll of polls) {
      if (poll.author) {
        await sendPollClosingEmail(poll.author.email, poll.title, poll.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false, error: 'Failed to run cron job' });
  }
}
