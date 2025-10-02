'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import auth from '@/lib/auth';

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
    const session = await auth();
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
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'User not authenticated' };

    const validatedFields = createPollSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      options: formData.getAll('options'),
      due_date: formData.get('due_date'),
    });

    if (!validatedFields.success) {
      const errorMessages = Object.values(validatedFields.error.flatten().fieldErrors).join(', ');
      return { success: false, error: errorMessages };
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
    const session = await auth();
    const cookieStore = cookies();
    let voterIdentifier: { userId?: string; anonymousId?: string } = {};

    if (session?.user?.id) voterIdentifier.userId = session.user.id;
    else {
      const anonymousId = cookieStore.get('anonymous_id')?.value || uuidv4();
      cookieStore.set('anonymous_id', anonymousId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60*60*24*365 });
      voterIdentifier.anonymousId = anonymousId;
    }

    await db.vote.create({ data: { pollId, optionId, ...voterIdentifier } });
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
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'User not authenticated' };

    const validatedFields = updatePollSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      options: formData.getAll('options'),
      optionIds: formData.getAll('optionIds'),
      due_date: formData.get('due_date'),
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
    const session = await auth();
    if (!session?.user?.id) return { error: 'User not authenticated' };

    await db.comment.create({ data: { text, pollId, authorId: session.user.id } });
    revalidatePath(`/dashboard/polls/${pollId}`);
    return { error: null };
  } catch (error) {
    return { error: 'Failed to add comment' };
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