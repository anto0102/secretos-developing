<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { X } from 'lucide-vue-next';

defineProps<{
  tabs: Array<{
    key: string;
    label: string;
    icon: any;
  }>;
}>();

const emit = defineEmits(['close', 'set-filter']);

// --- LOGICA PER IL TRASCINAMENTO ---
const modalRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const currentTranslateY = ref(0);

const onTouchStart = (event: TouchEvent) => {
  if ((event.target as HTMLElement).closest('.filter-nav')) return;
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
  const modalHeight = modalRef.value?.offsetHeight || 0;
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
  <transition name="modal">
    <div class="modal-overlay" @click.self="emit('close')">
      <div
        ref="modalRef"
        class="modal-container"
        @touchstart.passive="onTouchStart"
      >
        <div class="drag-handle"></div>
        <button @click="emit('close')" class="close-btn">
          <X :size="24" />
        </button>
        <h2 class="menu-title">Altri Filtri</h2>
        <nav class="filter-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            @click="emit('set-filter', tab.key)"
          >
            <component :is="tab.icon" :size="20" />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* --- ANIMAZIONI CORRETTE --- */
.modal-enter-active .modal-overlay {
  animation: fade-in 0.3s forwards;
}
.modal-leave-active .modal-overlay {
  animation: fade-out 0.4s forwards;
}
.modal-enter-active .modal-container {
  animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
.modal-leave-active .modal-container {
  animation: slide-down 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes slide-down {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
/* --- FINE SEZIONE ANIMAZIONE --- */


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1000;
  backdrop-filter: blur(5px);
}
.modal-container {
  width: 100%;
  max-width: 500px;
  background-color: #1a1a1a;
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  position: relative;
}
.drag-handle {
  width: 50px;
  height: 6px;
  background-color: #333;
  border-radius: 3px;
  margin: 0 auto 1.5rem;
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}
.close-btn:hover {
  color: #fff;
  background-color: #2a2a2a;
}
.menu-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}
.filter-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: none;
  border: none;
  color: #e0e0e0;
  padding: 1rem;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.2s ease;
}
.nav-item:hover {
  background-color: #2a2a2a;
}
</style>