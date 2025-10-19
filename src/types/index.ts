export type PollOption = {
  id: string;
  text: string;
  _count: {
    votes: number;
  };
};

export type PollAuthor = {
  id: string;
  name?: string | null;
} | null;

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  author: PollAuthor;
  createdAt: Date;
  dueDate?: Date | null;
  visibility: string;
  tags?: { tag: { name: string } }[];
};

export type Comment = {
  id: string;
  text: string;
  author: {
    email: string;
  };
};