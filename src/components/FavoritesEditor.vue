<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  favorites: {
    type: Object,
    default: () => ({ 
      music: { author: '', track: '', link: '' }, 
      movie: '', 
      book: '' 
    })
  }
});

const emit = defineEmits(['update:favorites']);

const handleUpdate = (type: string, value: string | object) => {
  const newFavorites = { ...props.favorites, [type]: value };
  emit('update:favorites', newFavorites);
};
</script>

<template>
  <div class="favorites-editor">
    <div class="input-group-music">
      <label>Musica</label>
      <input 
        type="text" 
        :value="favorites?.music.author" 
        @input="e => handleUpdate('music', { ...favorites.music, author: e.target.value })" 
        placeholder="Artista/Autore preferito"
      >
      <input 
        type="text" 
        :value="favorites?.music.track" 
        @input="e => handleUpdate('music', { ...favorites.music, track: e.target.value })" 
        placeholder="Canzone/Brano preferito"
      >
      <input 
        type="url" 
        :value="favorites?.music.link" 
        @input="e => handleUpdate('music', { ...favorites.music, link: e.target.value })" 
        placeholder="Link (Spotify, YouTube, etc.)"
      >
    </div>
    <div class="input-group">
      <label for="fav-movie">Film</label>
      <input 
        id="fav-movie" 
        type="text" 
        :value="favorites?.movie" 
        @input="e => handleUpdate('movie', e.target.value)" 
        placeholder="Film preferito"
      >
    </div>
    <div class="input-group">
      <label for="fav-book">Libro</label>
      <input 
        id="fav-book" 
        type="text" 
        :value="favorites?.book" 
        @input="e => handleUpdate('book', e.target.value)" 
        placeholder="Libro preferito"
      >
    </div>
  </div>
</template>

<style scoped>
.favorites-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.input-group, .input-group-music {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-group label, .input-group-music label {
  color: #ccc;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}
.input-group input, .input-group-music input {
  width: 100%; 
  box-sizing: border-box; 
  background-color: #1a1a1a; 
  color: #fff; 
  border: 1px solid #555; 
  border-radius: 4px; 
  padding: 0.75rem; 
}
</style>