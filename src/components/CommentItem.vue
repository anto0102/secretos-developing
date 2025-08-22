<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import CommentHeader from './CommentHeader.vue';
import CommentActions from './CommentActions.vue';
import CommentReplies from './CommentReplies.vue';
import { useRouter } from 'vue-router';
import { parseText, handleMentionClick } from '../utils/textParser';
import { type Comment, type UserProfile } from '../types';

interface CommentWithAuthor extends Comment {
  authorProfile?: UserProfile;
}

const props = defineProps<{
  comment: CommentWithAuthor;
  areRepliesVisible: boolean;
  postId: string;
  postIsAnonymous: boolean;
  postAuthorId: string;
}>();

const emit = defineEmits(['vote-comment', 'delete-comment', 'reply-request']);

const areRepliesVisibleInternal = ref(props.areRepliesVisible);
const parsedCommentText = ref('');
const router = useRouter();

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
        :author-primary-official-badge="comment.authorProfile?.primaryOfficialBadge"
        :author-primary-custom-badge-id="comment.authorProfile?.primaryCustomBadge"
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
      
      <div v-if="comment.mediaUrl" class="comment-media">
        <img :src="comment.mediaUrl" :alt="`Media for comment ${comment.id}`" class="comment-image" />
      </div>

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
  padding-left: 52px;
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

.comment-media {
  padding-left: 52px; /* Same as comment text for alignment */
  margin-top: 0.75rem;
}
.comment-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #4a4a4a;
  object-fit: cover;
}
</style>