<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import PostCard from '../components/PostCard.vue';
import FilterTabs from '../components/FilterTabs.vue';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { type Post } from '../types';

const posts = ref<Post[]>([]);
const isLoading = ref(true);
const activeFilter = ref<'viral' | 'new'>('viral');
let unsubscribe: () => void;

watch(activeFilter, (newFilter) => {
  isLoading.value = true;
  
  if (unsubscribe) unsubscribe();

  const orderByField = newFilter === 'viral' ? 'score' : 'createdAt';
  
  const q = query(collection(db, "posts"), orderBy(orderByField, "desc"));

  unsubscribe = onSnapshot(q, (querySnapshot) => {
    posts.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // **LA CORREZIONE È QUI:** Questo assicura che anche i vecchi post
      // senza i nuovi campi funzionino correttamente con il nostro PostCard aggiornato.
      return {
        id: doc.id,
        ...data,
        upvotedBy: data.upvotedBy || [], // Usa l'array esistente o ne crea uno vuoto
        downvotedBy: data.downvotedBy || [] // Usa l'array esistente o ne crea uno vuoto
      } as Post;
    });
    isLoading.value = false;
  }, (error) => {
    console.error("Errore nel recuperare i post:", error);
    isLoading.value = false;
  });
}, { immediate: true });

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const handleSetFilter = (filter: 'viral' | 'new') => {
  activeFilter.value = filter;
};
</script>

<template>
  <div class="feed-container">
    <FilterTabs :active-filter="activeFilter" @set-filter="handleSetFilter" />
    <div v-if="isLoading" class="loading">Caricamento dei post...</div>
    <div v-else class="post-list">
      <div v-if="posts.length === 0" class="loading">Nessun post da mostrare.</div>
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </div>
</template>

<style scoped>
.feed-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
.loading { text-align: center; padding: 2rem; color: #a0a0a0; }
</style>