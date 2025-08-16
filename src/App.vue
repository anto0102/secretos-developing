<script setup lang="ts">
import BottomNavbar from './components/BottomNavbar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
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
  </div>
</template>

<style>
/* Stili globali */
body {
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif; /* Un font più moderno */
  margin: 0;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

.app-layout {
  display: flex;
}

.main-content {
  flex-grow: 1; /* Occupa tutto lo spazio disponibile */
  padding-bottom: 60px; /* Spazio per la navbar mobile */
  max-width: 900px;
  margin: 0 auto;
}

/* Logica Responsive: Mobile First */

/* Di default (mobile), la sidebar è nascosta e la bottom nav è visibile */
.sidebar-container { display: none; }
.bottom-nav-container { display: block; }

/* Quando lo schermo è largo almeno 768px (tablet/desktop)... */
@media (min-width: 768px) {
  .sidebar-container { display: block; } /* ...mostra la sidebar */
  .bottom-nav-container { display: none; } /* ...nascondi la barra inferiore */
  .main-content { padding-bottom: 0; } /* ...rimuovi lo spazio extra in basso */
}
</style>