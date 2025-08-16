<script setup lang="ts">
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { X, Settings, Lock, Mail, User2, Trash2 } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const router = useRouter();

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="settings-menu-container">
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
  animation: fade-in 0.3s forwards;
}

.settings-menu-container {
  width: 100%;
  max-width: 500px;
  background-color: #1a1a1a;
  border-radius: 20px 20px 0 0;
  padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
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
}

.close-btn:hover {
  color: #fff;
  background-color: #2a2a2a;
  border-radius: 50%;
}

.menu-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.settings-nav {
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

.nav-item span {
  flex-grow: 1;
}

.delete-item {
  color: #ef4444;
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
  }
  .settings-menu-container {
    animation: scale-up 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
    border-radius: 12px;
  }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>