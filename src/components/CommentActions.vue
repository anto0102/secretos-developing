<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps<{ comment: any }>();
const emit = defineEmits(['vote-comment', 'reply-request']);

const isUpvoted = computed(() => auth.currentUser && props.comment.upvotedBy?.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.comment.downvotedBy?.includes(auth.currentUser.uid));

const handleVote = (voteType: 'up' | 'down') => {
    emit('vote-comment', { commentId: props.comment.id, voteType });
};
</script>

<template>
  <div class="comment-interactions">
    <div class="voting">
      <ArrowUp :size="18" class="icon vote-icon" :class="{ 'upvoted': isUpvoted }" @click="handleVote('up')" />
      <span class="score">{{ comment.score }}</span>
      <ArrowDown :size="18" class="icon vote-icon" :class="{ 'downvoted': isDownvoted }" @click="handleVote('down')" />
    </div>
    <button class="reply-button" @click="$emit('reply-request', comment)">
      <MessageSquare :size="16" />
      <span>Rispondi</span>
    </button>
  </div>
</template>

<style scoped>
/* Stili invariati */
.comment-interactions { display: flex; align-items: center; justify-content: flex-end; gap: 1.5rem; margin-top: 0.5rem; padding-left: 44px; }
.voting { display: flex; align-items: center; gap: 0.5rem; }
.score { font-weight: bold; font-size: 0.9rem; color: #a0a0a0; }
.icon { cursor: pointer; transition: color 0.2s, transform 0.2s; color: #a0a0a0; }
.reply-button { background: none; border: none; color: #a0a0a0; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; font-size: 0.9rem; transition: color 0.2s; }
.reply-button:hover, .vote-icon:hover { color: #fff; }
.vote-icon:hover { transform: scale(1.1); }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }
</style>