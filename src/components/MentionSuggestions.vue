<script setup lang="ts">
defineProps<{
  users: any[];
  loading: boolean;
}>();
const emit = defineEmits(['select']);
</script>

<template>
  <transition name="suggestion-fade">
    <div class="suggestions-popup">
      <div v-if="loading" class="suggestion-item">
        <div class="loader"></div>
        <span>Caricamento...</span>
      </div>
      <div v-else-if="users.length === 0" class="suggestion-item">Nessun utente trovato.</div>
      <div
        v-else
        v-for="user in users"
        :key="user.id"
        class="suggestion-item user"
        @mousedown.prevent="emit('select', user.username)"
      >
        <img :src="user.avatarUrl" class="avatar" alt="avatar" />
        <span class="username">{{ user.username }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.suggestions-popup {
  position: absolute;
  background-color: #2a2a2a;
  border: 1px solid #363636;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 250px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  transform-origin: top left;
}
.suggestion-item {
  padding: 0.75rem;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.suggestion-item.user {
  cursor: pointer;
  transition: background-color 0.2s;
}
.suggestion-item.user:hover {
  background-color: #363636;
  color: #fff;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.username {
  font-weight: bold;
}

/* Animazioni */
.suggestion-fade-enter-active,
.suggestion-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.suggestion-fade-enter-from,
.suggestion-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.loader {
    width: 18px;
    height: 18px;
    border: 2px solid #a0a0a0;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>