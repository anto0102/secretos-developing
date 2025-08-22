<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { X, Loader } from 'lucide-vue-next';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useBottomSheet } from '../utils/useBottomSheet';
import { type UserProfile } from '../types';

const props = defineProps<{
  show: boolean;
  postId: string;
}>();

const emit = defineEmits(['close']);

const reposters = ref<UserProfile[]>([]);
const isLoading = ref(true);
const errorMsg = ref('');

const sheetRef = ref<HTMLElement | null>(null);

const handleClose = () => {
  emit('close');
};

const { style } = useBottomSheet({
  sheetRef,
  onClose: handleClose,
});

const fetchReposters = async (postId: string) => {
  isLoading.value = true;
  errorMsg.value = '';
  reposters.value = [];

  try {
    const repostsQuery = query(
      collection(db, 'posts'),
      where('repostOf', '==', postId)
    );
    const querySnapshot = await getDocs(repostsQuery);

    const reposterIds = querySnapshot.docs.map(d => d.data().authorId);
    const uniqueReposterIds = [...new Set(reposterIds)];

    if (uniqueReposterIds.length > 0) {
      const userDocs = await Promise.all(uniqueReposterIds.map(uid => getDoc(doc(db, 'users', uid))));
      reposters.value = userDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as UserProfile));
    }
  } catch (e) {
    console.error("Error fetching reposters:", e);
    errorMsg.value = "Impossibile caricare la lista dei repost. Riprova più tardi.";
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.postId, (newPostId) => {
  if (newPostId && props.show) {
    fetchReposters(newPostId);
  }
}, { immediate: true });

watch(() => props.show, (newShow) => {
  if (newShow && props.postId) {
    fetchReposters(props.postId);
  }
});
</script>

<template>
  <transition name="bottom-sheet">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div ref="sheetRef" :style="style" class="modal-container">
        <div class="drag-handle-container">
          <div class="drag-handle"></div>
        </div>
        <button @click="handleClose" class="close-btn"><X :size="24" /></button>
        <h3 class="title">Hanno ripostato</h3>

        <div v-if="isLoading" class="loading-state">
          <Loader :size="32" class="spinner" />
        </div>
        <div v-else-if="errorMsg" class="error-state">{{ errorMsg }}</div>
        <div v-else-if="reposters.length === 0" class="empty-state">Nessun repost.</div>
        <div v-else class="reposters-list">
          <div v-for="user in reposters" :key="user.id" class="reposter-item">
            <img :src="user.avatarUrl" alt="User Avatar" class="reposter-avatar" />
            <span class="username">{{ user.username }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: flex-end; z-index: 1000; backdrop-filter: blur(5px);
  transition: opacity 0.3s ease;
}

.modal-container {
  background-color: #1a1a1a;
  width: 100%;
  max-width: 600px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  will-change: transform;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.bottom-sheet-enter-active .modal-container {
  animation: slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.bottom-sheet-leave-active .modal-container {
  animation: slide-down 0.3s ease-in forwards;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

@keyframes slide-up-bounce {
  0% {
    transform: translateY(100%);
  }
  70% {
    transform: translateY(-5%);
  }
  100% {
    transform: translateY(0%);
  }
}

@keyframes slide-down {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(100%);
  }
}

.drag-handle-container { padding: 0.75rem; cursor: grab; }
.drag-handle { width: 40px; height: 5px; background-color: #4a4a4a; border-radius: 2.5px; margin: 0 auto; }

.close-btn {
  position: absolute; top: 1rem; right: 1rem; background: none; border: none;
  color: #a0a0a0; cursor: pointer; padding: 0.5rem; border-radius: 50%;
  transition: color 0.2s, background-color 0.2s;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; }

.title {
  text-align: center; font-size: 1.25rem; font-weight: 600;
  padding: 0 1rem 1rem; flex-shrink: 0;
}

.loading-state, .error-state, .empty-state {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  flex-grow: 1; color: #a0a0a0; padding: 1rem;
}
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.reposters-list {
  flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column;
  gap: 0.5rem; padding: 0 1.5rem 1.5rem;
}

.reposter-item {
  display: flex; align-items: center; gap: 1rem; padding: 0.75rem;
  border-radius: 12px; background-color: #2a2a2a;
}
.reposter-avatar {
  width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
}
.username { font-weight: 600; }


</style>
