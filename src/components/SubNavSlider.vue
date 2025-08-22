<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Tab {
  key: string;
  label: string;
  icon: any; // Lucide-vue-next component
}

defineProps<{
  tabs: Tab[];
  activeTab: string;
}>();

const emit = defineEmits(['set-tab']);
</script>

<template>
  <div class="sub-nav-container">
    <div class="sub-nav-slider">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="emit('set-tab', tab.key)"
        class="slider-btn"
      >
        <component :is="tab.icon" :size="18" />
        <span>{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sub-nav-container {
  width: 100%;
  overflow-x: auto;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  padding-bottom: 10px; /* space for shadow */
  margin-bottom: 1rem;
}

.sub-nav-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.sub-nav-slider {
  display: flex;
  width: max-content;
  gap: 1rem;
}

.slider-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: none;
  background-color: #363636;
  color: #a0a0a0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  white-space: nowrap;
}

.slider-btn:hover {
  background-color: #444;
  color: #fff;
}

.slider-btn.active {
  color: #fff;
  background: #4f46e5;
  box-shadow: 0 4px 15px -5px rgba(79, 70, 229, 0.6);
}
</style>
