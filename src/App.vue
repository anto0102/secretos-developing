<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
                    unreadNotification.value = latestNotif;
                    setTimeout(() => { unreadNotification.value = null; }, 5000);
                }
            });
        }
    });
});

const handleNotificationClick = () => {
  // logica di reindirizzamento...
  unreadNotification.value = null;
};
</script>

<template>
  <div class="app-layout">
    <div class="sidebar-container">
      <LeftSidebar />
    </div>

    <main class="main-content">
      <router-view />
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
/* Stili globali (invariati) */
body {
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
  margin: 0;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

/* --- INIZIO MODIFICHE LAYOUT --- */

.app-layout {
  display: flex;
}

.main-content {
  flex-grow: 1;
  /* Su mobile, aggiungiamo padding per la navbar inferiore */
  padding-bottom: 60px;
}

/* Di default (mobile), la sidebar è nascosta e la bottom nav è visibile */
.sidebar-container { display: none; }
.bottom-nav-container { display: block; }

/* Quando lo schermo è largo almeno 768px (desktop)... */
@media (min-width: 768px) {
  /* Fissiamo l'altezza dell'intero layout allo schermo */
  .app-layout {
    height: 100vh;
    overflow: hidden; /* Nascondiamo lo scroll del body */
  }

  /* La sidebar diventa visibile e rimane fissa */
  .sidebar-container { 
    display: block; 
    flex-shrink: 0; /* Impedisce alla sidebar di rimpicciolirsi */
  }

  /* L'area principale dei contenuti diventa l'unica area scrollabile */
  .main-content {
    flex-grow: 1;
    overflow-y: auto; /* Abilita lo scroll solo qui */
    height: 100vh; /* Occupa tutta l'altezza */
    padding-bottom: 0; /* Rimuoviamo il padding extra */
  }

  /* Nascondiamo la barra inferiore su desktop */
  .bottom-nav-container { display: none; }
}
/* --- FINE MODIFICHE LAYOUT --- */
</style>