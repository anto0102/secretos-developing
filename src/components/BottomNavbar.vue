<script setup lang="ts">
import { Home, Search, PlusCircle, Bell, User } from 'lucide-vue-next';
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
    <router-link to="/notifications" class="nav-item">
      <Bell :size="26" />
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
</style>