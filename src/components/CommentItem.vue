<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue';
import CommentHeader from './CommentHeader.vue';
import CommentActions from './CommentActions.vue';
import CommentReplies from './CommentReplies.vue';
import { useRouter } from 'vue-router'; // Importa il router

const props = defineProps({
  comment: { type: Object, required: true },
  areRepliesVisible: { type: Boolean, default: true },
  postId: { type: String, required: true },
  postIsAnonymous: { type: Boolean, required: true },
  postAuthorId: { type: String, required: true },
});

const emit = defineEmits(['vote-comment', 'delete-comment', 'reply-request']);

const areRepliesVisibleInternal = ref(props.areRepliesVisible);

const handleToggleReplies = (isVisible: boolean) => {
  areRepliesVisibleInternal.value = isVisible;
};

const router = useRouter();
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
      <p class="comment-text">{{ comment.text }}</p>
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
  padding-left: 44px;
  white-space: pre-wrap;
}
</style>