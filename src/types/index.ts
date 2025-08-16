export interface Post {
  id: string;
  author: string;
  authorId: string;
  text: string;
  score: number;
  commentsCount: number;
  createdAt?: any;
  upvotedBy: string[];
  downvotedBy: string[];
  authorAvatarUrl?: string; // <-- QUESTA RIGA È FONDAMENTALE
}