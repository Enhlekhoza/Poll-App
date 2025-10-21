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
  tags: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

const updatePollSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2),
  optionIds: z.array(z.string().cuid().optional()).optional(),
  due_date: z.string().optional(),
  tags: z.string().optional(),
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
    const term = (search || '').trim();
    // For cross-db reliability (e.g., SQLite), perform case-insensitive filtering in memory when a term is provided
    if (term) {
      const all = await db.poll.findMany({
        where: { authorId: userId },
        include: { options: { include: { _count: { select: { votes: true } } } }, author: true },
        orderBy: { createdAt: 'desc' },
      });
      const lc = term.toLowerCase();
      const filtered = all.filter(p => {
        const inTitle = p.title?.toLowerCase().includes(lc);
        const inDesc = (p.description || '').toLowerCase().includes(lc);
        const inOptions = p.options?.some(o => o.text?.toLowerCase().includes(lc));
        return inTitle || inDesc || inOptions;
      });
      const sliced = filtered.slice(offset, offset + limit);
      return { polls: sliced as any, hasMore: filtered.length > offset + limit, error: null };
    }

    // No search term: use DB pagination directly
    const [polls, totalPolls] = await Promise.all([
      db.poll.findMany({
        where: { authorId: userId },
        include: { options: { include: { _count: { select: { votes: true } } } }, author: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.poll.count({ where: { authorId: userId } }),
    ]);
    return { polls, hasMore: totalPolls > offset + limit, error: null };
  } catch (error: any) {
    return { polls: [], hasMore: false, error: error.message || 'Failed to fetch polls' };
  }
}

// ==================== CREATE POLL ====================
export async function createPoll(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Freemium Limitation Check
    if (session?.user?.plan === "FREE") {
      const visibility = formData.get('visibility');
      if (visibility === 'PRIVATE') {
        const privatePollsCount = await db.poll.count({
          where: {
            authorId: userId,
            visibility: 'PRIVATE',
          },
        });
        if (privatePollsCount >= 3) {
          return { success: false, error: 'You can only create up to 3 private polls on the free plan. Please upgrade for unlimited private polls.' };
        }
      }
    }

    const dueRaw = formData.get('due_date');
    const descRaw = formData.get('description');
    const tagsRaw = formData.get('tags');
    const visibilityRaw = formData.get('visibility');

    const validated = createPollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' ? descRaw : undefined,
      options: formData.getAll('options'),
      due_date: typeof dueRaw === 'string' ? dueRaw : undefined,
      tags: typeof tagsRaw === 'string' ? tagsRaw : undefined,
      visibility: visibilityRaw,
    });

    if (!validated.success) {
      const errors = validated.error.flatten();
      const allErrors = [
        ...Object.entries(errors.fieldErrors).flatMap(([f, m]) => (m || []).map(msg => `${f}: ${msg}`)),
        ...(errors.formErrors || []),
      ];
      return { success: false, error: allErrors.join(', ') };
    }

    const { title, description, options, due_date, tags, visibility } = validated.data;

    const tagOperations = tags
      ? tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => {
          return db.tag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag },
          });
        })
      : [];

    const createdTags = await db.$transaction(tagOperations);

    const poll = await db.poll.create({
      data: {
        title,
        description: description ?? null,
        authorId: userId,
        dueDate: due_date ? new Date(due_date) : null,
        visibility,
        options: { create: options.map(text => ({ text })) },
        tags: {
          create: createdTags.map(tag => ({
            tag: { connect: { id: tag.id } },
          })),
        },
      },
      include: { options: true, tags: { include: { tag: true } } },
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
    const tagsRaw = formData.get('tags');

    const validated = updatePollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' ? descRaw : undefined,
      options: formData.getAll('options'),
      optionIds: formData.getAll('optionIds'),
      due_date: typeof dueRaw === 'string' ? dueRaw : undefined,
      tags: typeof tagsRaw === 'string' ? tagsRaw : undefined,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.flatten().fieldErrors };
    }

    const poll = await db.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.authorId !== userId) return { success: false, error: 'Not authorized' };

    const { title, description, due_date, tags } = validated.data;

    const tagOperations = tags
      ? tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => {
          return db.tag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag },
          });
        })
      : [];

    const createdTags = await db.$transaction(tagOperations);

    await db.poll.update({
      where: { id: pollId },
      data: {
        title,
        description: description ?? null,
        dueDate: due_date ? new Date(due_date) : null,
        tags: {
          deleteMany: {},
          create: createdTags.map(tag => ({
            tag: { connect: { id: tag.id } },
          })),
        },
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

    // Check if the poll is past its due date
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      select: { dueDate: true },
    });

    if (poll?.dueDate && new Date(poll.dueDate) < new Date()) {
      return { success: false, error: 'This poll has already closed.' };
    }

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
    const session = await getServerSession(authOptions) as Session | null;
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { author: true },
    });
    if (!poll) throw new Error('Poll not found');

    await db.comment.create({ data: { text, pollId, authorId: userId } });

    // Create notification for poll author
    if (poll.authorId !== userId) {
      await db.notification.create({
        data: {
          recipientId: poll.authorId,
          pollId: pollId,
          message: `${session?.user?.name || 'Someone'} commented on your poll: "${poll.title}"`,
        },
      });
    }

    // Notify admins via Resend
    if (process.env.RESEND_API_KEY) {
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