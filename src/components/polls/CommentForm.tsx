"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { addComment } from "@/lib/actions/poll-actions";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/loading-spinner";
import Link from "next/link";

interface CommentFormProps {
  pollId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ pollId, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    const { error } = await addComment(pollId, text);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      setText("");
      onCommentAdded();
    }
  };

  if (!user) {
    return (
      <div className="border rounded-md p-4 bg-muted/20 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Log in to add a comment.</p>
        <Link href={`/auth/login?redirect=/polls/${pollId}`}>
          <Button size="sm">Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        disabled={loading}
      />
      <Button type="submit" disabled={loading}>
        {loading && <LoadingSpinner className="mr-2" />}
        Add Comment
      </Button>
    </form>
  );
}