<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useBottomSheet } from '../utils/useBottomSheet';
import { X } from 'lucide-vue-next';

interface Action {
  label: string;
  icon?: any; // Lucide icon component
  action: () => void;
  isDestructive?: boolean;
}

const props = defineProps<{
  show: boolean;
  title?: string;
  actions: Action[];
}>();

const emit = defineEmits(['close']);

const sheetRef = ref<HTMLElement | null>(null);

const handleClose = () => {
  emit('close');
};

const { style } = useBottomSheet({
  sheetRef,
  onClose: handleClose,
});

const executeAction = (actionFn: () => void) => {
  actionFn();
  handleClose();
};
</script>

<template>
  <transition name="bottom-sheet">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div ref="sheetRef" :style="style" class="modal-container">
        <div class="drag-handle-container">
          <div class="drag-handle"></div>
        </div>
        
        <div class="header">
          <h3 v-if="title" class="title">{{ title }}</h3>
          <button @click="handleClose" class="close-btn">
            <X :size="24" />
          </button>
        </div>

        <div class="actions-list">
          <button
            v-for="(action, index) in actions"
            :key="index"
            class="action-item"
            :class="{ 'destructive': action.isDestructive }"
            @click="executeAction(action.action)"
          >
            <component v-if="action.icon" :is="action.icon" :size="20" />
            <span>{{ action.label }}</span>
          </button>
        </div>

        <button @click="handleClose" class="cancel-btn">Annulla</button>
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
  background-color: #1a1a1a;
  width: 100%;
  max-width: 600px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  will-change: transform;
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem; /* Space for cancel button */
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem 0.5rem 1.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.close-btn {
  background: none; border: none;
  color: #a0a0a0; cursor: pointer; padding: 0.5rem; border-radius: 50%;
  transition: color 0.2s, background-color 0.2s;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; }

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.action-item {
  display: flex; align-items: center; gap: 1rem; padding: 1rem;
  border-radius: 12px; background: none; border: none; color: #e0e0e0;
  text-align: left; font-size: 1rem; cursor: pointer; transition: background-color 0.2s;
}
.action-item:hover { background-color: #2a2a2a; }
.action-item.destructive { color: #ef4444; }
.action-item.destructive:hover { background-color: rgba(239, 68, 68, 0.1); }

.cancel-btn {
  width: calc(100% - 3rem);
  margin: 0 1.5rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background-color: #363636;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.cancel-btn:hover { background-color: #444; }
</style>
