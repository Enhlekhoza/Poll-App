'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Edit, Trash2, Eye } from 'lucide-react';
import { deletePoll } from '@/lib/actions/poll-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  created_at: string;
  total_votes?: number;
}

interface PollActionsProps {
  poll: Poll;
}

export default function PollActions({ poll }: PollActionsProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deletePoll(poll.id);

      if (result.success) {
        toast.success('Poll deleted successfully!');
        router.refresh(); // Refresh the page to update the polls list
      } else {
        toast.error(result.error || 'Failed to delete poll');
      }
    } catch (error) {
      toast.error('Failed to delete poll');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {poll.description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            {poll.options?.length || 0} options
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>{poll.total_votes || 0} votes</span>
            <span className="mx-2">•</span>
            <span>Created {formatDate(poll.created_at)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/dashboard/polls/${poll.id}`}>
                <Eye className="w-4 h-4 mr-1" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/dashboard/polls/${poll.id}/edit`}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/dashboard/polls/${poll.id}/share`}>
                Share
              </Link>
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
