<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Loader } from 'lucide-vue-next';
import { type Post } from '../types';

import PostDetail from '../components/PostDetail.vue';
import PostCommentsView from './PostCommentsView.vue';

const props = defineProps<{ postId: string }>();
const router = useRouter();

const post = ref<Post | null>(null);
const isLoading = ref(true);
const errorMsg = ref('');

const fetchPost = async (id: string) => {
    isLoading.value = true;
    errorMsg.value = '';
    
    try {
        const postDocRef = doc(db, 'posts', id);
        const postDocSnap = await getDoc(postDocRef);

        if (postDocSnap.exists()) {
            post.value = { id: postDocSnap.id, ...postDocSnap.data() } as Post;
            if (post.value.authorId) {
                const userDocRef = doc(db, 'users', post.value.authorId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    post.value.authorAvatarUrl = userDocSnap.data().avatarUrl;
                }
            }
        } else {
            errorMsg.value = "Post non trovato.";
        }
    } catch (error) {
        console.error("Errore nel caricamento del post:", error);
        errorMsg.value = "Errore nel caricamento del post.";
    } finally {
        isLoading.value = false;
    }
};

const handleDeletePost = () => {
    router.push('/');
};

onMounted(() => {
    fetchPost(props.postId);
});

watch(() => props.postId, (newId) => {
    fetchPost(newId);
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