<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EyeOff } from 'lucide-vue-next';

defineProps<{
  mediaUrl: string | undefined | null;
  mediaType: 'image' | 'video' | null | undefined;
  isMediaSpoiler: boolean | undefined;
  postId: string;
}>();

const router = useRouter();
const showMedia = ref(false);
</script>

<template>
  <div v-if="mediaUrl" class="media-container" @click="router.push({ name: 'PostView', params: { postId: postId } })">
    <div v-if="isMediaSpoiler && !showMedia" class="spoiler-overlay-media" @click.stop="showMedia = true">
      <EyeOff :size="24" />
      <span>Clicca per mostrare il media</span>
    </div>
    
    <img
      v-if="mediaType === 'image'"
      :src="mediaUrl"
      class="post-media"
      alt="Immagine del post"
      :class="{ 'is-spoiler': isMediaSpoiler && !showMedia }"
    />
    <video
      v-else-if="mediaType === 'video'"
      :src="mediaUrl"
      controls
      class="post-media"
      :class="{ 'is-spoiler': isMediaSpoiler && !showMedia }"
    ></video>
  </div>
</template>

<style scoped>
.media-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden; /* Nascondiamo ciò che esce fuori */
  line-height: 0;
  display: block;
}

.post-media {
  width: 100%; /* Forza il media ad adattarsi alla larghezza del contenitore */
  height: auto; /* Mantiene le proporzioni originali */
  max-height: 500px;
  border-radius: 8px;
  display: block;
  cursor: pointer;
}

/* Applichiamo il filtro direttamente al media, non all'overlay */
.post-media.is-spoiler {
  filter: blur(15px);
  transition: filter 0.3s ease;
}

.post-media.is-spoiler:hover {
  filter: blur(5px);
}

.spoiler-overlay-media {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* L'overlay non ha più il blur, ha solo uno sfondo scuro */
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 5;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.spoiler-overlay-media:hover {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>