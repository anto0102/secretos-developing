<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { X, Settings, Lock, Mail, User2, Trash2 } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const router = useRouter();

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
  emit('close');
};

// --- LOGICA PER IL TRASCINAMENTO ---
const modalRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const currentTranslateY = ref(0);

const onTouchStart = (event: TouchEvent) => {
  if ((event.target as HTMLElement).closest('.settings-nav')) {
    return;
  }
  isDragging.value = true;
  startY.value = event.touches[0].clientY;
  if (modalRef.value) {
    modalRef.value.style.transition = 'none';
  }
};

const onTouchMove = (event: TouchEvent) => {
  if (!isDragging.value || !modalRef.value) return;
  event.preventDefault();
  const deltaY = event.touches[0].clientY - startY.value;
  if (deltaY > 0) {
    currentTranslateY.value = deltaY;
    modalRef.value.style.transform = `translateY(${deltaY}px)`;
  }
};

const onTouchEnd = () => {
  if (!isDragging.value || !modalRef.value) return;
  isDragging.value = false;
  if (modalRef.value) {
    modalRef.value.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
  }
  const modalHeight = modalRef.value.offsetHeight || 0;
  if (currentTranslateY.value > modalHeight * 0.3) {
    emit('close');
  } else {
    currentTranslateY.value = 0;
    if (modalRef.value) {
      modalRef.value.style.transform = 'translateY(0)';
    }
  }
};

onMounted(() => {
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
});
</script>

<template>
  <transition name="modal" @after-leave="currentTranslateY = 0">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div
        ref="modalRef"
        class="settings-menu-container"
        @touchstart.passive="onTouchStart"
      >
        <div class="drag-handle"></div>
        <button @click="$emit('close')" class="close-btn">
          <X :size="24" />
        </button>
        <h2 class="menu-title">Opzioni</h2>
        <nav class="settings-nav">
          <button class="nav-item" @click="navigateTo('Settings')">
            <Settings :size="20" />
            <span>Preferenze</span>
          </button>
          <button class="nav-item">
            <Lock :size="20" />
            <span>Password</span>
          </button>
          <button class="nav-item">
            <Mail :size="20" />
            <span>Email</span>
          </button>
          <button class="nav-item">
            <User2 :size="20" />
            <span>Età e sesso</span>
          </button>
          <button class="nav-item delete-item">
            <Trash2 :size="20" />
            <span>Elimina account</span>
          </button>
        </nav>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Animazioni */
.modal-enter-active { animation: fade-in 0.3s forwards; }
.modal-leave-active { animation: fade-out 0.4s forwards; }
.modal-enter-active .settings-menu-container { animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
.modal-leave-active .settings-menu-container { animation: slide-down 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
@media (min-width: 768px) {
  .modal-enter-active .settings-menu-container { animation: scale-up 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; }
  .modal-leave-active .settings-menu-container { animation: scale-down 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; }
}

@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slide-down { from { transform: translateY(0); } to { transform: translateY(100%); } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes scale-up { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes scale-down { from { transform: scale(1); opacity: 1; } to { transform: scale(0.8); opacity: 0; } }
/* Fine Animazioni */

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: flex-end; z-index: 1000; backdrop-filter: blur(5px);
}
.settings-menu-container {
  width: 100%; max-width: 500px; background-color: #1a1a1a;
  border-radius: 20px 20px 0 0; padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4); position: relative;
}
.drag-handle {
  width: 50px; height: 6px; background-color: #333;
  border-radius: 3px; margin: 0 auto 1.5rem;
}
.close-btn {
  position: absolute; top: 1rem; right: 1rem; background: none;
  border: none; color: #a0a0a0; cursor: pointer; padding: 0.5rem;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; border-radius: 50%; }
.menu-title {
  text-align: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem;
}
.settings-nav { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item {
  display: flex; align-items: center; gap: 1rem; background: none; border: none;
  color: #e0e0e0; padding: 1rem; border-radius: 12px; text-align: left;
  cursor: pointer; font-size: 1.1rem; font-weight: bold; transition: background-color 0.2s ease;
}
.nav-item:hover { background-color: #2a2a2a; }
.nav-item span { flex-grow: 1; }
.delete-item { color: #ef4444; }

@media (min-width: 768px) {
  .modal-overlay { align-items: center; }
  .settings-menu-container { border-radius: 12px; }
}
</style>