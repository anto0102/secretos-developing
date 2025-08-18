<script setup lang="ts">
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { X, Settings, Lock, Mail, Trash2 } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const router = useRouter();

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
  emit('close');
};
</script>

<template>
  <transition name="modal">
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
            <span>Username e Preferenze</span>
          </button>
          <button class="nav-item" @click="navigateTo('ChangePassword')">
            <Lock :size="20" />
            <span>Password</span>
          </button>
          <button class="nav-item" @click="navigateTo('ChangeEmail')">
            <Mail :size="20" />
            <span>Email</span>
          </button>
          <button class="nav-item delete-item" @click="navigateTo('DeleteAccount')">
            <Trash2 :size="20" />
            <span>Elimina account</span>
          </button>
        </nav>
      </div>
    </div>
  </transition>
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
}
.settings-menu-container {
  background-color: #1e1e1e;
  width: 100%;
  max-width: 500px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 1rem 1.5rem 2rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
}
.drag-handle {
  width: 40px;
  height: 5px;
  background-color: #444;
  border-radius: 2.5px;
  margin: 0 auto 1rem;
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
}
.menu-title {
  text-align: center;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: #f0f0f0;
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
  padding: 1rem;
  border-radius: 8px;
  background: none;
  border: none;
  color: #e0e0e0;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.nav-item:hover {
  background-color: #2a2a2a;
}
.nav-item.delete-item {
  color: #ef4444;
}
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .settings-menu-container,
.modal-leave-to .settings-menu-container {
  transform: translateY(100%);
}
</style>