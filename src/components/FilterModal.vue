<script setup lang="ts">
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
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
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
</template>

<style scoped>
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
  /* --- ANIMAZIONE CORRETTA --- */
  animation: fade-in 0.3s forwards;
}

.modal-container {
  width: 100%;
  max-width: 500px;
  background-color: #1a1a1a;
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  /* --- ANIMAZIONE CORRETTA --- */
  animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  position: relative;
}

/* --- KEYFRAMES PER L'ANIMAZIONE --- */
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* --- FINE SEZIONE ANIMAZIONE --- */

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