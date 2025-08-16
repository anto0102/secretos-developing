// src/utils/dateUtils.ts

import { Timestamp } from 'firebase/firestore';

export function formatTimeAgo(timestamp: Timestamp | null): string {
  if (!timestamp) {
    return 'data non disponibile';
  }

  const now = new Date();
  const date = timestamp.toDate();
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