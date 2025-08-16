<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { ArrowUp, ArrowDown } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['vote-comment']);

const isUpvoted = computed(() => auth.currentUser && props.comment.upvotedBy?.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.comment.downvotedBy?.includes(auth.currentUser.uid));
</script>

<template>
  <div class="comment-item">
    <div class="comment-header-row">
      <img v-if="comment.authorAvatarUrl" :src="comment.authorAvatarUrl" class="comment-avatar" alt="Avatar">
      <div v-else class="comment-avatar-placeholder"></div>
      <div class="comment-info">
        <span class="comment-author">{{ comment.authorUsername }}</span>
        <span class="comment-date">{{ new Date(comment.createdAt?.seconds * 1000).toLocaleDateString() }}</span>
      </div>
    </div>
    <p class="comment-text">{{ comment.text }}</p>
    <div class="comment-interactions">
      <div class="voting">
        <ArrowUp 
          :size="18" 
          class="icon vote-icon" 
          :class="{ 'upvoted': isUpvoted }"
          @click="emit('vote-comment', 'up')" 
        />
        <span class="score">{{ comment.score }}</span>
        <ArrowDown 
          :size="18" 
          class="icon vote-icon" 
          :class="{ 'downvoted': isDownvoted }"
          @click="emit('vote-comment', 'down')" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  border-bottom: 1px solid #363636;
  padding-bottom: 1rem;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.comment-avatar, .comment-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #444;
}
.comment-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.comment-author {
  font-weight: bold;
  color: #fff;
}
.comment-date {
  font-size: 0.8rem;
  color: #a0a0a0;
}
.comment-text {
  color: #ccc;
  margin: 0.5rem 0 0;
  line-height: 1.6;
}
.comment-interactions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
.voting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.score {
  font-weight: bold;
  font-size: 0.9rem;
  color: #a0a0a0;
}
.icon {
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
}
.icon:hover {
  color: #fff;
}
.vote-icon:hover {
  transform: scale(1.1);
}
.vote-icon.upvoted {
  color: #22c55e;
}
.vote-icon.downvoted {
  color: #ef4444;
}
</style>