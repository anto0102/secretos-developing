<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// Definiamo che il componente riceve una lista di "tab" da mostrare
defineProps<{
  tabs: Array<{
    key: string;
    label: string;
    icon: any; // L'icona viene passata come componente
  }>;
  activeFilter: string;
}>();

const emit = defineEmits(['setFilter']);
</script>

<template>
  <div class="filter-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="{ active: activeFilter === tab.key }"
      @click="emit('setFilter', tab.key)"
    >
      <component :is="tab.icon" :size="18" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 0.75rem;
}
button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid #363636;
  background-color: #2a2a2a;
  color: #a0a0a0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease-in-out;
}
button:hover {
  background-color: #363636;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
button.active {
  color: #fff;
  background: linear-gradient(45deg, #4f46e5, #818cf8);
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
}
button.active:hover {
  transform: translateY(-2px) scale(1.05);
  filter: brightness(1.1);
}
</style>