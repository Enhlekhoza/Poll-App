"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, Vote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Recharts components
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart));
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar));
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart));
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie));
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart));
const Line = dynamic(() => import('recharts').then(mod => mod.Line));
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis));
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis));
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid));
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip));
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend));
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell));
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer));

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

// Helper function to generate votes over time data
function generateVotesOverTimeData(polls: Poll[]) {
  // Create a map of dates to vote counts
  const dateMap = new Map<string, number>();
  
  polls.forEach(poll => {
    const date = new Date(poll.createdAt).toLocaleDateString();
    const votes = poll.options.reduce((sum, option) => sum + option.votes, 0);
    
    if (dateMap.has(date)) {
      dateMap.set(date, dateMap.get(date)! + votes);
    } else {
      dateMap.set(date, votes);
    }
  });
  
  // Convert map to array of objects for Recharts
  return Array.from(dateMap.entries()).map(([date, votes]) => ({
    date,
    votes
  }));
}

export default function AnalyticsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolls() {
      try {
        const response = await fetch('/api/polls?includeOptions=true');
        if (!response.ok) {
          throw new Error('Failed to fetch polls');
        }
        const data = await response.json();
        setPolls(data.polls || []);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchPolls();
  }, []);

  // Calculate analytics
  const totalPolls = polls.length;
  const totalVotes = polls.reduce(
    (sum, poll) => sum + poll.options.reduce((optionSum, option) => optionSum + option.votes, 0),
    0
  );

  const pollsWithVotes = polls.filter(
    poll => poll.options.reduce((sum, option) => sum + option.votes, 0) > 0
  ).length;

  // Prepare data for charts
  const topPolls = [...polls]
    .sort((a, b) => {
      const votesA = a.options.reduce((sum, option) => sum + option.votes, 0);
      const votesB = b.options.reduce((sum, option) => sum + option.votes, 0);
      return votesB - votesA;
    })
    .slice(0, 5);

  // Calculate engagement rate
  const engagementRate = totalPolls > 0 ? ((pollsWithVotes / totalPolls) * 100).toFixed(1) : '0';

  // Get active polls (created in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activePolls = polls.filter(poll => new Date(poll.createdAt) > thirtyDaysAgo).length;

  // Generate data for charts
  const votesOverTimeData = generateVotesOverTimeData(polls);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="text-sm mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your poll performance and engagement</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Vote className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{totalPolls}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{totalVotes}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-2xl font-bold">{activePolls}</div>
              <Badge variant="outline" className="ml-2">Last 30 days</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
              <div className="text-2xl font-bold">{engagementRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="mb-8">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="details">Poll Details</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Bar Chart - Top Polls by Votes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Polls by Votes</CardTitle>
                <CardDescription>Your most popular polls</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPolls.map(poll => ({
                      name: poll.title.length > 20 ? poll.title.substring(0, 20) + '...' : poll.title,
                      votes: poll.options.reduce((sum, option) => sum + option.votes, 0)
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - Option Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Option Distribution</CardTitle>
                <CardDescription>Vote distribution across options</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {topPolls.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topPolls[0]?.options.map(option => ({
                          name: option.text,
                          value: option.votes
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {topPolls[0]?.options.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No poll data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Chart - Votes Over Time */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Votes Over Time</CardTitle>
                <CardDescription>Trend of votes across all polls</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={votesOverTimeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="votes" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Poll Performance</CardTitle>
              <CardDescription>Detailed breakdown of each poll</CardDescription>
            </CardHeader>
            <CardContent>
              {polls.length > 0 ? (
                <div className="space-y-6">
                  {polls.map(poll => {
                    const totalPollVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
                    return (
                      <div key={poll.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg">{poll.title}</h3>
                        {poll.description && <p className="text-muted-foreground text-sm">{poll.description}</p>}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Options</p>
                            <p className="font-medium">{poll.options.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-medium">{new Date(poll.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Votes</p>
                            <p className="font-medium">{totalPollVotes}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No polls available for analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}