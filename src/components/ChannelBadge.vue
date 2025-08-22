<script setup lang="ts">
import { computed } from 'vue';
import {
  Lightbulb,
  Smile,
  Frown,
  BookOpen,
  Landmark,
  Hash
} from 'lucide-vue-next';

const props = defineProps<{
  channelId: string;
}>();

const channels: Record<string, { label: string; icon: any }> = {
  proposte: { label: 'Proposte', icon: Lightbulb },
  meme: { label: 'Meme', icon: Smile },
  sad: { label: 'Sad', icon: Frown },
  conoscenze: { label: 'Conoscenze', icon: BookOpen },
  politica: { label: 'Politica', icon: Landmark },
};

const channel = computed(() => channels[props.channelId] || { label: props.channelId, icon: Hash });

</script>

<template>
  <div class="channel-badge">
    <component :is="channel.icon" :size="14" />
    <span>{{ channel.label }}</span>
  </div>
</template>

<style scoped>
.channel-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #363636;
  color: #c0c0c0;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: auto; /* Sposta il badge a destra */
  margin-right: 0.5rem; /* Aggiunge spazio a destra */
}
</style>
