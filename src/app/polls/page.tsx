'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, BarChart3 } from 'lucide-react';

// Mock polls data
const mockPolls = [
  {
    id: '1',
    title: 'Favorite Programming Language',
    description: 'What programming language do you prefer to use?',
    totalVotes: 42,
    createdAt: '2023-10-15',
    createdBy: 'Anonymous',
  },
  {
    id: '2',
    title: 'Best Coffee Type',
    description: 'Which coffee do you enjoy the most?',
    totalVotes: 28,
    createdAt: '2023-10-14',
    createdBy: 'Coffee Lover',
  },
  {
    id: '3',
    title: 'Weekend Activity',
    description: 'What do you like to do on weekends?',
    totalVotes: 35,
    createdAt: '2023-10-13',
    createdBy: 'Weekend Warrior',
  },
];

export default function PollsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Polls</h1>
        </div>
        <Button asChild>
          <Link href="/auth/login?redirect=/dashboard/create">
            <Plus size={16} className="mr-2" />
            Create Poll
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPolls.map((poll) => (
          <Card key={poll.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {poll.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>By {poll.createdBy}</span>
                <span>{poll.totalVotes} votes</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BarChart3 size={14} />
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/polls/${poll.id}`}>
                    Vote Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockPolls.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">No polls available</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a poll and gather opinions!
          </p>
          <Button asChild>
            <Link href="/auth/login?redirect=/dashboard/create">
              <Plus size={16} className="mr-2" />
              Create First Poll
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
