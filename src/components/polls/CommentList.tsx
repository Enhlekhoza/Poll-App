"use client";

import { useEffect, useState } from "react";
import { getComments } from "@/lib/actions/poll-actions";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface Comment {
    id: string;
    text: string;
    author: {
        email: string;
    };
}

interface CommentListProps {
  pollId: string;
  refreshComments: boolean;
}

export function CommentList({ pollId, refreshComments }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    const { comments, error } = await getComments(pollId);
    if (error) {
      // Handle error
    } else {
      setComments(comments as Comment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [pollId, refreshComments]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader>
            <CardTitle>{comment.author.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{comment.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
