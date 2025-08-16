<script setup lang="ts">
import { defineEmits, defineProps, ref, watch, nextTick } from 'vue';
import { Send, X } from 'lucide-vue-next';

const props = defineProps<{
  placeholder: string;
  replyingTo?: { authorUsername: string } | null;
}>();

const emit = defineEmits(['submit-comment', 'cancel-reply']);

const newCommentText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.replyingTo, (newVal) => {
  if (newVal) {
    // nextTick assicura che il DOM sia aggiornato prima di applicare il focus
    nextTick(() => {
        inputRef.value?.focus();
    });
  }
});
</script>

<template>
  <div class="comment-form-container">
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

    <form @submit.prevent="$emit('submit-comment', newCommentText); newCommentText = ''" class="comment-form">
      <input 
        ref="inputRef"
        type="text"
        v-model="newCommentText" 
        :placeholder="placeholder"
        class="comment-input"
      />
      <button type="submit" :disabled="!newCommentText.trim()" class="send-button">
        <Send :size="20" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.comment-form-container { position: fixed; bottom: 0; left: 250px; right: 0; background-color: #1a1a1a; border-top: 1px solid #363636; z-index: 100; padding: 0.75rem 1.5rem; }
.comment-form { display: flex; align-items: center; gap: 0.75rem; max-width: 900px; margin: 0 auto; }
.comment-input { flex-grow: 1; background-color: #2a2a2a; color: #fff; border: 1px solid #363636; border-radius: 999px; padding: 0.6rem 1rem; font-size: 1rem; outline: none; transition: border-color 0.2s; }
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

@media (max-width: 768px) { .comment-form-container { left: 0; } }
</style>