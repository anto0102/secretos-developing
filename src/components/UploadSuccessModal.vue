<script setup lang="ts">
import { defineEmits } from 'vue';
import { CheckCircle } from 'lucide-vue-next';

const emit = defineEmits(['close']);
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <CheckCircle :size="64" class="success-icon" />
      <h3>Caricamento completato!</h3>
      <p>La tua immagine è stata caricata con successo.</p>
      <button @click="emit('close')" class="close-btn">Chiudi</button>
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
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-container {
  background-color: #2a2a2a;
  color: #fff;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  transform: scale(0.9);
  animation: modal-enter 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
}

.success-icon {
  color: #4CAF50;
  margin-bottom: 1rem;
  animation: bounce-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

h3 {
  margin: 0 0 0.5rem;
}

p {
  color: #ccc;
  margin: 0 0 1.5rem;
}

.close-btn {
  background-color: #fff;
  color: #1a1a1a;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s ease, background-color 0.2s;
}

.close-btn:hover {
  transform: scale(1.05);
  background-color: #eee;
}

/* Animazioni */
@keyframes modal-enter {
  to { transform: scale(1); }
}
@keyframes bounce-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>