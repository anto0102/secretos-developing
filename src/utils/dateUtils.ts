import { Timestamp } from 'firebase/firestore';

export function formatTimeAgo(timestamp: Timestamp | Date | null | undefined): string {
  if (!timestamp) {
    return 'data non disponibile';
  }

  let date: Date;
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    date = timestamp as Date;
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    const value = Math.floor(interval);
    return value + (value === 1 ? " anno fa" : " anni fa");
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const value = Math.floor(interval);
    return value + (value === 1 ? " mese fa" : " mesi fa");
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const value = Math.floor(interval);
    return value + (value === 1 ? " giorno fa" : " giorni fa");
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const value = Math.floor(interval);
    return value + (value === 1 ? " ora fa" : " ore fa");
  }
  interval = seconds / 60;
  if (interval > 1) {
    const value = Math.floor(interval);
    return value + (value === 1 ? " minuto fa" : " minuti fa");
  }
  const value = Math.floor(seconds);
  return value + (value === 1 ? " secondo fa" : " secondi fa");
}