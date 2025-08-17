<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import PostCard from '../components/PostCard.vue';
import FilterTabs from '../components/FilterTabs.vue';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, doc, getDoc, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';
import { type Post } from '../types';
import { Loader, Sparkles, Flame, Shuffle } from 'lucide-vue-next';

// Definiamo i filtri specifici per la homepage
const homeFilterTabs = [
  { key: 'new', label: 'Nuovi', icon: Sparkles },
  { key: 'viral', label: 'Virali', icon: Flame },
  { key: 'random', label: 'Random', icon: Shuffle }
];

const posts = ref<Post[]>([]);
const isLoading = ref(true);
const activeFilter = ref<'new' | 'viral' | 'random'>('new');
const lastVisibleDoc = ref<DocumentSnapshot | null>(null);
const isMoreLoading = ref(false);
const hasMore = ref(true);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver;
let unsubscribe: () => void;

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const fetchInitialPosts = () => {
  isLoading.value = true;
  hasMore.value = true;
  lastVisibleDoc.value = null;
  posts.value = [];
  if (observer) observer.disconnect();
  if (unsubscribe) unsubscribe();

  const orderByField = activeFilter.value === 'viral' ? 'score' : 'createdAt';
  const q = query(collection(db, "posts"), orderBy(orderByField, "desc"), limit(5));

  unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
    const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length > 0) {
        const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
        const avatarMap = new Map();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) avatarMap.set(userDoc.id, userDoc.data().avatarUrl);
        });
        posts.value = postsData.map(post => ({ ...post, authorAvatarUrl: avatarMap.get(post.authorId) || '' }));
    } else { posts.value = postsData; }
    
    isLoading.value = false;
    if (querySnapshot.docs.length < 5) hasMore.value = false;
    
    await nextTick();
    setupObserver();
  });
};

const fetchAndShufflePosts = async () => {
  isLoading.value = true;
  hasMore.value = false;
  if (observer) observer.disconnect();
  if (unsubscribe) unsubscribe();

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
  const querySnapshot = await getDocs(q);
  const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

  const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length > 0) {
        const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
        const avatarMap = new Map();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) avatarMap.set(userDoc.id, userDoc.data().avatarUrl);
        });
        const postsWithAvatars = postsData.map(post => ({ ...post, authorAvatarUrl: avatarMap.get(post.authorId) || '' }));
        posts.value = shuffleArray(postsWithAvatars);
    } else { 
      posts.value = shuffleArray(postsData);
    }
  
  isLoading.value = false;
};

const loadMorePosts = async () => {
  if (isMoreLoading.value || !hasMore.value || !lastVisibleDoc.value) return;
  isMoreLoading.value = true;
  const orderByField = activeFilter.value === 'viral' ? 'score' : 'createdAt';
  const q = query( collection(db, "posts"), orderBy(orderByField, "desc"), startAfter(lastVisibleDoc.value), limit(5) );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
    const newPostsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    const authorIds = [...new Set(newPostsData.map(post => post.authorId).filter(Boolean))];
    let newPostsWithAvatars = newPostsData;
    if (authorIds.length > 0) {
        const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
        const avatarMap = new Map();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) avatarMap.set(userDoc.id, userDoc.data().avatarUrl);
        });
        newPostsWithAvatars = newPostsData.map(post => ({ ...post, authorAvatarUrl: avatarMap.get(post.authorId) || '' }));
    }
    posts.value.push(...newPostsWithAvatars);
    if (querySnapshot.docs.length < 5) hasMore.value = false;
  } else { hasMore.value = false; }
  isMoreLoading.value = false;
};
const setupObserver = () => {
  if (observer) observer.disconnect();
  if (sentinelRef.value) {
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { loadMorePosts(); }
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.value);
  }
};

watch(activeFilter, (newFilter) => {
  if (newFilter === 'random') {
    fetchAndShufflePosts();
  } else {
    fetchInitialPosts();
  }
});

onMounted(() => {
  fetchInitialPosts();
});

onUnmounted(() => { 
  if (unsubscribe) unsubscribe();
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="feed-container">
    <div class="sticky-header">
      <FilterTabs 
        :tabs="homeFilterTabs"
        :active-filter="activeFilter" 
        @set-filter="(filter) => activeFilter = filter" 
      />
    </div>
    
    <div v-if="isLoading" class="loading">Caricamento...</div>
    
    <div v-else>
      <div v-if="posts.length === 0" class="empty-state">Nessun post da mostrare.</div>
      <div v-else>
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        
        <div v-if="activeFilter !== 'random'" ref="sentinelRef" class="sentinel"></div>

        <div v-if="isMoreLoading" class="loading-more">
          <Loader :size="24" class="spinner" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}
.loading, .empty-state { text-align: center; padding: 2rem; color: #a0a0a0; }
.sentinel { height: 20px; }
.loading-more { display: flex; justify-content: center; padding: 1rem; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(5px);
  padding: 1rem 1.5rem 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}
</style>