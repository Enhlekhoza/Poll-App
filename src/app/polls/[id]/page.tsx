'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase';
import { votePoll } from '@/lib/actions/poll-actions';
import { Poll, PollOption } from '@/types';
import { toast } from 'sonner';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const { data, error } = await supabase
          .from('polls')
          .select(`
            *,
            options:poll_options(*)
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          setError('Poll not found');
        } else {
          setPoll(data as Poll);
        }
      } catch (err) {
        setError('Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [params.id]);

  const handleVote = async () => {
    if (!selectedOption) {
      setError('Please select an option before voting.');
      return;
    }

    setError(null);

    startTransition(async () => {
      // Optimistic update
      const originalPoll = poll;
      const updatedOptions = poll!.options.map(option =>
        option.id === selectedOption
          ? { ...option, votes: option.votes + 1 }
          : option
      );
      setPoll(prevPoll => ({ ...prevPoll!, options: updatedOptions }));
      setHasVoted(true);

      const result = await votePoll(params.id, selectedOption);

      if (result?.error) {
        setError(result.error);
        toast.error('Failed to submit vote. Please try again.');
        // Revert optimistic update
        setPoll(originalPoll);
        setHasVoted(false);
      } else {
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 2000);
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <div className="text-center">Loading poll...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <div className="text-center text-red-500">{error || 'Poll not found'}</div>
        <Link href="/dashboard/polls" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={16} />
          Back to Polls
        </Link>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/polls" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={16} />
          Back to Polls
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showThankYou ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Thank you for voting!</h3>
              <p className="text-muted-foreground">Your vote has been recorded.</p>
            </div>
          ) : !hasVoted ? (
            <div className="space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                {poll.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      className="mr-3"
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
              <Button
                onClick={handleVote}
                disabled={!selectedOption || isPending}
                className="mt-4 w-full"
                size="lg"
              >
                {isPending ? 'Submitting Vote...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Results:</h3>
              {poll.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{getPercentage(option.votes)}% ({option.votes} votes)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(option.votes)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-500 pt-2 border-t">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.user_id}</span>
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      {hasVoted && !showThankYou && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setHasVoted(false)}>
            Vote Again
          </Button>
        </div>
      )}
    </div>
  );
}