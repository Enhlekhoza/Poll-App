import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Vote } from 'lucide-react';

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
  createdAt: string;
  authorId: string;
  options: PollOption[];
}

export default async function AnalyticsPage() {
  // Fetch polls with their options from Prisma
  const pollsData = await prisma.poll.findMany({
    orderBy: { createdAt: 'desc' },
    include: { options: true }, // Include options for each poll
  });

  // Map data to the Poll interface
  const polls: Poll[] = pollsData.map(poll => ({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    createdAt: poll.createdAt.toISOString(),
    authorId: poll.authorId,
    options: poll.options.map(option => ({
      id: option.id,
      poll_id: option.pollId, // fix field name
      text: option.text,
      votes: 0, // default votes as Prisma doesn't have this field
    })),
  }));

  // Calculate analytics
  const totalPolls = polls.length;
  const totalVotes = polls.reduce(
    (sum, poll) => sum + poll.options.reduce((optionSum, option) => optionSum + option.votes, 0),
    0
  );

  const pollsWithVotes = polls.filter(
    poll => poll.options.reduce((sum, option) => sum + option.votes, 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>

      {/* Overview Cards */}
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
            <p className="text-xs text-muted-foreground">Votes cast</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pollsWithVotes}</div>
            <p className="text-xs text-muted-foreground">Polls with votes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPolls > 0 ? Math.round((pollsWithVotes / totalPolls) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Polls with activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Poll Details */}
      <Card>
        <CardHeader>
          <CardTitle>Poll Performance</CardTitle>
          <CardDescription>Detailed breakdown of each poll's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {polls.length > 0 ? (
              polls.map(poll => {
                const pollVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
                return (
                  <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{poll.title}</h3>
                      <p className="text-sm text-muted-foreground">{poll.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">{poll.options.length} options</Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{pollVotes}</div>
                      <p className="text-sm text-muted-foreground">Total votes</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No polls available for analysis</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}