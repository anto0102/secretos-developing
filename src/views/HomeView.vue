<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import PostCard from '../components/PostCard.vue';
import FilterTabs from '../components/FilterTabs.vue';
import FilterModal from '../components/FilterModal.vue';
import { db, auth } from '../firebase/config';
import { collection, query, orderBy, doc, getDoc, limit, startAfter, getDocs, DocumentSnapshot, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { type Post, type UserProfile } from '../types';
import { Loader, Sparkles, Flame, Shuffle, Users } from 'lucide-vue-next';
import NProgress from '../utils/loadingIndicator';

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
let observer: IntersectionObserver | null = null;
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
    if (activeFilter.value === filterKey) return;
    activeFilter.value = filterKey;
};

const enrichPostsWithAuthors = async (postsData: Post[]): Promise<PostWithAuthor[]> => {
    const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length === 0) return postsData as PostWithAuthor[];

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

const setupObserver = () => {
    if (observer) observer.disconnect();
    if (sentinelRef.value) {
        observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore.value && !isMoreLoading.value) {
                loadMorePosts();
            }
        }, { threshold: 0.5 });
        observer.observe(sentinelRef.value);
    }
};

const fetchPosts = async (filter: 'new' | 'viral' | 'random' | 'following') => {
    isLoading.value = true;
    NProgress.start();
    posts.value = [];
    hasMore.value = true;
    lastVisibleDoc.value = null;
    if (observer) observer.disconnect();

    let q;
    const baseCollection = collection(db, "posts");

    try {
        if (filter === 'random') {
            hasMore.value = false;
            const randomQuery = query(baseCollection, orderBy("createdAt", "desc"), limit(50));
            const querySnapshot = await getDocs(randomQuery);
            const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            posts.value = shuffleArray(await enrichPostsWithAuthors(postsData));
        } else if (filter === 'following') {
            const user = auth.currentUser;
            if (!user) {
                posts.value = []; hasMore.value = false;
                isLoading.value = false; NProgress.done(); return;
            }
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const followingList = userDocSnap.exists() ? userDocSnap.data()?.following || [] : [];
            
            if (followingList.length === 0) {
                posts.value = []; hasMore.value = false;
                isLoading.value = false; NProgress.done(); return;
            }
            // NOTA: Firestore limita la clausola 'in' a 30 elementi.
            // Questa implementazione disabilita lo scroll infinito se si seguono più di 30 persone.
            if (followingList.length > 30) hasMore.value = false;

            q = query(baseCollection, where("authorId", "in", followingList.slice(0, 30)), orderBy("createdAt", "desc"), limit(10));
        } else {
            const orderByField = filter === 'viral' ? 'score' : 'createdAt';
            q = query(baseCollection, orderBy(orderByField, "desc"), limit(10));
        }
        
        if (q) {
            const querySnapshot = await getDocs(q);
            const postsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
            posts.value = await enrichPostsWithAuthors(postsData);
            if (querySnapshot.docs.length < 10) {
                hasMore.value = false;
            }
        }
    } catch (error) {
        console.error("Errore nel fetch dei post:", error);
        hasMore.value = false;
    } finally {
        isLoading.value = false;
        NProgress.done();
    }
};

const loadMorePosts = async () => {
    if (isMoreLoading.value || !hasMore.value || !lastVisibleDoc.value || activeFilter.value === 'random') return;
    isMoreLoading.value = true;

    let q;
    const baseCollection = collection(db, "posts");
    
    try {
        if (activeFilter.value === 'following') {
            const user = auth.currentUser;
            if (!user) return;
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const followingList = userDocSnap.exists() ? userDocSnap.data()?.following || [] : [];
            if (followingList.length === 0 || followingList.length > 30) {
                hasMore.value = false; return;
            }
            q = query(baseCollection, where("authorId", "in", followingList), orderBy("createdAt", "desc"), startAfter(lastVisibleDoc.value), limit(10));
        } else {
            const orderByField = activeFilter.value === 'viral' ? 'score' : 'createdAt';
            q = query(baseCollection, orderBy(orderByField, "desc"), startAfter(lastVisibleDoc.value), limit(10));
        }

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
            const newPostsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            const enrichedNewPosts = await enrichPostsWithAuthors(newPostsData);
            posts.value.push(...enrichedNewPosts);
            if (querySnapshot.docs.length < 10) hasMore.value = false;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error("Errore nel caricare altri post:", error);
    } finally {
        isMoreLoading.value = false;
    }
};

watch(activeFilter, (newFilter) => {
    fetchPosts(newFilter);
});

// NUOVO WATCHER: si occupa di attivare l'observer solo quando il caricamento è finito
// e ci sono dei post da mostrare. Questo risolve il problema di timing.
watch(isLoading, (newIsLoading) => {
    if (!newIsLoading && posts.value.length > 0) {
        nextTick(() => {
            setupObserver();
        });
    }
});


onMounted(() => {
  window.addEventListener('resize', checkMobile);
  onAuthStateChanged(auth, (user) => {
    const wasLoggedIn = isLoggedIn.value;
    isLoggedIn.value = !!user;
    if (wasLoggedIn !== isLoggedIn.value) {
      if (!isLoggedIn.value && activeFilter.value === 'following') {
        activeFilter.value = 'new';
      } else {
        fetchPosts(activeFilter.value);
      }
    }
  });
  fetchPosts(activeFilter.value);
});

onUnmounted(() => { 
  window.removeEventListener('resize', checkMobile);
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