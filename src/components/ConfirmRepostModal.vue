<script setup lang="ts">
import { ref } from 'vue';
import { Loader } from 'lucide-vue-next';
import { useBottomSheet } from '../utils/useBottomSheet';

defineProps<{
  show: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits(['confirm', 'close']);
const sheetRef = ref<HTMLElement | null>(null);

const handleClose = () => {
  emit('close');
};

const { style } = useBottomSheet({
  sheetRef,
  onClose: handleClose,
});

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <transition name="bottom-sheet">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div ref="sheetRef" :style="style" class="modal-container">
        <div class="drag-handle-container">
          <div class="drag-handle"></div>
        </div>
        
        <div class="content">
          <h3>Conferma Repost</h3>
          <p>Sei sicuro di voler ripubblicare questo post sul tuo profilo?</p>
          <div class="actions">
            <button @click="handleClose" class="btn-secondary" :disabled="isLoading">Annulla</button>
            <button @click="handleConfirm" class="btn-primary" :disabled="isLoading">
              <Loader v-if="isLoading" :size="20" class="spinner" />
              <span v-else>Conferma</span>
            </button>
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

.content { padding: 0 1.5rem 1.5rem; text-align: center; }

h3 { margin-top: 0; color: #fff; }
p { color: #a0a0a0; margin-bottom: 1.5rem; }
.actions {
  display: flex;
  gap: 1rem;
}
.actions button {
  flex: 1;
  padding: 0.85rem;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
}
.btn-primary {
  background-color: #4f46e5;
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background-color: #4338ca; }
.btn-secondary {
  background-color: #363636;
  color: #fff;
}
.btn-secondary:hover:not(:disabled) { background-color: #444; }
button:disabled { opacity: 0.7; cursor: not-allowed; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
