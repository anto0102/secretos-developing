import { db } from './config';
import { collection, addDoc, getDocs, doc, writeBatch, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';

// Funzione per creare una notifica nel database
export async function createNotification(
  recipientId: string,
  type: 'comment' | 'reply' | 'upvote' | 'follow',
  postId: string,
  text: string,
  commentId?: string,
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId,
      type,
      postId,
      text,
      commentId: commentId || null,
      isRead: false,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Errore nell'aggiunta della notifica: ", e);
  }
}

// Funzione per recuperare le notifiche di un utente
export async function fetchNotifications(userId: string) {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Funzione per segnare tutte le notifiche come lette
export async function markAllNotificationsAsRead(userId: string) {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });
  await batch.commit();
}

// Composabile per ascoltare le notifiche in tempo reale (utile per i popup)
export function useLiveNotifications(userId: string) {
  const notifications = ref<any[]>([]);
  let unsubscribe;

  if (userId) {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );
    unsubscribe = onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  }
  
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });
  
  return notifications;
}