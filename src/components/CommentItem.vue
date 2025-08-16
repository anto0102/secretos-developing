<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue';
import { ArrowUp, ArrowDown, MoreHorizontal, Trash2, MessageSquare, ChevronDown } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps({
  comment: { type: Object, required: true }
});

const emit = defineEmits(['vote-comment', 'delete-comment', 'reply-request']);

const isMenuOpen = ref(false);
const areRepliesVisible = ref(true);

const isOwner = computed(() => auth.currentUser?.uid === props.comment.authorId);
const isUpvoted = computed(() => auth.currentUser && props.comment.upvotedBy?.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.comment.downvotedBy?.includes(auth.currentUser.uid));

const handleVote = (voteType: 'up' | 'down') => {
    emit('vote-comment', { commentId: props.comment.id, voteType });
};
</script>

<template>
  <div class="comment-thread-container">
    <div class="comment-item">
      <div class="comment-header-row">
        <div class="author-info">
          <img v-if="comment.authorAvatarUrl" :src="comment.authorAvatarUrl" class="comment-avatar" alt="Avatar">
          <div v-else class="comment-avatar-placeholder"></div>
          <span class="comment-author">{{ comment.authorUsername }}</span>
        </div>
        <div class="controls">
          <button v-if="comment.replies?.length > 0" class="toggle-replies-btn" @click="areRepliesVisible = !areRepliesVisible">
            <span>{{ areRepliesVisible ? 'Nascondi' : `${comment.replies.length} risposte` }}</span>
            <ChevronDown :size="18" class="chevron-icon" :class="{ 'rotated': !areRepliesVisible }"/>
          </button>
          <div v-if="isOwner" class="menu-container">
            <MoreHorizontal :size="20" class="icon" @click.stop="isMenuOpen = !isMenuOpen" />
            <transition name="fade">
              <div v-if="isMenuOpen" class="dropdown-menu" @mouseleave="isMenuOpen = false">
                <button @click="$emit('delete-comment', comment.id)" class="menu-item">
                  <Trash2 :size="16" /><span>Elimina</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
      <p class="comment-text">{{ comment.text }}</p>
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
    </div>
    <div v-if="comment.replies?.length > 0 && areRepliesVisible" class="replies-container">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        @vote-comment="(payload) => $emit('vote-comment', payload)"
        @delete-comment="(commentId) => $emit('delete-comment', commentId)"
        @reply-request="(comment) => $emit('reply-request', comment)"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-thread-container { border-bottom: 1px solid #363636; padding: 1rem 0; }
.comment-thread-container:last-child { border-bottom: none; padding-bottom: 0; }
.comment-header-row { display: flex; align-items: center; justify-content: space-between; }
.author-info { display: flex; align-items: center; gap: 0.75rem; }
.comment-avatar, .comment-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background-color: #444; }
.comment-author { font-weight: bold; color: #fff; }
.controls { display: flex; align-items: center; gap: 0.5rem; }
.comment-text { color: #ccc; margin: 0.5rem 0; line-height: 1.6; padding-left: 44px; white-space: pre-wrap; }
.comment-interactions { display: flex; align-items: center; justify-content: flex-end; gap: 1.5rem; margin-top: 0.5rem; padding-left: 44px; }
.voting { display: flex; align-items: center; gap: 0.5rem; }
.score { font-weight: bold; font-size: 0.9rem; color: #a0a0a0; }
.icon { cursor: pointer; color: #a0a0a0; transition: color 0.2s; }
.icon:hover { color: #fff; }
.menu-container { position: relative; }
.dropdown-menu { position: absolute; top: 100%; right: 0; background-color: #363636; border-radius: 6px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10; width: 150px; }
.menu-item { display: flex; align-items: center; gap: 0.75rem; background: none; border: none; color: #ef4444; padding: 0.5rem; width: 100%; text-align: left; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background-color 0.2s; }
.menu-item:hover { background-color: #4b5563; }
.reply-button { background: none; border: none; color: #a0a0a0; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; font-size: 0.9rem; transition: color 0.2s; }
.vote-icon { transition: color 0.2s, transform 0.2s; }
.vote-icon:hover { transform: scale(1.1); color: #fff; }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }
.replies-container { margin-left: 20px; padding-left: 24px; border-left: 2px solid #363636; padding-top: 1rem; }
.toggle-replies-btn { background: none; border: none; color: #a0a0a0; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: color 0.2s, background-color 0.2s; }
.toggle-replies-btn:hover { color: #fff; background-color: #363636; }
.chevron-icon { transition: transform 0.3s ease; }
.chevron-icon.rotated { transform: rotate(-90deg); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>