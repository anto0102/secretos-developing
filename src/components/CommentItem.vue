<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, watch } from 'vue';
import CommentHeader from './CommentHeader.vue';
import CommentActions from './CommentActions.vue';
import CommentReplies from './CommentReplies.vue';
import { useRouter } from 'vue-router';
import { parseText, handleMentionClick } from '../utils/textParser'; // Aggiornato

const props = defineProps<{
  comment: any;
  areRepliesVisible: boolean;
  postId: string;
  postIsAnonymous: boolean;
  postAuthorId: string;
}>();

const emit = defineEmits(['vote-comment', 'delete-comment', 'reply-request']);

const areRepliesVisibleInternal = ref(props.areRepliesVisible);
const parsedCommentText = ref(''); // Nuovo ref per il testo parsato
const router = useRouter();

// Watch per aggiornare il testo del commento
watch(() => props.comment.text, async (newText) => {
    if (newText) {
        parsedCommentText.value = await parseText(newText);
    }
}, { immediate: true });


const handleToggleReplies = (isVisible: boolean) => {
  areRepliesVisibleInternal.value = isVisible;
};

const onTextClick = (event: MouseEvent) => {
    handleMentionClick(event, router);
};
</script>

<template>
  <div class="comment-thread-container">
    <div class="comment-item">
      <CommentHeader 
        :author-avatar-url="comment.authorAvatarUrl"
        :author-username="comment.authorUsername"
        :author-id="comment.authorId"
        :reply-count="comment.replies?.length"
        :created-at="comment.createdAt"
        :are-replies-visible="areRepliesVisibleInternal"
        :post-id="postId"
        :post-is-anonymous="postIsAnonymous"
        :post-author-id="postAuthorId"
        @delete-comment="$emit('delete-comment', comment.id)"
        @toggle-replies="handleToggleReplies"
      />
      <p class="comment-text" @click="onTextClick" v-html="parsedCommentText"></p>
      <CommentActions
        :comment="comment"
        @vote-comment="$emit('vote-comment', $event)"
        @reply-request="$emit('reply-request', comment)"
      />
    </div>

    <CommentReplies
      :replies="comment.replies"
      :are-visible="areRepliesVisibleInternal"
      :post-is-anonymous="postIsAnonymous"
      :post-author-id="postAuthorId"
      :post-id="postId"
      @vote-comment="(payload) => $emit('vote-comment', payload)"
      @delete-comment="(commentId) => $emit('delete-comment', commentId)"
      @reply-request="(payload) => $emit('reply-request', payload)"
    />
  </div>
</template>

<style scoped>
.comment-thread-container {
  border-bottom: 1px solid #363636;
  padding: 1rem 0;
}
.comment-thread-container:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.comment-item {
  padding-bottom: 1rem;
}
.comment-text {
  color: #ccc;
  margin: 0.5rem 0;
  line-height: 1.6;
  padding-left: 52px; /* Aumentato per allineare meglio */
  white-space: pre-wrap;
  word-wrap: break-word;
}
.comment-text ::v-deep .mention {
  color: #818cf8;
  font-weight: bold;
  background-color: rgba(79, 70, 229, 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}
.comment-text ::v-deep .mention:hover {
    text-decoration: underline;
}
</style>