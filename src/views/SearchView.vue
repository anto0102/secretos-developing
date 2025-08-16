<script setup lang="ts">
import { ref, watch } from 'vue';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search as SearchIcon } from 'lucide-vue-next';

// Importiamo i componenti per visualizzare i risultati
import PostCard from '../components/PostCard.vue';
import UserSearchResult from '../components/UserSearchResult.vue';
import { type Post } from '../types';

// Stato del componente
const searchTerm = ref('');
const activeTab = ref<'posts' | 'users'>('posts');
const results = ref<any[]>([]);
const isLoading = ref(false);
const noResults = ref(false);

// Questa funzione viene chiamata ogni volta che l'utente scrive o cambia tab
const performSearch = async () => {
  if (searchTerm.value.trim().length < 3) {
    results.value = [];
    noResults.value = false;
    return;
  }

  isLoading.value = true;
  noResults.value = false;
  results.value = [];

  try {
    if (activeTab.value === 'posts') {
      // --- RICERCA POST ---
      // Firestore non supporta ricerche "contains" native.
      // Questo approccio cerca i post che INIZIANO con il termine di ricerca (case-sensitive).
      const postsRef = collection(db, "posts");
      const q = query(postsRef,
        where("text", ">=", searchTerm.value),
        where("text", "<=", searchTerm.value + '\uf8ff'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      results.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

    } else if (activeTab.value === 'users') {
      // --- RICERCA UTENTI ---
      // Cerchiamo gli utenti il cui username inizia con il termine di ricerca.
      const usersRef = collection(db, "users");
      const q = query(usersRef,
        where("username", ">=", searchTerm.value),
        where("username", "<=", searchTerm.value + '\uf8ff'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      results.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    if (results.value.length === 0) {
      noResults.value = true;
    }

  } catch (error) {
    console.error("Errore durante la ricerca:", error);
  } finally {
    isLoading.value = false;
  }
};

// Eseguiamo la ricerca ogni volta che 'searchTerm' o 'activeTab' cambiano
// 'debounce' non è implementato qui per semplicità, ma in un'app reale sarebbe utile
watch([searchTerm, activeTab], performSearch);

</script>

<template>
  <div class="search-container">
    <div class="search-bar">
      <SearchIcon :size="20" class="search-icon" />
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="Cerca post o utenti..."
      />
    </div>

    <div class="filter-tabs">
      <button :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">Post</button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">Utenti</button>
    </div>

    <div class="results-container">
      <div v-if="isLoading" class="info-text">Ricerca in corso...</div>
      
      <div v-else-if="noResults" class="info-text">
        Nessun risultato trovato per "{{ searchTerm }}".
      </div>

      <div v-else-if="results.length > 0">
        <div v-if="activeTab === 'posts'">
          <PostCard v-for="post in results" :key="post.id" :post="post" />
        </div>
        <div v-if="activeTab === 'users'">
          <UserSearchResult v-for="user in results" :key="user.id" :user="user" />
        </div>
      </div>
      
       <div v-else-if="searchTerm.length > 0 && searchTerm.length < 3" class="info-text">
        Inserisci almeno 3 caratteri per iniziare la ricerca.
      </div>
      
      <div v-else class="info-text">
        Usa la barra in alto per cercare post e utenti.
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
}
.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.filter-tabs button {
  padding: 0.5rem 1.5rem;
  border: 1px solid #555;
  background-color: transparent;
  color: #a0a0a0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.filter-tabs button:hover {
  background-color: #2a2a2a;
  color: #fff;
}
.filter-tabs button.active {
  background-color: #fff;
  color: #1a1a1a;
  border-color: #fff;
}
.info-text {
  text-align: center;
  padding: 2rem;
  color: #a0a0a0;
}
</style>