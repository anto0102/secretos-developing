<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loader } from 'lucide-vue-next';
import BottomNavbar from './components/BottomNavbar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
import NotificationToast from './components/NotificationToast.vue';
import { db, auth } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const unreadNotification = ref(null);

onMounted(() => {
    auth.onAuthStateChanged(user => {
        if (user) {
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', user.uid),
                where('isRead', '==', false)
            );
            onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const latestNotif = snapshot.docs[0].data();
                    // @ts-ignore
                    unreadNotification.value = latestNotif;
                    setTimeout(() => { unreadNotification.value = null; }, 5000);
                }
            });
        }
    });
});

const handleNotificationClick = () => {
  unreadNotification.value = null;
};
</script>

<template>
  <div class="app-layout">
    <div class="sidebar-container">
      <LeftSidebar />
    </div>

    <main class="main-content">
      <Suspense>
        <router-view />

        <template #fallback>
          <div class="suspense-loader">
            <Loader :size="48" class="spinner" />
            <span>Caricamento della pagina...</span>
          </div>
        </template>
      </Suspense>
      </main>

    <div class="bottom-nav-container">
      <BottomNavbar />
    </div>

    <NotificationToast
      :notification="unreadNotification"
      @close="unreadNotification = null"
      @click="handleNotificationClick"
    />
  </div>
</template>

<style>
/* Gli stili rimangono invariati */
body {
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
.app-layout { display: flex; }
.main-content { flex-grow: 1; padding-bottom: 60px; }
.sidebar-container { display: none; }
.bottom-nav-container { display: block; }
@media (min-width: 768px) {
  .app-layout { height: 100vh; overflow: hidden; }
  .sidebar-container { display: block; flex-shrink: 0; }
  .main-content { flex-grow: 1; overflow-y: auto; height: 100vh; padding-bottom: 0; }
  .bottom-nav-container { display: none; }
}
.suspense-loader {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  gap: 1rem;
  color: #a0a0a0;
}
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>