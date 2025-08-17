<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import CommentItem from './CommentItem.vue';

const props = defineProps<{ 
  replies?: any[],
  areVisible: boolean,
  postId: string,
  postIsAnonymous: boolean,
  postAuthorId: string,
}>();

defineEmits(['vote-comment', 'delete-comment', 'submit-reply']);
</script>

<template>
  <div v-if="replies && replies.length > 0 && areVisible" class="replies-container">
    <div class="replies-list">
      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :post-id="postId"
        :post-is-anonymous="postIsAnonymous"
        :post-author-id="postAuthorId"
        @vote-comment="(payload) => $emit('vote-comment', payload)"
        @delete-comment="(commentId) => $emit('delete-comment', commentId)"
        @reply-request="(payload) => $emit('reply-request', payload)"
      />
    </div>
  </div>
</template>

<style scoped>
.replies-container {
  position: relative;
  margin-left: 20px;
  padding-left: 24px;
  border-left: 2px solid #363636;
}
.replies-list {
  padding-top: 1rem;
}
</style>