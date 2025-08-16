<script setup lang="ts">
// Definiamo quali eventi questo componente può "emettere" verso il genitore
const emit = defineEmits(['setFilter']);
defineProps<{
  activeFilter: string;
}>();
</script>

<template>
  <div class="filter-tabs">
    <button
      :class="{ active: activeFilter === 'viral' }"
      @click="emit('setFilter', 'viral')"
    >
      Virali
    </button>
    <button
      :class="{ active: activeFilter === 'new' }"
      @click="emit('setFilter', 'new')"
    >
      Nuovi
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #555;
  background-color: transparent;
  color: #a0a0a0;
  border-radius: 999px; /* Stile "pillola" */
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

button:hover {
  background-color: #2a2a2a;
  color: #fff;
}

button.active {
  background-color: #fff;
  color: #1a1a1a;
  border-color: #fff;
}
</style>