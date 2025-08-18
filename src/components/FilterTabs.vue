<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { Plus } from 'lucide-vue-next';

defineProps<{
  tabs: Array<{
    key: string;
    label: string;
    icon: any;
  }>;
  activeFilter: string;
  showMoreButton: boolean;
}>();

const emit = defineEmits(['setFilter', 'open-modal']);
</script>

<template>
  <div class="filter-tabs-container">
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

      <button
        v-if="showMoreButton"
        @click="emit('open-modal')"
        class="more-btn"
      >
        <Plus :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-tabs-container {
    width: 100%;
    overflow-x: auto; /* Aggiunto per sicurezza su schermi piccolissimi */
    scrollbar-width: none; /* Nasconde la scrollbar */
}
.filter-tabs-container::-webkit-scrollbar {
    display: none; /* Nasconde la scrollbar su WebKit */
}
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* --- MODIFICA QUI: Ridotto il padding orizzontale --- */
  padding: 0.6rem 1rem;
  border: 1px solid #363636;
  background-color: #2a2a2a;
  color: #a0a0a0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
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
.more-btn {
    padding: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    justify-content: center;
}
</style>