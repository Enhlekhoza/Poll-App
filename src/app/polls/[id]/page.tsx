'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';

// Mock data for a single poll
const mockPoll = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'What programming language do you prefer to use?',
  options: [
    { id: '1', text: 'JavaScript', votes: 15 },
    { id: '2', text: 'Python', votes: 12 },
    { id: '3', text: 'Java', votes: 8 },
    { id: '4', text: 'C#', votes: 5 },
    { id: '5', text: 'Go', votes: 2 },
  ],
  totalVotes: 42,
  createdAt: '2023-10-15',
  createdBy: 'Anonymous',
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real app, you would fetch the poll data based on the ID
  const poll = mockPoll;
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  const handleVote = async () => {
    if (!selectedOption) {
      setError('Please select an option before voting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failure for demo
          if (Math.random() > 0.9) {
            reject(new Error('Network error'));
          } else {
            resolve(true);
          }
        }, 1500);
      });

      // Update mock data (in real app, this would be server-side)
      const updatedOptions = poll.options.map(option =>
        option.id === selectedOption
          ? { ...option, votes: option.votes + 1 }
          : option
      );

      poll.options = updatedOptions;
      poll.totalVotes += 1;

      setHasVoted(true);
      setShowThankYou(true);

      // Hide thank you after 2 seconds and show results
      setTimeout(() => {
        setShowThankYou(false);
      }, 2000);

    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="flex items-center gap-2 text-blue-600 hover:underline">
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
                disabled={!selectedOption || isSubmitting}
                className="mt-4 w-full"
                size="lg"
              >
                {isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}
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
          <span>Created by {poll.createdBy}</span>
          <span>Created on {new Date(poll.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      {hasVoted && !showThankYou && (
        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Vote Again (Demo)
          </Button>
        </div>
      )}
    </div>
  );
}
