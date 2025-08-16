export interface Post {
  id: string;
  author: string;
  authorId: string;
  text: string;
  score: number;
  commentsCount: number;
  createdAt?: any;
  upvotedBy: string[];   // <-- AGGIUNGI QUESTA RIGA
  downvotedBy: string[]; // <-- E QUESTA RIGA
}