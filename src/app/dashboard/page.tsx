import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserPolls } from '@/lib/actions/poll-actions';
import { BarChart3, Plus, Vote, TrendingUp, Users, Calendar, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SharePoll from './polls/SharePoll';

export default async function DashboardPage() {
  const { polls, error } = await getUserPolls();

  const totalPolls = polls?.length || 0;
  const totalVotes = polls?.reduce((sum, poll) => {
    return sum + (poll.options?.reduce((optionSum, option) => optionSum + (option.votes || 0), 0) || 0);
  }, 0) || 0;

  const recentPolls = polls?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your polls.</p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/dashboard/create">
            <Plus className="w-4 h-4" />
            Create Poll
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
            <p className="text-xs text-muted-foreground">Polls created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">Votes received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls?.filter(poll => (poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0) > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">With votes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPolls > 0 ? Math.round((totalVotes / totalPolls) * 10) / 10 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Votes per poll</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Polls
          </CardTitle>
          <CardDescription>Your most recently created polls</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500">{error}</div>}
          {!error && !polls && <div>Loading...</div>}
          {!error && polls && polls.length > 0 ? (
            <div className="space-y-4">
              {recentPolls.map((poll) => {
                const pollVotes = poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
                return (
                  <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium">{poll.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{poll.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">{poll.options?.length || 0} options</Badge>
                        <span className="text-sm text-muted-foreground">{pollVotes} votes</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/polls/${poll.id}`}>View</Link>
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Share Poll</DialogTitle>
                          </DialogHeader>
                          <SharePoll pollId={poll.id} pollTitle={poll.title} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No polls yet</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/create">Create Your First Poll</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your polls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/dashboard/create">
                <Plus className="w-6 h-6" />
                Create New Poll
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/dashboard/polls">
                <BarChart3 className="w-6 h-6" />
                View All Polls
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/dashboard/analytics">
                <TrendingUp className="w-6 h-6" />
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}