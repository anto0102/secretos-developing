// src/utils/notificationState.ts
import { ref } from 'vue';

// Stato globale per tracciare se ci sono notifiche non lette
export const hasUnreadNotifications = ref(true);