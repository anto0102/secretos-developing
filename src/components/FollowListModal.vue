<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { X } from 'lucide-vue-next';
import { useBottomSheet } from '../utils/useBottomSheet';
import { type UserProfile } from '../types';

const props = defineProps<{
  title: string;
  users: UserProfile[];
  loading: boolean;
  show: boolean;
}>();

const emit = defineEmits(['close']);
const router = useRouter();

const sheetRef = ref<HTMLElement | null>(null);

const handleClose = () => {
  emit('close');
};

const { style } = useBottomSheet({
  sheetRef,
  onClose: handleClose,
});

const goToProfile = (userId: string) => {
  router.push({ name: 'Profile', params: { userId } });
  handleClose();
};
</script>

<template>
  <transition
    name="bottom-sheet"
    @enter-from-class="enterFrom"
    @leave-to-class="leaveTo"
    :css="false" 
  >
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div ref="sheetRef" :style="style" class="modal-container">
        <div class="drag-handle-container">
          <div class="drag-handle"></div>
        </div>
        <button @click="handleClose" class="close-btn">
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
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: flex-end; z-index: 1000; backdrop-filter: blur(5px);
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 100%;
  max-width: 600px;
  background-color: #1a1a1a;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.bottom-sheet-enter-active .modal-container {
  animation: slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.bottom-sheet-leave-active .modal-container {
  animation: slide-down 0.3s ease-in forwards;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

@keyframes slide-up-bounce {
  0% {
    transform: translateY(100%);
  }
  70% {
    transform: translateY(-5%);
  }
  100% {
    transform: translateY(0%);
  }
}

@keyframes slide-down {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(100%);
  }
}

.drag-handle-container { padding: 0.75rem; cursor: grab; }
.drag-handle { width: 40px; height: 5px; background-color: #4a4a4a; border-radius: 2.5px; margin: 0 auto; }

.close-btn {
  position: absolute; top: 1rem; right: 1rem; background: none; border: none;
  color: #a0a0a0; cursor: pointer; padding: 0.5rem; border-radius: 50%;
  transition: color 0.2s, background-color 0.2s;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; }

.menu-title {
  text-align: center; font-size: 1.25rem; font-weight: 600;
  padding: 0 1rem 1rem; flex-shrink: 0;
}

.user-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.5rem 1.5rem;
}

.user-item {
  display: flex; align-items: center; gap: 1rem; padding: 0.75rem;
  border-radius: 12px; cursor: pointer; transition: background-color 0.2s;
}
.user-item:hover { background-color: #2a2a2a; }

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  color: #fff;
}

.loader,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #a0a0a0;
}
</style>