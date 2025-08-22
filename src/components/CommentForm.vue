<script setup lang="ts">
import { defineEmits, defineProps, ref, watch, nextTick } from 'vue';
import { Send, X, Image as ImageIcon, Film } from 'lucide-vue-next';
import MentionSuggestions from './MentionSuggestions.vue';
import GifPickerModal from './GifPickerModal.vue';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const props = defineProps<{
  placeholder: string;
  replyingTo?: { authorUsername: string } | null;
}>();

const emit = defineEmits(['submit-comment', 'cancel-reply']);

const newCommentText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Media State
const selectedMediaFile = ref<File | null>(null);
const mediaPreviewUrl = ref<string | null>(null);
const mediaType = ref<'image' | 'gif' | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const isGifModalOpen = ref(false);

// --- Mention Suggestions Logic ---
const showSuggestions = ref(false);
const suggestionQuery = ref('');
const suggestionUsers = ref<any[]>([]);
const suggestionLoading = ref(false);
let mentionTimeout: number | null = null;

const handleInput = () => {
  if (mentionTimeout) clearTimeout(mentionTimeout);
  mentionTimeout = setTimeout(async () => {
    if (!inputRef.value) return;
    const text = newCommentText.value;
    const cursorPosition = inputRef.value.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w+)$/);

    if (mentionMatch) {
      suggestionQuery.value = mentionMatch[1];
      showSuggestions.value = true;
      suggestionLoading.value = true;
      
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", ">=", suggestionQuery.value), where("username", "<=", suggestionQuery.value + '\uf8ff'), limit(5));
        const snapshot = await getDocs(q);
        suggestionUsers.value = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      } catch (e) {
        console.error("Error searching users:", e);
        suggestionUsers.value = [];
      } finally {
        suggestionLoading.value = false;
      }
    } else {
      showSuggestions.value = false;
    }
  }, 300);
};

const handleSuggestionSelect = (username: string) => {
  if (!inputRef.value) return;
  const text = newCommentText.value;
  const cursorPosition = inputRef.value.selectionStart || 0;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const newText = textBeforeCursor.replace(/@(\w+)$/, `@${username} `) + text.substring(cursorPosition);
  newCommentText.value = newText;
  showSuggestions.value = false;
  nextTick(() => inputRef.value?.focus());
};

// --- Media Handling ---
const triggerImageInput = () => {
  clearMedia(true); // Clear GIF selection if any
  imageInputRef.value?.click();
};

const handleImageSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file && file.type.startsWith('image/')) {
    selectedMediaFile.value = file;
    mediaPreviewUrl.value = URL.createObjectURL(file);
    mediaType.value = 'image';
  } else {
    clearMedia();
  }
};

const handleGifSelect = (gifUrl: string) => {
  clearMedia(true); // Clear image selection if any
  mediaPreviewUrl.value = gifUrl;
  mediaType.value = 'gif';
  isGifModalOpen.value = false;
};

const clearMedia = (keepInput: boolean = false) => {
  selectedMediaFile.value = null;
  mediaPreviewUrl.value = null;
  mediaType.value = null;
  if (imageInputRef.value && !keepInput) {
    imageInputRef.value.value = '';
  }
};

const handleSubmit = () => {
  emit('submit-comment', { 
    text: newCommentText.value, 
    mediaFile: selectedMediaFile.value,
    mediaUrl: mediaType.value === 'gif' ? mediaPreviewUrl.value : null,
    mediaType: mediaType.value
  });
  newCommentText.value = '';
  clearMedia();
};

watch(() => props.replyingTo, (newVal) => {
  if (newVal) {
    nextTick(() => {
        inputRef.value?.focus();
    });
  }
});
</script>

<template>
  <div class="comment-form-container">
    <MentionSuggestions
      v-if="showSuggestions"
      :users="suggestionUsers"
      :loading="suggestionLoading"
      @select="handleSuggestionSelect"
      class="comment-suggestions"
    />

    <transition name="badge-slide">
      <div v-if="replyingTo" class="reply-badge">
        <div class="reply-info">
          <span class="reply-label">Stai rispondendo a</span>
          <span class="reply-username">@{{ replyingTo.authorUsername }}</span>
        </div>
        <button @click="$emit('cancel-reply')" class="cancel-reply-btn">
          <X :size="16" />
        </button>
      </div>
    </transition>

    <div class="comment-form-main-area">
      <div v-if="mediaPreviewUrl" class="media-preview">
        <img :src="mediaPreviewUrl" alt="Media preview" />
        <button @click="clearMedia()" class="clear-media-btn"><X :size="16" /></button>
      </div>

      <form @submit.prevent="handleSubmit" class="comment-form">
        <input 
          ref="inputRef"
          type="text"
          v-model="newCommentText" 
          :placeholder="placeholder"
          class="comment-input"
          @input="handleInput"
          @blur="setTimeout(() => showSuggestions = false, 200)"
          @focus="handleInput"
        />
        <input type="file" ref="imageInputRef" @change="handleImageSelect" accept="image/*" style="display: none;" />
        
        <button type="button" @click="triggerImageInput" class="icon-button">
          <ImageIcon :size="20" />
        </button>
        <button type="button" @click="isGifModalOpen = true" class="icon-button">
          <Film :size="20" />
        </button>

        <button type="submit" :disabled="!newCommentText.trim() && !mediaPreviewUrl" class="send-button">
          <Send :size="20" />
        </button>
      </form>
    </div>

    <GifPickerModal 
      v-if="isGifModalOpen" 
      @close="isGifModalOpen = false"
      @select-gif="handleGifSelect"
    />
  </div>
</template>

<style scoped>
.comment-form-container { position: relative; /* Necessario per posizionare i suggerimenti */ }
.comment-suggestions {
    bottom: calc(100% + 8px); /* Posiziona sopra il form */
    left: 1.5rem;
    transform-origin: bottom left;
}
.comment-form-wrapper .comment-suggestions { /* Stile specifico quando il form è fisso */
    bottom: calc(100% + 10px);
    left: 0;
}
@media (max-width: 768px) {
  .comment-suggestions { left: 0; }
}

.comment-form-main-area {
  max-width: 900px;
  margin: 0 auto;
}
.comment-form { display: flex; align-items: center; gap: 0.5rem; /* Reduced gap */ }
.comment-input {
  flex-grow: 1;
  background-color: #2a2a2a;
  color: #fff;
  border: 1px solid #363636;
  border-radius: 999px;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0; /* Allow input to shrink on mobile */
}
.comment-input:focus { border-color: #4f46e5; }
.send-button { background-color: #4f46e5; color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; flex-shrink: 0; }
.send-button:disabled { background-color: #374151; }

.reply-badge { max-width: 900px; margin: 0 auto 0.5rem auto; background-color: #2a2a2a; border-left: 3px solid #4f46e5; padding: 0.5rem 1rem; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
.reply-info { display: flex; flex-direction: column; }
.reply-label { font-size: 0.8rem; color: #a0a0a0; }
.reply-username { color: #fff; font-weight: bold; }
.cancel-reply-btn { background: none; border: none; color: #a0a0a0; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.cancel-reply-btn:hover { background-color: #363636; color: #fff; }

.badge-slide-enter-active, .badge-slide-leave-active { transition: all 0.3s ease; }
.badge-slide-enter-from, .badge-slide-leave-to { transform: translateY(10px); opacity: 0; }

.icon-button {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-button:hover {
  background-color: #363636;
  color: #fff;
}

.media-preview {
  position: relative;
  margin-bottom: 0.75rem;
  width: fit-content; /* Riduci il contenitore alla larghezza del contenuto */
}
.media-preview img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #363636;
  display: block;
}
.clear-media-btn {
  position: absolute;
  top: -8px;      /* Posizione aggiornata */
  right: -8px;     /* Posizione aggiornata */
  background-color: #363636; /* Sfondo più scuro */
  color: #fff;
  border: 2px solid #1a1a1a; /* Bordo per staccare dallo sfondo */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.clear-media-btn:hover {
  background-color: #ef4444; /* Rosso al passaggio del mouse */
  transform: scale(1.1);
}
</style>