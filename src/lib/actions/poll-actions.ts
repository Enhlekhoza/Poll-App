'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';
import { Session } from 'next-auth';
import { Poll } from '@/types';

// ==================== SCHEMAS ====================
const createPollSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2),
  due_date: z.string().optional(),
});

const updatePollSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2),
  optionIds: z.array(z.string().cuid().optional()).optional(),
  due_date: z.string().optional(),
});

// ==================== HELPERS ====================
async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.id) throw new Error('User not authenticated');
  return session.user.id;
}

// ==================== USER POLLS ====================
export async function getUserPolls(limit = 10, offset = 0, search?: string) {
  try {
    const userId = await getUserId();
    
    const whereClause = {
      authorId: userId,
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { options: { some: { text: { contains: search, mode: 'insensitive' } } } }
        ]
      } : {})
    };
    
    const [polls, totalPolls] = await Promise.all([
      db.poll.findMany({
        where: whereClause,
        include: { options: { include: { _count: { select: { votes: true } } } }, author: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.poll.count({ where: whereClause }),
    ]);
    return { polls, hasMore: totalPolls > offset + limit, error: null };
  } catch (error: any) {
    return { polls: [], hasMore: false, error: error.message || 'Failed to fetch polls' };
  }
}

// ==================== CREATE POLL ====================
export async function createPoll(formData: FormData) {
  try {
    const userId = await getUserId();
    const dueRaw = formData.get('due_date');
    const descRaw = formData.get('description');

    const validated = createPollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' ? descRaw : undefined,
      options: formData.getAll('options'),
      due_date: typeof dueRaw === 'string' ? dueRaw : undefined,
    });

    if (!validated.success) {
      const errors = validated.error.flatten();
      const allErrors = [
        ...Object.entries(errors.fieldErrors).flatMap(([f, m]) => (m || []).map(msg => `${f}: ${msg}`)),
        ...(errors.formErrors || []),
      ];
      return { success: false, error: allErrors.join(', ') };
    }

    const { title, description, options, due_date } = validated.data;

    const poll = await db.poll.create({
      data: {
        title,
        description: description ?? null,
        authorId: userId,
        dueDate: due_date ? new Date(due_date) : null,
        options: { create: options.map(text => ({ text })) },
      },
      include: { options: true },
    });

    revalidatePath('/dashboard/polls');
    return { success: true, poll };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create poll' };
  }
}

// ==================== UPDATE POLL ====================
export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const userId = await getUserId();

    const dueRaw = formData.get('due_date');
    const descRaw = formData.get('description');

    const validated = updatePollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' ? descRaw : undefined,
      options: formData.getAll('options'),
      optionIds: formData.getAll('optionIds'),
      due_date: typeof dueRaw === 'string' ? dueRaw : undefined,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.flatten().fieldErrors };
    }

    const poll = await db.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.authorId !== userId) return { success: false, error: 'Not authorized' };

    await db.poll.update({
      where: { id: pollId },
      data: {
        title: validated.data.title,
        description: validated.data.description ?? null,
        dueDate: validated.data.due_date ? new Date(validated.data.due_date) : null,
      },
    });

    // Delete old options and recreate
    await db.option.deleteMany({ where: { pollId } });
    await db.option.createMany({
      data: validated.data.options.map((text) => ({ text, pollId })),
    });

    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update poll' };
  }
}

// ==================== DELETE POLL ====================
export async function deletePoll(pollId: string) {
  try {
    const userId = await getUserId();
    const poll = await db.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.authorId !== userId) return { success: false, error: 'Not authorized' };

    await db.$transaction([
      db.vote.deleteMany({ where: { pollId } }),
      db.option.deleteMany({ where: { pollId } }),
      db.comment.deleteMany({ where: { pollId } }),
      db.poll.delete({ where: { id: pollId } }),
    ]);

    revalidatePath('/dashboard/polls');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete poll' };
  }
}

// ==================== VOTE ====================
export async function votePoll(pollId: string, optionId: string) {
  try {
    const userId = await getUserId();
    const existingVote = await db.vote.findFirst({ where: { pollId, userId } });
    if (existingVote) return { success: false, error: 'Already voted' };

    await db.vote.create({ data: { pollId, optionId, userId } });
    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to vote' };
  }
}

// ==================== COMMENTS ====================
export async function addComment(pollId: string, text: string) {
  try {
    const userId = await getUserId();
    await db.comment.create({ data: { text, pollId, authorId: userId } });

    // Notify admins via Resend
    if (process.env.RESEND_API_KEY) {
      const poll = await db.poll.findUnique({ where: { id: pollId }, select: { title: true } });
      const admins = await db.user.findMany({ where: { role: 'admin' }, select: { email: true } });
      const resend = new Resend(process.env.RESEND_API_KEY);

      await Promise.all(
        admins.map(a =>
          resend.emails.send({
            from: 'no-reply@poll-app.local',
            to: a.email,
            subject: `New comment on: ${poll?.title || 'a poll'}`,
            html: `<p>Comment: "${text}"</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/polls/${pollId}">View poll</a></p>`,
          })
        )
      );
    }

    revalidatePath(`/dashboard/polls/${pollId}`);
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to add comment' };
  }
}

// ==================== GET POLL BY ID ====================
export async function getPollById(pollId: string) {
  try {
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: { votes: true, comments: true }
        }
      }
    });

    if (!poll) {
      return { poll: null, error: 'Poll not found' };
    }

    return { poll, error: null };
  } catch (error: any) {
    return { poll: null, error: error.message || 'Failed to fetch poll' };
  }
}

// ==================== ADMIN / STATS ====================
export async function getAllUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, createdAt: true },
    });
    return { users, error: null };
  } catch (error: any) {
    return { users: [], error: error.message || 'Failed to fetch users' };
  }
}

export async function getAppStats() {
  try {
    const [pollCount, voteCount, userCount] = await Promise.all([db.poll.count(), db.vote.count(), db.user.count()]);
    return { success: true, stats: { polls: pollCount, votes: voteCount, users: userCount } };
  } catch (error: any) {
    return { success: false, stats: null, error: error.message || 'Failed to fetch stats' };
  }
}