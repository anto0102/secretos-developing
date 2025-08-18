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
      <PlusCircle :size="30" />
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
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 1rem;
  
  /* --- INIZIO MODIFICHE STILE --- */
  background-color: rgba(22, 22, 22, 0.85); /* Sfondo semi-trasparente */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Supporto per Safari */
  border-top: 1px solid rgba(54, 54, 54, 0.8); /* Bordo leggermente trasparente */
  /* --- FINE MODIFICHE STILE --- */
}

.nav-item {
  color: #a0a0a0;
  text-decoration: none;
  transition: color 0.2s, transform 0.2s;
  position: relative;
}
.nav-item:hover {
  color: #fff;
  transform: scale(1.1);
}
.nav-item.router-link-exact-active {
  color: #fff;
}
.add-button {
  color: #4f46e5;
}
.add-button.router-link-exact-active {
  color: #6d63ff;
}
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