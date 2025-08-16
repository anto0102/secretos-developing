<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Search as SearchIcon, Loader, ChevronLeft, ChevronRight } from 'lucide-vue-next';

import PostCard from '../components/PostCard.vue';
import UserSearchResult from '../components/UserSearchResult.vue';
import { type Post } from '../types';

const searchTerm = ref('');
const userResults = ref<any[]>([]);
const mediaResults = ref<any[]>([]);
const postResults = ref<any[]>([]);
const isLoading = ref(true);

const userCarouselRef = ref(null);
const mediaCarouselRef = ref(null);
const postCarouselRef = ref(null);

const scrollCarousel = (ref: any, direction: 'left' | 'right') => {
  const element = ref.value;
  if (!element) return;
  const scrollAmount = direction === 'right' ? 250 : -250;
  element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};

const fetchInitialContent = async () => {
  isLoading.value = true;
  try {
    const postsRef = collection(db, "posts");
    const qPosts = query(postsRef, orderBy('score', 'desc'), orderBy('createdAt', 'desc'), limit(20));
    const postsSnapshot = await getDocs(qPosts);
    const allPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    
    mediaResults.value = allPosts.filter(post => post.mediaUrl);
    postResults.value = allPosts.filter(post => !post.mediaUrl);

    const usersRef = collection(db, "users");
    const qUsers = query(usersRef, limit(5));
    const usersSnapshot = await getDocs(qUsers);
    userResults.value = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error) {
    console.error("Errore nel caricamento dei contenuti iniziali:", error);
  } finally {
    isLoading.value = false;
  }
};

const performSearch = async () => {
  if (searchTerm.value.trim().length === 0) {
    fetchInitialContent();
    return;
  }
  
  if (searchTerm.value.trim().length < 3) {
    userResults.value = [];
    mediaResults.value = [];
    postResults.value = [];
    return;
  }

  isLoading.value = true;
  userResults.value = [];
  mediaResults.value = [];
  postResults.value = [];

  try {
    const searchString = searchTerm.value.trim();
    
    const usersRef = collection(db, "users");
    const qUsers = query(usersRef,
      where("username", ">=", searchString),
      where("username", "<=", searchString + '\uf8ff'),
      limit(10)
    );
    const usersSnapshot = await getDocs(qUsers);
    userResults.value = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const postsRef = collection(db, "posts");
    const qPosts = query(postsRef,
      where("text", ">=", searchString),
      where("text", "<=", searchString + '\uf8ff'),
      limit(20)
    );
    const postsSnapshot = await getDocs(qPosts);
    const allPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    
    mediaResults.value = allPosts.filter(post => post.mediaUrl);
    postResults.value = allPosts.filter(post => !post.mediaUrl);

  } catch (error) {
    console.error("Errore durante la ricerca:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchInitialContent();
});

watch(searchTerm, performSearch);

</script>

<template>
  <div class="search-container">
    <header class="search-header">
      <h1 class="page-title">Esplora</h1>
    </header>
    <div class="search-bar">
      <SearchIcon :size="20" class="search-icon" />
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="Cerca su insegreto..."
      />
    </div>

    <div class="results-container">
      <div v-if="isLoading" class="info-text">
        <Loader :size="32" class="spinner"/>
        <span>Caricamento...</span>
      </div>
      
      <div v-else>
        
        <div v-if="userResults.length > 0" class="section-wrapper">
          <h2 class="section-title">Utenti</h2>
          <div class="carousel-container">
            <button class="scroll-btn left" @click="scrollCarousel(userCarouselRef, 'left')">
              <ChevronLeft :size="24" />
            </button>
            <div ref="userCarouselRef" class="horizontal-scroll-container">
              <UserSearchResult v-for="user in userResults" :key="user.id" :user="user" />
            </div>
            <button class="scroll-btn right" @click="scrollCarousel(userCarouselRef, 'right')">
              <ChevronRight :size="24" />
            </button>
          </div>
        </div>
        <div v-else-if="searchTerm.length > 0 && searchTerm.length >= 3" class="section-wrapper">
            <h2 class="section-title">Utenti</h2>
            <p class="no-results-text">Nessun utente trovato per "{{ searchTerm }}".</p>
        </div>

        <div v-if="mediaResults.length > 0" class="section-wrapper">
          <h2 class="section-title">Media</h2>
          <div class="carousel-container">
            <button class="scroll-btn left" @click="scrollCarousel(mediaCarouselRef, 'left')">
              <ChevronLeft :size="24" />
            </button>
            <div ref="mediaCarouselRef" class="horizontal-scroll-container">
              <PostCard v-for="post in mediaResults" :key="post.id" :post="post" class="carousel-card" />
            </div>
            <button class="scroll-btn right" @click="scrollCarousel(mediaCarouselRef, 'right')">
              <ChevronRight :size="24" />
            </button>
          </div>
        </div>
        <div v-else-if="searchTerm.length > 0 && searchTerm.length >= 3" class="section-wrapper">
            <h2 class="section-title">Media</h2>
            <p class="no-results-text">Nessun media trovato per "{{ searchTerm }}".</p>
        </div>
        
        <div v-if="postResults.length > 0" class="section-wrapper">
          <h2 class="section-title">Post</h2>
          <div class="carousel-container">
            <button class="scroll-btn left" @click="scrollCarousel(postCarouselRef, 'left')">
              <ChevronLeft :size="24" />
            </button>
            <div ref="postCarouselRef" class="horizontal-scroll-container">
              <PostCard v-for="post in postResults" :key="post.id" :post="post" class="carousel-card" />
            </div>
            <button class="scroll-btn right" @click="scrollCarousel(postCarouselRef, 'right')">
              <ChevronRight :size="24" />
            </button>
          </div>
        </div>
        <div v-else-if="searchTerm.length > 0 && searchTerm.length >= 3" class="section-wrapper">
            <h2 class="section-title">Post</h2>
            <p class="no-results-text">Nessun post trovato per "{{ searchTerm }}".</p>
        </div>

        <div v-if="searchTerm.length === 0 && !isLoading && mediaResults.length === 0 && postResults.length === 0" class="info-text">
            Nessun contenuto da mostrare.
        </div>

        <div v-if="searchTerm.length > 0 && searchTerm.length < 3" class="info-text">
            Inserisci almeno 3 caratteri per iniziare la ricerca.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.search-header {
  margin-bottom: 2rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
}
.search-bar {
  position: relative;
  margin-bottom: 2rem;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0a0a0;
}
.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border-radius: 999px;
  border: 1px solid #555;
  background-color: #2a2a2a;
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.search-bar input:focus {
  border-color: #4f46e5;
}
.results-container {
  padding: 0 0.5rem;
}
.info-text {
  text-align: center;
  padding: 2rem;
  color: #a0a0a0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.spinner {
    animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.section-wrapper {
    margin-bottom: 2rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 1.5rem 0 1rem;
  color: #fff;
  border-bottom: 2px solid #363636;
  padding-bottom: 0.5rem;
}
.no-results-text {
    text-align: center;
    color: #a0a0a0;
}

/* Stili per il carosello orizzontale */
.carousel-container {
  position: relative;
}
.horizontal-scroll-container {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scrollbar-width: none;
}
/* Nasconde la scrollbar su WebKit (Chrome, Safari) */
.horizontal-scroll-container::-webkit-scrollbar {
  display: none;
}
.carousel-card {
  flex-shrink: 0;
  width: 250px;
}
/* Stili per i pulsanti di scorrimento */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s, opacity 0.2s;
  opacity: 0.7;
}
.scroll-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  opacity: 1;
}
.scroll-btn.left {
  left: 0.5rem;
}
.scroll-btn.right {
  right: 0.5rem;
}
/* Nasconde le frecce su schermi piccoli */
@media (max-width: 768px) {
  .scroll-btn {
    display: none;
  }
}
</style>