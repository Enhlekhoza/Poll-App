'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PollCard } from "@/components/polls/poll-card";
import { Poll } from "@/types/index";
import { getUserPolls } from "@/lib/actions/poll-actions";
import { useSearchParams } from "next/navigation";

// Algolia search hook (you'll need to set up your Algolia client)
import { useAlgoliaSearch } from "@/hooks/useAlgoliaSearch";

export default function DashboardPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  // Use Algolia for search when there's a query, otherwise use regular fetch
  const { searchResults, searching } = useAlgoliaSearch(searchQuery);

  // Fetch all polls when no search query
  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { polls: userPolls = [] } = await getUserPolls();
      setPolls(userPolls);
    } catch (err) {
      console.error(err);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      fetchPolls();
    }
  }, [searchQuery]);

  // Determine which polls to display
  const displayPolls = searchQuery ? searchResults : polls;
  const isLoading = searchQuery ? searching : loading;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'My Polls'}
        </h1>
        <Link href="/dashboard/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Poll
          </Button>
        </Link>
      </div>

      {/* REMOVED the search bar - using the one from layout */}

      {isLoading ? (
        <p>Loading polls...</p>
      ) : displayPolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      ) : searchQuery ? (
        <p>No polls found for "{searchQuery}".</p>
      ) : (
        <p>No polls found.</p>
      )}
    </div>
  );
}