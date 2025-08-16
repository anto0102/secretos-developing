// src/utils/dateUtils.ts

import { Timestamp } from 'firebase/firestore';

export function formatTimeAgo(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) {
    return 'data non disponibile';
  }

  let date: Date;
  // Controlla se l'oggetto è un Timestamp di Firebase
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    date = timestamp as Date;
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " anni fa";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " mesi fa";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " giorni fa";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " ore fa";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minuti fa";
  }
  return Math.floor(seconds) + " secondi fa";
}