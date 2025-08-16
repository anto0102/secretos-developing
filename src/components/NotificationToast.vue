<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { BellRing, X } from 'lucide-vue-next';

const props = defineProps({
  notification: Object
});

const emit = defineEmits(['close', 'click']);
</script>

<template>
  <transition name="toast">
    <div v-if="notification" class="notification-toast" @click="emit('click', notification)">
      <div class="icon-wrapper">
        <BellRing :size="20" class="icon" />
      </div>
      <div class="content">
        <p class="text">{{ notification.text }}</p>
        <span class="time">{{ notification.timestamp ? 'Appena arrivata' : '' }}</span>
      </div>
      <button @click.stop="emit('close')" class="close-btn">
        <X :size="16" />
      </button>
    </div>
  </transition>
</template>

<style scoped>
.notification-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border: 1px solid #4f46e5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 1000;
}
.icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: #4f46e5;
  color: #fff;
  flex-shrink: 0;
  animation: pulse-ring 1s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}
.content {
  flex-grow: 1;
}
.text {
  margin: 0;
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
}
.time {
  font-size: 0.8rem;
  color: #a0a0a0;
}
.close-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.close-btn:hover {
  background-color: #363636;
  color: #fff;
}
@keyframes pulse-ring {
  0% { transform: scale(.33); }
  80%, 100% { opacity: 0; }
}

/* Animazioni */
.toast-enter-active, .toast-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.toast-enter-from, .toast-leave-to {
  transform: translateY(-100%) translateX(-50%);
  opacity: 0;
}
</style>