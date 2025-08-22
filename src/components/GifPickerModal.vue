<script setup lang="ts">
import { ref } from 'vue';
import { X, Search, Loader } from 'lucide-vue-next';

const emit = defineEmits(['close', 'select-gif']);

const searchQuery = ref('');
const gifs = ref<any[]>([]);
const isLoading = ref(false);
const errorMsg = ref('');
let debounceTimeout: number | null = null;

const GIPHY_API_KEY = '4imk63i0nSOUzTWkLIl4MxtLl5B7u4jv';

const searchGifs = async () => {
  if (!searchQuery.value.trim()) {
    gifs.value = [];
    return;
  }
  isLoading.value = true;
  errorMsg.value = '';

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery.value)}&limit=20&rating=g`);
    if (!response.ok) {
      throw new Error('Failed to fetch GIFs from GIPHY.');
    }
    const data = await response.json();
    gifs.value = data.data;
  } catch (e) {
    console.error(e);
    errorMsg.value = 'Could not load GIFs. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const onInput = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchGifs();
  }, 500);
};

const selectGif = (gif: any) => {
  // Using the fixed height URL for better layout consistency
  const gifUrl = gif.images.fixed_height.url;
  emit('select-gif', gifUrl);
};

</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <button @click="$emit('close')" class="close-btn"><X :size="24" /></button>
      <h3 class="title">Cerca una GIF</h3>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="e.g., funny cat, reaction..." 
          @input="onInput"
          class="search-input"
        />
        <Search :size="20" class="search-icon" />
      </div>

      <div class="results-grid">
        <div v-if="isLoading" class="loading-state">
          <Loader :size="32" class="spinner" />
        </div>
        <div v-else-if="errorMsg" class="error-state">{{ errorMsg }}</div>
        <div v-else-if="gifs.length === 0 && searchQuery" class="empty-state">No results found for "{{ searchQuery }}"</div>
        <div v-else class="gif-grid">
          <div v-for="gif in gifs" :key="gif.id" class="gif-item" @click="selectGif(gif)">
            <img :src="gif.images.fixed_width.url" :alt="gif.title" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background-color: #2a2a2a;
  color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  height: 80vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  z-index: 10; /* Ensure it's above other content */
}
.title { text-align: center; margin-top: 0; margin-bottom: 1.5rem; }
.search-bar {
  position: relative;
  margin-bottom: 1.5rem;
}
.search-input {
  width: 100%;
  background-color: #1f1f1f;
  border: 1px solid #363636;
  border-radius: 999px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  color: #fff;
  font-size: 1rem;
  box-sizing: border-box; /* Fix overflow issue */
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0a0a0;
}
.results-grid {
  flex-grow: 1;
  overflow-y: auto;
  margin: 0 -0.5rem; /* Counteract padding on items */
}
.gif-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 0 0.5rem; /* Add padding back */
}
.gif-item {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}
.gif-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.loading-state, .error-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #a0a0a0;
}
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Mobile Styles */
@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  .title {
    margin-top: 2rem; /* Add space for status bar */
  }
  .close-btn {
    top: 1.5rem; /* Adjust for status bar */
  }
  .gif-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
