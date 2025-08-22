<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db, auth } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader } from 'lucide-vue-next';
import { type Post } from '../types';

import PostDetail from '../components/PostDetail.vue';
import PostCommentsView from './PostCommentsView.vue';
import StickyHeader from '../components/StickyHeader.vue';

const props = defineProps<{ postId: string }>();
const router = useRouter();
const route = useRoute();

const post = ref<Post | null>(null);
const isLoading = ref(true);
const errorMsg = ref('');
const currentUser = ref<{ id: string, avatarUrl: string } | null>(null);
const commentIdFromQuery = ref(route.query.commentId as string | undefined);
let unsubscribe: (() => void) | null = null;

const headerTitle = computed(() => post.value?.author ? `Post di ${post.value.author}` : 'Post');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentUser.value = { id: user.uid, avatarUrl: userDocSnap.data().avatarUrl };
    }
  } else {
    currentUser.value = null;
  }
});

const setupPostListener = (id: string) => {
    isLoading.value = true;
    errorMsg.value = '';

    const postDocRef = doc(db, 'posts', id);

    unsubscribe = onSnapshot(postDocRef, async (postDocSnap) => {
        if (postDocSnap.exists()) {
            const postData = { id: postDocSnap.id, ...postDocSnap.data() } as Post;
            if (postData.authorId) {
                const userDocRef = doc(db, 'users', postData.authorId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    postData.authorAvatarUrl = userDocSnap.data().avatarUrl;
                }
            }
            post.value = postData;
        } else {
            errorMsg.value = "Post non trovato.";
        }
        isLoading.value = false;
    }, (error) => {
        console.error("Errore nel caricamento del post:", error);
        errorMsg.value = "Errore nel caricamento del post.";
        isLoading.value = false;
    });
};

const handleDeletePost = () => {
    router.push('/');
};

onMounted(() => {
    setupPostListener(props.postId);
});

onUnmounted(() => {
    if (unsubscribe) unsubscribe();
});

watch(() => props.postId, (newId) => {
    if (unsubscribe) unsubscribe();
    setupPostListener(newId);
});
</script>

<template>
  <div class="post-view-page">
    <StickyHeader 
      :title="headerTitle"
      :user-avatar-url="currentUser?.avatarUrl"
      :user-id="currentUser?.id"
    />

    <div class="content-wrapper">
      <div v-if="isLoading" class="loading">
        <Loader :size="40" class="spinner" />
        <span>Caricamento post...</span>
      </div>

      <div v-else-if="errorMsg" class="error-state">
        <p>{{ errorMsg }}</p>
      </div>

      <div v-else-if="post" class="post-container">
        <PostDetail :post="post" @delete-post="handleDeletePost" />
        
        <transition name="fade" appear>
          <PostCommentsView :post-id="post.id" :comment-id="commentIdFromQuery" />
        </transition>
      </div>

      <div v-else class="error-state">
        <p>Post non trovato.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-view-page {
  max-width: 900px;
  margin: 0 auto;
  color: #fff;
}
.content-wrapper {
  padding: 1.5rem;
}
.loading, .error-state {
  text-align: center;
  padding: 3rem;
  color: #a0a0a0;
}
.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.post-container {
  padding-bottom: 80px;
}

.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from {
  opacity: 0;
}
</style>