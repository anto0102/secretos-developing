<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import PostCard from '../components/PostCard.vue';
import FilterTabs from '../components/FilterTabs.vue';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
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
  unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length > 0) {
        const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
        const avatarMap = new Map();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) avatarMap.set(userDoc.id, userDoc.data().avatarUrl);
        });
        posts.value = postsData.map(post => ({ ...post, authorAvatarUrl: avatarMap.get(post.authorId) || '' }));
    } else {
        posts.value = postsData;
    }
    isLoading.value = false;
  });
}, { immediate: true });

onUnmounted(() => { if (unsubscribe) unsubscribe(); });
</script>

<template>
  <div class="feed-container">
    <FilterTabs :active-filter="activeFilter" @set-filter="(filter) => activeFilter = filter" />
    <div v-if="isLoading" class="loading">Caricamento...</div>
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