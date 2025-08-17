// src/utils/badges.ts
import { Crown, Feather, MessageSquare, Flame } from 'lucide-vue-next';

// Definiamo la struttura di un Badge
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any; // Componente icona di Lucide
  color: string;
}

// Mappa di tutti i badge disponibili nell'applicazione
export const badges: Record<string, Badge> = {
  pioneer: {
    id: 'pioneer',
    name: 'Pioniere',
    description: 'Ha pubblicato il suo primo post.',
    icon: Feather,
    color: '#3498db', // Blu
  },
  chatterbox: {
    id: 'chatterbox',
    name: 'Chiacchierone',
    description: 'Ha scritto più di 50 commenti.',
    icon: MessageSquare,
    color: '#f1c40f', // Giallo
  },
  popular: {
    id: 'popular',
    name: 'Popolare',
    description: 'Un suo post ha raggiunto 100 upvote.',
    icon: Flame,
    color: '#e67e22', // Arancione
  },
  king: {
    id: 'king',
    name: 'Re del Segreto',
    description: 'Un suo post ha raggiunto 500 upvote.',
    icon: Crown,
    color: '#e74c3c', // Rosso
  }
};