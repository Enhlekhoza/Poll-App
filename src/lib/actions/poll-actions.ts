'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schemas
const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
  due_date: z.string().optional(),
});

const updatePollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
  optionIds: z.array(z.string().cuid().optional()).optional(),
  due_date: z.string().optional(),
});

// Get user polls
export async function getUserPolls(limit: number = 10, offset: number = 0) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { polls: [], error: 'User not authenticated' };

    const polls = await db.poll.findMany({
      where: { authorId: session.user.id },
      include: { 
        options: { include: { _count: { select: { votes: true } } } }, 
        author: true 
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalPolls = await db.poll.count({ where: { authorId: session.user.id } });

    return { polls, hasMore: totalPolls > offset + limit, error: null };
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return { polls: [], hasMore: false, error: 'Failed to fetch polls' };
  }
}

// Create poll
export async function createPoll(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'User not authenticated' };

    const dueRaw = formData.get('due_date');
    const descRaw = formData.get('description');
    const validatedFields = createPollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' && descRaw.length > 0 ? descRaw : undefined,
      options: formData.getAll('options'),
      due_date: typeof dueRaw === 'string' && dueRaw.length > 0 ? dueRaw : undefined,
    });

    if (!validatedFields.success) {
      const flat = validatedFields.error.flatten();
      const fieldErrors = Object.entries(flat.fieldErrors)
        .flatMap(([field, messages]) => (messages || []).map(msg => `${field}: ${msg}`));
      const formErrors = flat.formErrors || [];
      const errorMessages = [...fieldErrors, ...formErrors].join(', ');
      return { success: false, error: errorMessages || 'Invalid input' };
    }

    const { title, description, options, due_date } = validatedFields.data;

    const poll = await db.poll.create({
      data: {
        title,
        description,
        authorId: session.user.id,
        dueDate: due_date ? new Date(due_date) : null,
        options: { create: options.map(text => ({ text })) },
      },
    });

    revalidatePath('/dashboard/polls');
    return { success: true, poll };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, error: 'Failed to create poll' };
  }
}

// Vote poll
export async function votePoll(pollId: string, optionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to vote' };
    }

    await db.vote.create({ data: { pollId, optionId, userId: session.user.id } });
    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error voting on poll:', error);
    return { success: false, error: 'Failed to vote on poll' };
  }
}

// Get poll by ID
export async function getPollById(pollId: string) {
  try {
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { author: true, options: { include: { _count: { select: { votes: true } } } } },
    });
    return { poll, error: null };
  } catch (error) {
    return { poll: null, error: 'Failed to fetch poll' };
  }
}

// Update poll
export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'User not authenticated' };

    const dueRaw = formData.get('due_date');
    const descRaw = formData.get('description');
    const validatedFields = updatePollSchema.safeParse({
      title: formData.get('title'),
      description: typeof descRaw === 'string' && descRaw.length > 0 ? descRaw : undefined,
      options: formData.getAll('options'),
      optionIds: formData.getAll('optionIds'),
      due_date: typeof dueRaw === 'string' && dueRaw.length > 0 ? dueRaw : undefined,
    });

    if (!validatedFields.success) return { success: false, error: validatedFields.error.flatten().fieldErrors };

    const { title, description, options, optionIds, due_date } = validatedFields.data;

    await db.poll.update({
      where: { id: pollId, authorId: session.user.id },
      data: { title, description, dueDate: due_date ? new Date(due_date) : null },
    });

    // Replace options
    await db.option.deleteMany({ where: { pollId } });
    await db.option.createMany({ data: options.map(text => ({ text, pollId })) });

    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating poll:', error);
    return { success: false, error: 'Failed to update poll' };
  }
}

// Add comment
export async function addComment(pollId: string, text: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'User not authenticated' };

    const comment = await db.comment.create({ data: { text, pollId, authorId: session.user.id } });
    // Notify admins by email
    try {
      const admins = await db.user.findMany({ where: { role: 'admin' }, select: { email: true } });
      if (admins.length > 0) {
        const poll = await db.poll.findUnique({ where: { id: pollId }, select: { title: true } });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await Promise.all(
          admins.map(a =>
            resend.emails.send({
              from: 'no-reply@poll-app.local',
              to: a.email,
              subject: `New comment on: ${poll?.title || 'a poll'}`,
              html: `<p>A new comment was added: "${text}"</p><p>View: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/polls/${pollId}">Open poll</a></p>`,
            })
          )
        );
      }
    } catch (e) {
      console.error('Error sending admin notifications:', e);
    }
    revalidatePath(`/dashboard/polls/${pollId}`);
    return { error: null };
  } catch (error) {
    return { error: 'Failed to add comment' };
  }
}

// Get comments for a poll
export async function getComments(pollId: string) {
  try {
    const comments = await db.comment.findMany({
      where: { pollId },
      include: { author: { select: { email: true, id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { comments, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { comments: [], error: 'Failed to fetch comments' };
  }
}

// Delete poll
export async function deletePoll(pollId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'User not authenticated' };

    // Ensure the poll belongs to the user
    const poll = await db.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.authorId !== session.user.id) {
      return { success: false, error: 'Not authorized to delete this poll' };
    }

    // Cascade deletes: votes -> options -> poll (votes have FKs to options/poll)
    await db.vote.deleteMany({ where: { pollId } });
    await db.option.deleteMany({ where: { pollId } });
    await db.comment.deleteMany({ where: { pollId } });
    await db.poll.delete({ where: { id: pollId } });

    revalidatePath('/dashboard/polls');
    return { success: true };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { success: false, error: 'Failed to delete poll' };
  }
}

// Get app stats (for homepage)
export async function getAppStats() {
  try {
    const [pollCount, voteCount, userCount] = await Promise.all([
      db.poll.count(),
      db.vote.count(),
      db.user.count(),
    ]);
    return { success: true, stats: { polls: pollCount, votes: voteCount, users: userCount } };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return { success: false, stats: null, error: 'Failed to fetch app statistics' };
  }
}