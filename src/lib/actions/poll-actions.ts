'use server';

import { createClient } from '@supabase/supabase-js';

import { revalidatePath } from 'next/cache';

export async function getUserPolls() {
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
      .order('created_at', { ascending: false });

    if (error) {
      return { polls: [], error: error.message };
    }

    return { polls: polls || [], error: null };
  } catch (error) {
    return { polls: [], error: 'Failed to fetch polls' };
  }
}

export async function createPoll(formData: FormData) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const options = formData.getAll('options') as string[];

    if (!title || !options || options.length < 4) {
      return { success: false, error: 'Title and at least 4 options are required' };
    }

    // Step 1: Insert the poll into the 'polls' table and get its ID
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
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
    const optionsToInsert = options.map((option) => ({
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

    // Check if user has already voted (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        return { success: false, error: 'User has already voted on this poll' };
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
    });

    if (voteError) {
      return { success: false, error: voteError.message };
    }

    revalidatePath(`/polls/${pollId}`);
    return { success: true };
  } catch (error) {
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
