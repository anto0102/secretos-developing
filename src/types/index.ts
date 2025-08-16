import { Timestamp } from 'firebase/firestore';

/**
 * Definisce la struttura di un Post, incluse le opzioni per i sondaggi.
 */
export interface Post {
  id: string;
  author: string;
  authorId: string;
  text: string;
  score: number;
  commentsCount: number;
  createdAt?: Timestamp;
  upvotedBy: string[];
  downvotedBy: string[];
  authorAvatarUrl?: string;
  isAnonymous?: boolean;
  isPoll?: boolean;
  pollOptions?: {
    text: string;
    votes: number;
    votedBy: string[];
  }[];
  pollSettings?: {
    voteType: 'single' | 'multiple';
    resultsVisibility: 'always' | 'after_vote';
    voteVisibility: 'public' | 'anonymous'; // <-- NUOVA IMPOSTAZIONE
  };
}

/**
 * Definisce la struttura di un Commento.
 */
export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    authorUsername: string;
    authorAvatarUrl?: string;
    text: string;
    createdAt: Timestamp;
    score: number;
    upvotedBy: string[];
    downvotedBy: string[];
    parentId?: string | null;
    replies?: Comment[];
}

/**
 * Definisce la struttura del profilo di un Utente.
 */
export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
    bannerUrl?: string;
    createdAt: Timestamp;
    bio?: string;
    pronouns?: string;
    birthdate?: string;
    gender?: 'male' | 'female' | 'nonbinary';
    favorites?: {
        music: {
            author: string;
            track: string;
            link: string;
        };
        movie: string;
        book: string;
    };
    videogame?: string;
    sport?: string;
}