'use server';

import { createClient } from '@/lib/supabase/server';

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

    if (!title || !options || options.length < 2) {
      return { success: false, error: 'Title and at least 2 options are required' };
    }

    const { data: poll, error } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        options,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, poll };
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
