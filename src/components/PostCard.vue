<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-vue-next';
import { db, auth } from '../firebase/config';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { type Post } from '../types';

const props = defineProps<{ post: Post }>();

const isMenuOpen = ref(false);
const currentUser = auth.currentUser;
const router = useRouter();

const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

const isOwner = computed(() => {
  return currentUser && currentUser.uid === props.post.authorId;
});

const isUpvoted = computed(() => 
  currentUser && props.post.upvotedBy?.includes(currentUser.uid)
);

const isDownvoted = computed(() => 
  currentUser && props.post.downvotedBy?.includes(currentUser.uid)
);

const deletePost = async () => {
  if (!confirm("Sei sicuro di voler eliminare questo post? L'azione è irreversibile.")) return;
  try {
    const postRef = doc(db, "posts", props.post.id);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Errore durante l'eliminazione del post:", error);
    alert("Si è verificato un errore durante l'eliminazione del post.");
  }
};

const vote = async (voteType: 'up' | 'down') => {
  if (!currentUser) {
    alert("Devi aver effettuato l'accesso per votare!");
    return;
  }
  const postRef = doc(db, "posts", props.post.id);
  const userId = currentUser.uid;

  if (voteType === 'up') {
    if (isUpvoted.value) {
      await updateDoc(postRef, { upvotedBy: arrayRemove(userId), score: increment(-1) });
    } else if (isDownvoted.value) {
      await updateDoc(postRef, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId), score: increment(2) });
    } else {
      await updateDoc(postRef, { upvotedBy: arrayUnion(userId), score: increment(1) });
    }
  } else if (voteType === 'down') {
    if (isDownvoted.value) {
      await updateDoc(postRef, { downvotedBy: arrayRemove(userId), score: increment(1) });
    } else if (isUpvoted.value) {
      await updateDoc(postRef, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId), score: increment(-2) });
    } else {
      await updateDoc(postRef, { downvotedBy: arrayUnion(userId), score: increment(-1) });
    }
  }
};

const goToComments = () => {
  // Ho cambiato il nome della rotta da 'PostComments' a 'PostView'
  router.push({ name: 'PostView', params: { postId: props.post.id } });
};
</script>

<template>
  <div class="post-card">
    <div class="card-header">
      <span class="author">{{ post.author }}</span>
      <div class="actions">
        <div v-if="isOwner" class="menu-container">
          <MoreHorizontal :size="20" class="icon" @click.stop="toggleMenu" />
          <transition name="fade">
            <div v-if="isMenuOpen" class="dropdown-menu">
              <button @click="deletePost" class="menu-item">
                <Trash2 :size="16" />
                <span>Elimina</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <p class="card-text">{{ post.text }}</p>
    <div class="card-footer">
      <div class="voting">
        <ArrowUp 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'upvoted': isUpvoted }"
          @click="vote('up')" 
        />
        <span class="score">{{ post.score }} punti</span>
        <ArrowDown 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'downvoted': isDownvoted }"
          @click="vote('down')" 
        />
      </div>
      <div class="comments" @click="goToComments">
        <MessageCircle :size="20" class="icon" />
        <span>{{ post.commentsCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-card {
  background-color: #2a2a2a; border-radius: 8px; padding: 1rem 1.5rem;
  margin-bottom: 1rem; border: 1px solid #363636;
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem; color: #a0a0a0; font-size: 0.9rem;
}
.actions { display: flex; gap: 1rem; }
.card-text {
  color: #e0e0e0; line-height: 1.6; font-size: 1rem; white-space: pre-wrap;
}
.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1.5rem; color: #a0a0a0;
}
.voting, .comments { display: flex; align-items: center; gap: 0.75rem; }
.score { font-weight: bold; font-size: 1rem; min-width: 60px; text-align: center; }
.icon { cursor: pointer; transition: color 0.2s; }
.icon:hover { color: #fff; }
.vote-icon:hover { transform: scale(1.1); }
.menu-container { position: relative; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0; background-color: #363636;
  border-radius: 6px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10; width: 150px;
}
.menu-item {
  display: flex; align-items: center; gap: 0.75rem; background: none; border: none;
  color: #ef4444; padding: 0.5rem; width: 100%; text-align: left;
  border-radius: 4px; cursor: pointer; font-weight: bold;
}
.menu-item:hover { background-color: #4b5563; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }
.vote-icon.upvoted:hover, .vote-icon.downvoted:hover { color: #fff; }
</style>