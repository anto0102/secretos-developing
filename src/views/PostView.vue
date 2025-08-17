<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Loader } from 'lucide-vue-next';
import { type Post } from '../types';

import PostDetail from '../components/PostDetail.vue';
import PostCommentsView from './PostCommentsView.vue';

const props = defineProps<{ postId: string }>();
const router = useRouter();

const post = ref<Post | null>(null);
const isLoading = ref(true);
const errorMsg = ref('');
let unsubscribe: (() => void) | null = null;

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
    <header class="page-header">
      <button @click="router.back()" class="header-btn"><ArrowLeft :size="22" /></button>
      <h1 class="page-title">Post</h1>
      <div></div>
    </header>

    <div v-if="isLoading" class="loading">
      <Loader :size="40" class="spinner" />
      <span>Caricamento post...</span>
    </div>

    <div v-else-if="errorMsg" class="error-state">
      <p>{{ errorMsg }}</p>
    </div>

    <div v-else-if="post" class="post-container">
      <PostDetail :post="post" @delete-post="handleDeletePost" />
      
      <PostCommentsView :post-id="post.id" />
    </div>

    <div v-else class="error-state">
      <p>Post non trovato.</p>
    </div>
  </div>
</template>

<style scoped>
.post-view-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  color: #fff;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: bold;
}
.header-btn {
  background: none;
  border: 1px solid #363636;
  color: #a0a0a0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.header-btn:hover {
  color: #fff;
  background-color: #2a2a2a;
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
</style>