'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth'; // We will create this file later

// Schema for poll creation validation
const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
  due_date: z.string().optional(),
});

// Schema for poll update validation
const updatePollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
  optionIds: z.array(z.string().cuid().optional()).optional(), // Option IDs are optional for new options
  due_date: z.string().optional(),
});

export async function getUserPolls(limit: number = 10, offset: number = 0) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { polls: [], error: 'User not authenticated' };
    }

    const polls = await prisma.poll.findMany({
      where: { authorId: session.user.id },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalPolls = await prisma.poll.count({
      where: { authorId: session.user.id },
    });

    return { polls, hasMore: totalPolls > offset + limit, error: null };
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return { polls: [], hasMore: false, error: 'Failed to fetch polls' };
  }
}

export async function createPoll(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const validatedFields = createPollSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      options: formData.getAll('options'),
      due_date: formData.get('due_date'),
    });

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.flatten().fieldErrors };
    }

    const { title, description, options, due_date } = validatedFields.data;

    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        authorId: session.user.id,
        dueDate: due_date ? new Date(due_date) : null,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, poll };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, error: 'Failed to create poll' };
  }
}

export async function deletePoll(pollId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    await prisma.poll.delete({
      where: { id: pollId, authorId: session.user.id },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete poll' };
  }
}

export async function getAllPolls() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { polls, error: null };
  } catch (error) {
    return { polls: [], error: 'Failed to fetch polls' };
  }
}

export async function votePoll(pollId: string, optionId: string) {
  try {
    const session = await auth();
    let voterIdentifier: { userId?: string; anonymousId?: string } = {};

    if (session?.user?.id) {
      voterIdentifier.userId = session.user.id;
    } else {
      const anonymousId = cookies().get('anonymous_id')?.value || uuidv4();
      cookies().set('anonymous_id', anonymousId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 });
      voterIdentifier.anonymousId = anonymousId;
    }

    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        ...voterIdentifier,
      },
    });

    revalidatePath(`/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error voting on poll:', error);
    return { success: false, error: 'Failed to vote on poll' };
  }
}

export async function getPollById(pollId: string) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { include: { _count: { select: { votes: true } } } } },
    });
    return { poll, error: null };
  } catch (error) {
    return { poll: null, error: 'Failed to fetch poll' };
  }
}

export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const validatedFields = updatePollSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      options: formData.getAll('options'),
      optionIds: formData.getAll('optionIds'),
      due_date: formData.get('due_date'),
    });

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.flatten().fieldErrors };
    }

    const { title, description, options, optionIds, due_date } = validatedFields.data;

    await prisma.poll.update({
      where: { id: pollId, authorId: session.user.id },
      data: {
        title,
        description,
        dueDate: due_date ? new Date(due_date) : null,
      },
    });

    // Handle options
    // This is a simplified implementation. A more robust implementation would handle updating, creating, and deleting options.
    // For now, we'll just delete all existing options and create new ones.
    await prisma.option.deleteMany({ where: { pollId } });
    await prisma.option.createMany({
      data: options.map((text) => ({ text, pollId })),
    });


    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating poll:', error);
    return { success: false, error: 'Failed to update poll' };
  }
}

export async function getAppStats() {
  try {
    const [pollCount, voteCount, userCount] = await Promise.all([
      prisma.poll.count(),
      prisma.vote.count(),
      prisma.user.count(),
    ]);
    return { success: true, stats: { polls: pollCount, votes: voteCount, users: userCount } };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return { success: false, error: 'Failed to fetch app statistics' };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    return { users, error: null };
  } catch (error) {
    return { users: [], error: 'Failed to fetch users' };
  }
}

export async function addComment(pollId: string, text: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'User not authenticated' };
    }

    await prisma.comment.create({
      data: {
        text,
        pollId,
        authorId: session.user.id,
      },
    });

    revalidatePath(`/polls/${pollId}`);
    return { error: null };
  } catch (error) {
    return { error: 'Failed to add comment' };
  }
}

export async function getComments(pollId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { pollId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
    return { comments, error: null };
  } catch (error) {
    return { comments: [], error: 'Failed to fetch comments' };
  }
}
