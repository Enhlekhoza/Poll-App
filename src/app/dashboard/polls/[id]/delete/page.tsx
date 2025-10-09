"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPollById, deletePoll } from "@/lib/actions/poll-actions";
import { Poll } from "@/types/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";

export default function DeletePollPage() {
  const params = useParams();
  const pollId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true);
      if (!pollId) {
        toast.error("Poll ID is missing.");
        setLoading(false);
        return;
      }

      const { poll, error } = await getPollById(pollId);
      if (error) {
        toast.error(error);
        setPoll(null);
      } else {
        setPoll(poll);
      }
      setLoading(false);
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const handleDelete = async () => {
    if (!pollId) {
      toast.error("Poll ID is missing.");
      return;
    }

    setDeleting(true);
    const { success, error } = await deletePoll(pollId);
    setDeleting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Poll deleted successfully!");
      router.push("/dashboard/polls");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Poll not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-red-600">Delete Poll</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Are you sure you want to delete the poll: &quot;{poll.title}&quot;? This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">All associated options and votes will also be permanently removed.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/dashboard/polls/${poll.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <LoadingSpinner className="mr-2" /> : "Confirm Delete"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}