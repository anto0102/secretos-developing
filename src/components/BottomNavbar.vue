<script setup lang="ts">
import { Home, Search, PlusCircle, Bell, User } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const hasUnreadNotifications = ref(false);

const fetchUnreadNotificationsCount = (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  onSnapshot(q, (snapshot) => {
    hasUnreadNotifications.value = !snapshot.empty;
  });
};

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchUnreadNotificationsCount(user.uid);
        }
    });
});
</script>

<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item">
      <Home :size="26" />
    </router-link>
    <router-link to="/search" class="nav-item">
      <Search :size="26" />
    </router-link>
    <router-link to="/create" class="nav-item add-button">
      <PlusCircle :size="32" />
    </router-link>
    <router-link to="/notifications" class="nav-item notification-link">
      <Bell :size="26" />
      <div v-if="hasUnreadNotifications" class="notification-badge"></div>
    </router-link>
    <router-link to="/profile" class="nav-item">
      <User :size="26" />
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #161616;
  border-top: 1px solid #363636;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 1rem;
}
.nav-item {
  color: #a0a0a0;
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
}
.nav-item:hover {
  color: #fff;
}
/* Stile per il link della pagina attiva */
.nav-item.router-link-exact-active {
  color: #fff;
}
.add-button {
  color: #4f46e5;
}
.add-button.router-link-exact-active {
  color: #6d63ff;
}

/* Stili per il badge di notifica */
.notification-link {
  position: relative;
}
.notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    background-color: #ef4444;
    border-radius: 50%;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}
</style>