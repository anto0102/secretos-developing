<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-vue-next';
import { db, auth } from '../firebase/config';
import { doc, deleteDoc, updateDoc, arrayRemove, arrayUnion, increment } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { type Post } from '../types';

const props = defineProps<{ post: Post }>();
const isMenuOpen = ref(false);
const router = useRouter();
const isOwner = computed(() => auth.currentUser?.uid === props.post.authorId);
const isUpvoted = computed(() => auth.currentUser && props.post.upvotedBy?.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.post.downvotedBy?.includes(auth.currentUser.uid));

const vote = async (voteType: 'up' | 'down') => {
  if (!auth.currentUser) return;
  const postRef = doc(db, "posts", props.post.id);
  const userId = auth.currentUser.uid;
  if (voteType === 'up') {
    if (isUpvoted.value) await updateDoc(postRef, { upvotedBy: arrayRemove(userId), score: increment(-1) });
    else await updateDoc(postRef, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId), score: increment(isDownvoted.value ? 2 : 1) });
  } else {
    if (isDownvoted.value) await updateDoc(postRef, { downvotedBy: arrayRemove(userId), score: increment(1) });
    else await updateDoc(postRef, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId), score: increment(isUpvoted.value ? -2 : -1) });
  }
};
</script>

<template>
  <div class="post-card">
    <div class="card-header">
      <router-link :to="{ name: 'Profile', params: { userId: post.authorId } }" class="author-link">
        <img v-if="post.authorAvatarUrl" :src="post.authorAvatarUrl" class="author-avatar" alt="Avatar">
        <div v-else class="author-avatar-placeholder"></div>
        <span class="author">{{ post.author }}</span>
      </router-link>
      <div v-if="isOwner" class="menu-container">
        </div>
    </div>
    <p class="card-text" @click="router.push({ name: 'PostView', params: { postId: post.id } })">{{ post.text }}</p>
    <div class="card-footer">
      <div class="voting">
        <ArrowUp :size="22" class="icon vote-icon" :class="{ upvoted: isUpvoted }" @click="vote('up')" />
        <span class="score">{{ post.score }} punti</span>
        <ArrowDown :size="22" class="icon vote-icon" :class="{ downvoted: isDownvoted }" @click="vote('down')" />
      </div>
      <div class="comments" @click="router.push({ name: 'PostView', params: { postId: post.id } })">
        <MessageCircle :size="20" class="icon" />
        <span>{{ post.commentsCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-card { background-color: #2a2a2a; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; border: 1px solid #363636; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.author-link { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
.author-avatar, .author-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background-color: #444; }
.author { color: #a0a0a0; font-size: 0.9rem; font-weight: bold; transition: color 0.2s; }
.author-link:hover .author { color: #fff; }
.card-text { color: #e0e0e0; line-height: 1.6; font-size: 1rem; white-space: pre-wrap; cursor: pointer; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; color: #a0a0a0; }
.comments { cursor: pointer; transition: color 0.2s; }
.comments:hover { color: #fff; }
.vote-icon:hover { transform: scale(1.1); }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }
/* ...altri stili... */
</style>