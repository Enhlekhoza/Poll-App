'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Schema for poll creation validation
const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
});

// Schema for poll update validation
const updatePollSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'At least two options are required.'),
  optionIds: z.array(z.string().uuid().optional()).optional(), // Option IDs are optional for new options
});

export async function getUserPolls(limit: number = 10, offset: number = 0) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { polls: [], error: 'User not authenticated' };
    }

    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1); // Supabase range is inclusive

    if (error) {
      return { polls: [], error: error.message };
    }

    // Check if there are more polls than the current limit to determine hasMore
    const { count } = await supabase
      .from('polls')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const hasMore = (count || 0) > (offset + limit);

    return { polls: polls || [], hasMore, error: null };
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return { polls: [], hasMore: false, error: 'Failed to fetch polls' };
  }
}

export async function createPoll(formData: FormData) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Extract data from FormData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | undefined;
    const options = formData.getAll('options') as string[];

    // Validate data using Zod schema
    const validatedFields = createPollSchema.safeParse({
      title,
      description,
      options,
    });

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.flatten().fieldErrors };
    }

    const { title: validatedTitle, description: validatedDescription, options: validatedOptions } = validatedFields.data;

    // Step 1: Insert the poll into the 'polls' table and get its ID
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedTitle,
        description: validatedDescription || null,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (pollError) {
      return { success: false, error: pollError.message };
    }
    if (!pollData) {
      return { success: false, error: 'Failed to create poll and retrieve its ID.' };
    }

    // Step 2: Prepare and insert the poll options
    const optionsToInsert = validatedOptions.map((option) => ({
      text: option,
      poll_id: pollData.id,
    }));

    const { error: optionsError } = await supabase.from('poll_options').insert(optionsToInsert);

    if (optionsError) {
      // If options fail to insert, delete the poll to avoid orphaned data.
      await supabase.from('polls').delete().match({ id: pollData.id });
      return { success: false, error: optionsError.message };
    }

    revalidatePath('/dashboard');
    return { success: true, poll: pollData };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, error: 'Failed to create poll' };
  }
}

export async function deletePoll(pollId: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete poll' };
  }
}

export async function getAllPolls() {
  try {
    const supabase = await createClient();

    const { data: polls, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { polls: [], error: error.message };
    }

    return { polls: polls || [], error: null };
  } catch (error) {
    return { polls: [], error: 'Failed to fetch polls' };
  }
}

export async function votePoll(pollId: string, optionId: string) {
  try {
    const supabase = await createClient();
    const cookieStore = cookies();

    const { data: { user } } = await supabase.auth.getUser();

    let voterIdentifier: string | null = null;

    if (user) {
      // Authenticated user
      voterIdentifier = user.id;
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        return { success: false, error: 'You have already voted on this poll.' };
      }
    } else {
      // Anonymous user
      let anonymousId = cookieStore.get('anonymous_id')?.value;
      if (!anonymousId) {
        anonymousId = uuidv4();
        cookieStore.set('anonymous_id', anonymousId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 }); // 1 year
      }
      voterIdentifier = anonymousId;

      const { data: existingAnonymousVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('anonymous_id', anonymousId)
        .single();

      if (existingAnonymousVote) {
        return { success: false, error: 'You have already voted on this poll.' };
      }
    }

    // Increment vote count in poll_options table
    const { error: incrementError } = await supabase.rpc('increment_vote', { option_id: optionId });

    if (incrementError) {
      return { success: false, error: incrementError.message };
    }

    // Insert vote record to votes table
    const { error: voteError } = await supabase.from('votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user ? user.id : null,
      anonymous_id: user ? null : voterIdentifier, // Store anonymous ID if not logged in
    });

    if (voteError) {
      return { success: false, error: voteError.message };
    }

    revalidatePath(`/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error voting on poll:', error);
    return { success: false, error: 'Failed to vote on poll' };
  }
}

export async function getPollById(pollId: string) {
  try {
    const supabase = await createClient();

    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .eq('id', pollId)
      .single();

    if (error) {
      return { poll: null, error: error.message };
    }

    return { poll, error: null };
  } catch (error) {
    return { poll: null, error: 'Failed to fetch poll' };
  }
}

export async function updatePoll(pollId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Extract data from FormData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | undefined;
    const options = formData.getAll('options') as string[];
    const optionIds = formData.getAll('optionIds') as string[]; // Existing option IDs

    // Validate data using Zod schema
    const validatedFields = updatePollSchema.safeParse({
      title,
      description,
      options,
      optionIds: optionIds.length > 0 ? optionIds : undefined, // Pass optionIds only if present
    });

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.flatten().fieldErrors };
    }

    const { title: validatedTitle, description: validatedDescription, options: validatedOptions, optionIds: validatedOptionIds } = validatedFields.data;

    // Update poll details
    const { error: pollError } = await supabase
      .from('polls')
      .update({ title: validatedTitle, description: validatedDescription || null })
      .eq('id', pollId)
      .eq('user_id', user.id);

    if (pollError) {
      return { success: false, error: pollError.message };
    }

    // Handle options: update existing, add new, delete removed
    const existingOptions = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId);

    const currentExistingOptionIds = existingOptions.data?.map(opt => opt.id) || [];

    // Options to delete (not in new options)
    const optionsToDelete = currentExistingOptionIds.filter(id => !validatedOptionIds?.includes(id));
    if (optionsToDelete.length > 0) {
      await supabase.from('poll_options').delete().in('id', optionsToDelete);
    }

    // Options to update/insert
    for (let i = 0; i < validatedOptions.length; i++) {
      const optionText = validatedOptions[i];
      const optionId = validatedOptionIds?.[i];

      if (optionId && currentExistingOptionIds.includes(optionId)) {
        // Update existing option
        await supabase.from('poll_options').update({ text: optionText }).eq('id', optionId);
      } else {
        // Insert new option
        await supabase.from('poll_options').insert({ poll_id: pollId, text: optionText, votes: 0 });
      }
    }

    revalidatePath(`/dashboard/polls/${pollId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating poll:', error);
    return { success: false, error: 'Failed to update poll' };
  }
}

export async function getAppStats() {
  try {
    const supabase = await createClient(true); // Pass true to use service role key

    // Count total polls
    const { count: pollCount, error: pollCountError } = await supabase
      .from('polls')
      .select('id', { count: 'exact' });

    if (pollCountError) throw pollCountError;

    // Count total votes
    const { count: voteCount, error: voteCountError } = await supabase
      .from('votes')
      .select('id', { count: 'exact' });

    if (voteCountError) throw voteCountError;

    // Count total unique users (from auth.users table)
    const { data: usersData, error: userCountError } = await supabase.auth.admin.listUsers();

    if (userCountError) throw userCountError;

    return { 
      success: true, 
      stats: {
        polls: pollCount || 0,
        votes: voteCount || 0,
        users: usersData?.users.length || 0, // listUsers returns an object with a users array
      }
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return { success: false, error: 'Failed to fetch app statistics' };
  }
}
