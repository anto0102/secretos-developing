<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { X } from 'lucide-vue-next';
import { type UserProfile } from '../types';

const props = defineProps<{
  title: string;
  users: UserProfile[];
  loading: boolean;
}>();

const emit = defineEmits(['close']);
const router = useRouter();

const goToProfile = (userId: string) => {
  router.push({ name: 'Profile', params: { userId } });
  emit('close');
};
</script>

<template>
  <transition name="modal">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container">
        <div class="drag-handle"></div>
        <button @click="emit('close')" class="close-btn">
          <X :size="24" />
        </button>
        <h2 class="menu-title">{{ title }}</h2>
        
        <div v-if="loading" class="loader">Caricamento...</div>
        <div v-else-if="users.length === 0" class="empty-state">
          Nessun utente da mostrare.
        </div>
        <div v-else class="user-list">
          <div v-for="user in users" :key="user.id" class="user-item" @click="goToProfile(user.id)">
            <img :src="user.avatarUrl" class="avatar" />
            <span class="username">{{ user.username }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Stili per le animazioni */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}


/* Stili esistenti (invariati) */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: flex-end; z-index: 1000; backdrop-filter: blur(5px);
}
.modal-container {
  width: 100%; max-width: 500px; background-color: #1a1a1a;
  border-radius: 20px 20px 0 0; padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4); position: relative;
  max-height: 70vh; display: flex; flex-direction: column;
}
.drag-handle {
  width: 50px; height: 6px; background-color: #333;
  border-radius: 3px; margin: 0 auto 1.5rem; flex-shrink: 0;
}
.close-btn {
  position: absolute; top: 1rem; right: 1rem; background: none;
  border: none; color: #a0a0a0; cursor: pointer; padding: 0.5rem; border-radius: 50%;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; }
.menu-title {
  text-align: center; font-size: 1.5rem; font-weight: bold;
  margin-bottom: 2rem; flex-shrink: 0;
}
.user-list { overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
.user-item {
  display: flex; align-items: center; gap: 1rem; padding: 0.5rem;
  border-radius: 8px; cursor: pointer; transition: background-color 0.2s;
}
.user-item:hover { background-color: #2a2a2a; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.username { font-weight: bold; color: #fff; }
.loader, .empty-state { text-align: center; padding: 2rem; color: #a0a0a0; }

@media (min-width: 768px) {
  .modal-overlay { align-items: center; }
  .modal-container { border-radius: 12px; transform: translateY(0) !important; }
}
</style>