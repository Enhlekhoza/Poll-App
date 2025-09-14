'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/supabase';
import { votePoll } from '@/lib/actions/poll-actions';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
  options: PollOption[];
}

export default function PublicPollPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', id)
          .single();

        if (pollError) {
          setError('Poll not found');
          setLoading(false);
          return;
        }

        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', id);

        if (optionsError) {
          setError('Failed to load poll options');
          setLoading(false);
          return;
        }

        const pollWithOptions = {
          ...pollData,
          options: optionsData || []
        };

        setPoll(pollWithOptions);

        // Check if user has already voted
        if (user) {
          const { data: existingVote } = await supabase
            .from('votes')
            .select('id')
            .eq('poll_id', id)
            .eq('user_id', user.id)
            .single();

          if (existingVote) {
            setHasVoted(true);
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load poll');
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, user]);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsSubmitting(true);

    try {
      const result = await votePoll(poll.id, selectedOption);

      if (result.success) {
        toast.success('Vote submitted successfully!');
        setHasVoted(true);

        // Refresh poll data to show updated results
        const { data: updatedOptions } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll.id);

        if (updatedOptions) {
          setPoll({ ...poll, options: updatedOptions });
        }
      } else {
        toast.error(result.error || 'Failed to submit vote');
      }
    } catch (error) {
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">Loading poll...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center text-red-500">{error || 'Poll not found'}</div>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-lg text-gray-600 mt-2">
                {poll.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {!hasVoted ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Choose your option:</h3>
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedOption === option.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === option.id ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {selectedOption === option.id && (
                            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          )}
                        </div>
                        <span className="text-gray-800 font-medium">{option.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full py-3 text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  size="lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting Vote...
                    </div>
                  ) : (
                    'Submit Vote'
                  )}
                </Button>

                {user && (
                  <p className="text-sm text-gray-500 text-center">
                    You can only vote once per poll.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800 text-center">Results</h3>
                <div className="space-y-4">
                  {poll.options.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{option.text}</span>
                        <span className="text-sm text-gray-600">
                          {getPercentage(option.votes)}% ({option.votes} votes)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${getPercentage(option.votes)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center text-gray-600 pt-4 border-t border-gray-200">
                  <p className="text-lg font-medium">Total votes: {totalVotes}</p>
                  <p className="text-sm mt-1">Thank you for voting!</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="text-sm text-gray-500 flex justify-center border-t border-gray-200 pt-6">
            <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
