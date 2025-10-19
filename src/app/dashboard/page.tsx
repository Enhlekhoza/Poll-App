"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, ListChecks, Activity, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { PollCard } from "@/components/polls/poll-card" // Assuming a PollCard component exists

// Define a type for the poll data for better type safety
interface Poll {
  id: string;
  title: string;
  _count: {
    votes: number;
    comments: number;
  };
}

const PollsFeed = ({ title, fetchUrl }: { title: string, fetchUrl: string }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPolls = async () => {
      setIsLoading(true);
      try {
        const url = searchTerm ? `${fetchUrl}&tag=${encodeURIComponent(searchTerm)}` : fetchUrl;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPolls(data);
        }
      } catch (error) {
        console.error(`Failed to fetch polls from ${fetchUrl}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceFetch = setTimeout(() => {
      fetchPolls();
    }, 500); // Debounce to avoid fetching on every keystroke

    return () => clearTimeout(debounceFetch);
  }, [fetchUrl, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {title === "Discover Public Polls" ? <ListChecks className="mr-2" /> : <Activity className="mr-2" />}
          {title}
        </CardTitle>
        <CardDescription>
          {title === "Discover Public Polls"
            ? "Explore polls from the community."
            : "Polls you've recently voted on or commented on."}
        </CardDescription>
        {title === "Discover Public Polls" && (
          <div className="pt-2">
            <Input 
              placeholder="Filter by tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : polls.length > 0 ? (
          <div className="space-y-4">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No polls found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardHomePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const handleCreatePollClick = async () => {
    if (user?.role === 'USER') {
      try {
        const response = await fetch('/api/user/promote', { method: 'POST' });
        if (response.ok) {
          await refreshUser(); // Refresh user context to get the new role
        } else {
          console.error("Failed to upgrade user role");
          // Handle error (e.g., show a toast notification)
          return;
        }
      } catch (error) {
        console.error("An error occurred while upgrading user role:", error);
        return;
      }
    }
    router.push('/dashboard/create');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome, {user?.name || user?.email || "User"}!
          </h1>
          <p className="text-lg text-gray-600">
            Discover polls, cast your vote, or create your own.
          </p>
        </div>
        <Button size="lg" onClick={handleCreatePollClick}>
          <PlusCircle className="mr-2" /> Create a Poll
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PollsFeed title="Discover Public Polls" fetchUrl="/api/polls?public=true" />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <PollsFeed title="My Activity" fetchUrl="/api/dashboard/my-activity" />
        </div>
      </div>
    </div>
  )
}
