<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Bell, Trash2, CheckCheck, Loader, BellRing } from 'lucide-vue-next';
import { formatTimeAgo } from '../utils/dateUtils';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, writeBatch, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';

const router = useRouter();
const notifications = ref<any[]>([]);
const isLoading = ref(true);
const isLoggedIn = ref(false);

const hasUnreadNotifications = computed(() => notifications.value.some(n => !n.isRead));

const fetchNotifications = async (userId: string) => {
    isLoading.value = true;
    try {
        const q = query(
            collection(db, 'notifications'), 
            where('recipientId', '==', userId), 
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        notifications.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Errore nel recupero delle notifiche:", e);
    } finally {
        isLoading.value = false;
    }
};

const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const q = query(
            collection(db, 'notifications'), 
            where('recipientId', '==', user.uid),
            where('isRead', '==', false)
        );
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();

        notifications.value.forEach(n => n.isRead = true);
    } catch (e) {
        console.error("Errore nel segnare le notifiche come lette:", e);
    }
};

const deleteNotification = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'notifications', id));
        notifications.value = notifications.value.filter(n => n.id !== id);
    } catch (e) {
        console.error("Errore nell'eliminazione della notifica:", e);
    }
};

const goToPost = async (notification: any) => {
    if (notification.postId) {
        await updateDoc(doc(db, 'notifications', notification.id), { isRead: true });
        router.push({
            name: 'PostView',
            params: { postId: notification.postId },
            query: notification.commentId ? { commentId: notification.commentId } : {}
        });
    }
};

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
        isLoggedIn.value = !!user;
        if (user) {
            fetchNotifications(user.uid);
        } else {
            notifications.value = [];
        }
    });
});
</script>

<template>
    <div class="notifications-page">
        <div class="page-header">
            <h1 class="page-title">Notifiche</h1>
            <button @click="markAllAsRead" class="read-all-btn">
                <CheckCheck :size="18"/>
                <span>Segna tutte come lette</span>
            </button>
        </div>
        <div v-if="isLoading" class="loading-state">
            <Loader :size="40" class="spinner" />
            <span>Caricamento notifiche...</span>
        </div>
        <div v-else class="notifications-list">
            <div v-if="notifications.length === 0" class="empty-state">
                <Bell :size="48" class="empty-icon" />
                <p>Nessuna notifica qui.</p>
            </div>
            <div 
                v-for="notification in notifications" 
                :key="notification.id" 
                class="notification-card"
                :class="{ 'unread': !notification.isRead }"
                @click="goToPost(notification)"
            >
                <div class="notification-icon-wrapper">
                    <BellRing v-if="!notification.isRead" :size="20" class="notif-icon-ring" />
                    <Bell v-else :size="20" class="notif-icon" />
                </div>
                <div class="notification-content">
                    <p class="notification-text">{{ notification.text }}</p>
                    <span class="notification-time">{{ formatTimeAgo(notification.timestamp) }}</span>
                </div>
                <button @click.stop="deleteNotification(notification.id)" class="delete-btn">
                    <Trash2 :size="16" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notifications-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
}
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}
.page-title {
    font-size: 1.5rem;
    font-weight: bold;
}
.read-all-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: none;
    background-color: #363636;
    color: #a0a0a0;
    border-radius: 999px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}
.read-all-btn:hover {
    background-color: #4b5563;
    color: #fff;
    transform: translateY(-1px);
}
.notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.notification-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #1f1f1f;
    border-radius: 8px;
    border: 1px solid #363636;
    position: relative;
    transition: all 0.2s ease;
    cursor: pointer;
}
.notification-card.unread {
    background-color: #2a2a2a;
    border-left: 3px solid #4f46e5;
}
.notification-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.notification-icon-wrapper {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background-color: #363636;
    color: #a0a0a0;
}
.notification-card.unread .notification-icon-wrapper {
    background-color: #4f46e5;
    color: #fff;
}
.notif-icon-ring {
    animation: pulse-ring 1s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}
.notification-content {
    flex-grow: 1;
}
.notification-text {
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
    color: #e0e0e0;
}
.notification-time {
    font-size: 0.8rem;
    color: #a0a0a0;
}
.delete-btn {
    background: none;
    border: none;
    color: #a0a0a0;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}
.delete-btn:hover {
    background-color: #363636;
    color: #ef4444;
}
.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #a0a0a0;
    background-color: #1f1f1f;
    border-radius: 12px;
}
.empty-icon {
    margin-bottom: 1rem;
}
@keyframes pulse-ring {
  0% { transform: scale(.33); }
  80%, 100% { opacity: 0; }
}
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #a0a0a0;
}
.spinner {
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>