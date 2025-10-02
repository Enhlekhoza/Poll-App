export type Poll = {
  id: string;
  title: string;
  description: string | null;
  options: {
    id: string;
    text: string;
    _count: {
      votes: number;
    };
  }[];
  author: {
    id: string;
    name?: string | null;
  } | null;
  createdAt: Date;
};

export type Comment = {
    id: string;
    text: string;
    author: {
        email: string;
    };
}