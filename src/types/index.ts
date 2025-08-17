import { Timestamp } from 'firebase/firestore';

// ... Interfacce Post e Comment (invariate) ...
export interface Post {
  id: string;
  author: string;
  authorId: string;
  text: string;
  score: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isMediaSpoiler?: boolean;
  isEdited?: boolean;
  editedAt?: Timestamp;
  pollEndDate?: Timestamp;
  commentsCount: number;
  createdAt?: Timestamp;
  upvotedBy: string[];
  downvotedBy: string[];
  authorAvatarUrl?: string;
  isAnonymous?: boolean;
  anonymousAuthorGender?: 'male' | 'female' | 'nonbinary';
  anonymousAuthorBirthdate?: string;
  isPoll?: boolean;
  pollOptions?: {
    text: string;
    votes: number;
    votedBy: string[];
  }[];
  pollSettings?: {
    voteType: 'single' | 'multiple';
    resultsVisibility: 'always' | 'after_vote';
    voteVisibility: 'public' | 'anonymous';
  };
}

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

    // --- NUOVI CAMPI PER I BADGE ---
    badges?: string[]; // Array di ID dei badge ottenuti (es. ['pioneer', 'popular'])
    primaryBadge?: string; // L'ID del badge scelto come primario (es. 'popular')
}