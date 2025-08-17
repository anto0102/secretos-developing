<script setup lang="ts">
import { computed } from 'vue';
import { type Badge, badges } from '../utils/badges';

const props = defineProps<{
  badgeId: string;
  size?: number;
}>();

const badge = computed<Badge | null>(() => badges[props.badgeId] || null);
</script>

<template>
  <div v-if="badge" class="badge-wrapper">
    <component
      :is="badge.icon"
      :size="size || 16"
      :style="{ color: badge.color }"
    />
    <div class="tooltip">
      <div class="tooltip-name">{{ badge.name }}</div>
      <div class="tooltip-desc">{{ badge.description }}</div>
    </div>
  </div>
</template>

<style scoped>
.badge-wrapper {
  position: relative; /* Necessario per posizionare il tooltip */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px); /* Posizionato sopra l'icona */
  left: 50%;
  transform: translateX(-50%) scale(0.9); /* Parte da una scala ridotta */
  background-color: #1f1f1f;
  color: #e0e0e0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
  border: 1px solid #363636;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  /* Animazione */
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  transform-origin: bottom center;
}

.badge-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) scale(1); /* Scala fino alla dimensione normale */
}

.tooltip-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.tooltip-desc {
  color: #a0a0a0;
  font-size: 0.8rem;
}
</style>