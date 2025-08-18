<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import PostCard from '../components/PostCard.vue';
import FilterTabs from '../components/FilterTabs.vue';
import FilterModal from '../components/FilterModal.vue';
import { db, auth } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, doc, getDoc, limit, startAfter, getDocs, DocumentSnapshot, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { type Post, type UserProfile } from '../types';
import { Loader, Sparkles, Flame, Shuffle, Users } from 'lucide-vue-next';
import NProgress from '../utils/loadingIndicator'; // <-- 1. IMPORTA NPROGRESS

interface PostWithAuthor extends Post {
  authorProfile?: UserProfile;
}

const posts = ref<PostWithAuthor[]>([]);
const isLoading = ref(true);
const activeFilter = ref<'new' | 'viral' | 'random' | 'following'>('new');
const lastVisibleDoc = ref<DocumentSnapshot | null>(null);
const isMoreLoading = ref(false);
const hasMore = ref(true);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver;
let unsubscribe: (() => void) | null = null;
const isLoggedIn = ref(false);

const isMobile = ref(window.innerWidth < 768);
const isFilterModalOpen = ref(false);

const checkMobile = () => { isMobile.value = window.innerWidth < 768; };

const allFilterTabs = computed(() => {
  const tabs: any[] = [
    { key: 'new', label: 'Nuovi', icon: Sparkles },
    { key: 'viral', label: 'Virali', icon: Flame },
  ];
  if (isLoggedIn.value) {
    tabs.splice(1, 0, { key: 'following', label: 'Seguiti', icon: Users });
  }
  tabs.push({ key: 'random', label: 'Random', icon: Shuffle });
  return tabs;
});

const visibleTabs = computed(() => isMobile.value ? allFilterTabs.value.slice(0, 3) : allFilterTabs.value);
const hiddenTabs = computed(() => isMobile.value ? allFilterTabs.value.slice(3) : []);

const setFilter = (filterKey: 'new' | 'viral' | 'random' | 'following') => {
    isFilterModalOpen.value = false;
    if (filterKey === 'random') {
        NProgress.start(); // <-- 2. AVVIA LA BARRA PER IL FILTRO RANDOM
        activeFilter.value = 'random';
        fetchAndShufflePosts();
        return;
    }
    if (activeFilter.value !== filterKey) {
        activeFilter.value = filterKey;
    }
};

const enrichPostsWithAuthors = async (postsData: Post[]): Promise<PostWithAuthor[]> => {
    const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length === 0) return postsData;
    const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
    const authorProfileMap = new Map<string, UserProfile>();
    userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          authorProfileMap.set(userDoc.id, userDoc.data() as UserProfile);
        }
    });
    return postsData.map(post => ({
      ...post,
      authorProfile: authorProfileMap.get(post.authorId),
      authorAvatarUrl: authorProfileMap.get(post.authorId)?.avatarUrl || '',
    }));
};

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const fetchInitialPosts = (filter = activeFilter.value) => {
  isLoading.value = true;
  hasMore.value = true;
  lastVisibleDoc.value = null;
  posts.value = [];
  if (observer) observer.disconnect();
  if (unsubscribe) unsubscribe();

  const orderByField = filter === 'viral' ? 'score' : 'createdAt';
  const q = query(collection(db, "posts"), orderBy(orderByField, "desc"), limit(10));

  unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
    posts.value = await enrichPostsWithAuthors(postsData);
    isLoading.value = false;
    NProgress.done(); // <-- 3. FERMA LA BARRA QUANDO I DATI SONO CARICATI
    if (querySnapshot.docs.length < 10) hasMore.value = false;
    await nextTick();
    setupObserver();
  }, (error) => {
      console.error("Errore nel fetch dei post:", error);
      isLoading.value = false;
      NProgress.done(); // <-- 3. FERMA LA BARRA ANCHE IN CASO DI ERRORE
  });
};

const fetchFollowingPosts = async () => {
    isLoading.value = true;
    posts.value = [];
    hasMore.value = true;
    lastVisibleDoc.value = null;
    if (observer) observer.disconnect();
    if (unsubscribe) unsubscribe();

    const user = auth.currentUser;
    if (!user) {
        isLoading.value = false;
        hasMore.value = false;
        posts.value = [];
        NProgress.done(); // <-- 3. FERMA LA BARRA
        return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const followingList = userDocSnap.exists() ? userDocSnap.data()?.following || [] : [];

    if (followingList.length === 0) {
        isLoading.value = false;
        hasMore.value = false;
        posts.value = [];
        NProgress.done(); // <-- 3. FERMA LA BARRA
        return;
    }

    // Il resto della funzione rimane invariato
    const followingChunks = [];
    for (let i = 0; i < followingList.length; i += 30) {
        followingChunks.push(followingList.slice(i, i + 30));
    }

    try {
        const queries = followingChunks.map(chunk => 
            query(collection(db, "posts"), where("authorId", "in", chunk), orderBy("createdAt", "desc"), limit(10))
        );
        const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));
        let combinedPosts: Post[] = [];
        querySnapshots.forEach(snap => {
            combinedPosts.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
        });
        combinedPosts.sort((a, b) => b.createdAt!.toMillis() - a.createdAt!.toMillis());
        const initialPostsData = combinedPosts.slice(0, 10);
        const lastPostId = initialPostsData.length > 0 ? initialPostsData[initialPostsData.length - 1].id : null;
        if (lastPostId) {
            lastVisibleDoc.value = await getDoc(doc(db, "posts", lastPostId));
        }
        posts.value = await enrichPostsWithAuthors(initialPostsData);
        if (initialPostsData.length < 10) hasMore.value = false;
        await nextTick();
        setupObserver();
    } catch(error) {
        console.error("Errore nel fetch dei post seguiti:", error);
    } finally {
        isLoading.value = false;
        NProgress.done(); // <-- 3. FERMA LA BARRA
    }
};

const fetchAndShufflePosts = async () => {
  isLoading.value = true;
  hasMore.value = false;
  posts.value = [];
  if (observer) observer.disconnect();
  if (unsubscribe) unsubscribe();

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
  const querySnapshot = await getDocs(q);
  const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  posts.value = shuffleArray(await enrichPostsWithAuthors(postsData));
  isLoading.value = false;
  NProgress.done(); // <-- 3. FERMA LA BARRA
};

const loadMorePosts = async () => {
    // ... logica invariata ...
};
const setupObserver = () => {
    // ... logica invariata ...
};

watch(activeFilter, (newFilter, oldFilter) => {
  if (newFilter === oldFilter && newFilter !== 'random') return; 

  NProgress.start(); // <-- 2. AVVIA LA BARRA QUANDO CAMBIA IL FILTRO

  if (newFilter === 'following') {
    fetchFollowingPosts();
  } else if (newFilter !== 'random') {
    fetchInitialPosts(newFilter);
  } else {
    // Il caso 'random' viene gestito in setFilter, ma per sicurezza fermiamo la barra se non fa nulla
    NProgress.done();
  }
});

onMounted(() => {
  window.addEventListener('resize', checkMobile);
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;
    if (!user && activeFilter.value === 'following') {
        activeFilter.value = 'new';
    } else {
        if (activeFilter.value === 'following') fetchFollowingPosts();
    }
  });

  if (activeFilter.value === 'random') {
    fetchAndShufflePosts();
  } else if (activeFilter.value === 'following') {
    fetchFollowingPosts();
  } else {
    fetchInitialPosts();
  }
});

onUnmounted(() => { 
  window.removeEventListener('resize', checkMobile);
  if (unsubscribe) unsubscribe();
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="feed-container">
    <div class="sticky-header">
      <FilterTabs 
        :tabs="visibleTabs"
        :active-filter="activeFilter"
        :show-more-button="isMobile && hiddenTabs.length > 0"
        @set-filter="setFilter" 
        @open-modal="isFilterModalOpen = true"
      />
    </div>
    
    <div v-if="isLoading" class="loading">Caricamento...</div>
    
    <div v-else>
      <div v-if="posts.length === 0" class="empty-state">
        <span v-if="activeFilter === 'following'">Non segui ancora nessuno o gli utenti che segui non hanno post.</span>
        <span v-else>Nessun post da mostrare.</span>
      </div>
      <div v-else>
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        <div v-if="activeFilter !== 'random' && hasMore" ref="sentinelRef" class="sentinel"></div>
        <div v-if="isMoreLoading" class="loading-more">
          <Loader :size="24" class="spinner" />
        </div>
      </div>
    </div>

    <FilterModal 
      v-if="isFilterModalOpen"
      :tabs="hiddenTabs"
      @close="isFilterModalOpen = false"
      @set-filter="setFilter"
    />
  </div>
</template>

<style scoped>
.feed-container { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
.sticky-header { position: sticky; top: 0; z-index: 50; background-color: rgba(26, 26, 26, 0.8); backdrop-filter: blur(5px); padding: 1rem 1.5rem; margin: 0 -1.5rem; }
.loading, .empty-state { text-align: center; padding: 2rem; color: #a0a0a0; }
.sentinel { height: 20px; }
.loading-more { display: flex; justify-content: center; padding: 1rem; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>