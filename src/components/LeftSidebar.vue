<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Home, Search, Bell, User, LogIn, PenSquare, LogOut } from 'lucide-vue-next';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const router = useRouter();
const isLoggedIn = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;
  });
});

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error("Errore durante il logout:", error);
  }
};
</script>

<template>
  <aside class="sidebar">
    <div class="logo">SECRETO</div>
    <nav>
      <router-link to="/" class="nav-link">
        <Home :size="20" />
        <span>Home</span>
      </router-link>
      <router-link to="/search" class="nav-link">
        <Search :size="20" />
        <span>Cerca</span>
      </router-link>

      <div v-if="isLoggedIn">
        <router-link to="/notifications" class="nav-link">
          <Bell :size="20" />
          <span>Notifiche</span>
        </router-link>
        <router-link to="/profile" class="nav-link">
          <User :size="20" />
          <span>Profilo</span>
        </router-link>
        <router-link to="/create" class="nav-link">
          <PenSquare :size="20" />
          <span>Nuovo Post</span>
        </router-link>
        <button @click="handleLogout" class="nav-link logout-btn">
          <LogOut :size="20" />
          <span>Logout</span>
        </button>
      </div>

      <div v-else>
        <router-link to="/login" class="nav-link">
          <LogIn :size="20" />
          <span>Login</span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
/* Gli stili rimangono quasi invariati */
.sidebar {
  width: 250px; background-color: #161616; padding: 1.5rem; height: 100vh;
  border-right: 1px solid #363636; display: flex; flex-direction: column;
}
.logo { font-weight: bold; font-size: 1.5rem; margin-bottom: 2.5rem; letter-spacing: 2px; }
nav { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-link { 
  display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px;
  color: #a0a0a0; text-decoration: none; transition: background-color 0.2s, color 0.2s;
  width: 100%; background: none; border: none; font-size: 1rem; font-family: inherit;
  cursor: pointer; text-align: left;
}
.nav-link.router-link-exact-active { background-color: #2a2a2a; color: #fff; }
.nav-link:hover { background-color: #2a2a2a; color: #fff; }
</style>