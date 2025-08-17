<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import ProfileHeader from '../components/ProfileHeader.vue';
import AboutTab from '../components/AboutTab.vue';
import PostCard from '../components/PostCard.vue';
import { type Post } from '../types';
import { Loader, ArrowRight } from 'lucide-vue-next';
import { formatTimeAgo } from '../utils/dateUtils';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '../firebase/config';
import UploadSuccessModal from '../components/UploadSuccessModal.vue';
import SettingsMenu from '../components/SettingsMenu.vue';

const props = defineProps<{ userId: string }>();
const router = useRouter();

const userProfile = ref<any>(null);
const isLoading = ref(true);
const isOwner = computed(() => auth.currentUser && auth.currentUser.uid === props.userId);
const activeTab = ref<'about' | 'posts' | 'comments'>('about');
const userPosts = ref<Post[]>([]);
const userComments = ref<any[]>([]);
const isTabLoading = ref(false);

const lastVisibleDoc = ref<DocumentSnapshot | null>(null);
const isMoreLoading = ref(false);
const hasMore = ref(true);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver;

const editingSection = ref<string | null>(null);
const editableData = ref<any>({});

const isUploading = ref<string | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const bannerInputRef = ref<HTMLInputElement | null>(null);
const showSuccessModal = ref(false);
const isSettingsMenuOpen = ref(false);

const triggerFileUpload = (type: 'avatar' | 'banner') => {
  if (!isOwner.value || isUploading.value) return;
  if (type === 'avatar' && avatarInputRef.value) {
    avatarInputRef.value.click();
  } else if (type === 'banner' && bannerInputRef.value) {
    bannerInputRef.value.click();
  }
};

const handleFileChange = async (event: Event, type: 'avatar' | 'banner') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !isOwner.value) return;

  isUploading.value = type;

  const storagePath = `users/${props.userId}/${type}/${file.name}`;
  const fileRef = storageRef(storage, storagePath);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const userDocRef = doc(db, "users", props.userId);
    const dataToUpdate = type === 'avatar' ? { avatarUrl: downloadURL } : { bannerUrl: downloadURL };
    await updateDoc(userDocRef, dataToUpdate);
    userProfile.value = { ...userProfile.value, ...dataToUpdate };
    showSuccessModal.value = true;
  } catch (error) {
    console.error(`Errore nel caricamento del ${type}:`, error);
  } finally {
    isUploading.value = null;
    if (event.target) (event.target as HTMLInputElement).value = '';
  }
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

const openEditor = (section: string) => {
  if (!isOwner.value) return;
  editingSection.value = section;
  editableData.value = JSON.parse(JSON.stringify(userProfile.value));
};

const cancelEdit = () => {
  editingSection.value = null;
};

const saveChanges = async () => {
  if (!isOwner.value || !editingSection.value) return;
  const userDocRef = doc(db, "users", props.userId);
  try {
    const dataToUpdate = { [editingSection.value]: editableData.value[editingSection.value] };
    await updateDoc(userDocRef, dataToUpdate);
    userProfile.value[editingSection.value] = editableData.value[editingSection.value];
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
  } finally {
    editingSection.value = null;
  }
};

const handleUpdateAndSaveField = async ({ field, value }: { field: string, value: any }) => {
  if (!isOwner.value) return;
  const userDocRef = doc(db, "users", props.userId);
  try {
    await updateDoc(userDocRef, { [field]: value });
    userProfile.value[field] = value;
    editingSection.value = null;
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del campo ${field}:`, error);
  }
};

const fetchUserProfile = async (uid: string) => {
  if (!uid) { isLoading.value = false; userProfile.value = null; return; }
  isLoading.value = true;
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  userProfile.value = docSnap.exists() ? docSnap.data() : null;
  isLoading.value = false;
};

const fetchInitialTabData = async (tab: 'posts' | 'comments') => {
  if (!userProfile.value) return;
  isTabLoading.value = true;
  hasMore.value = true;
  lastVisibleDoc.value = null;

  const collectionName = tab;
  let q = query(
    collection(db, collectionName),
    where("authorId", "==", props.userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  // Aggiungi la condizione per i post anonimi se l'utente non è il proprietario del profilo
  if (tab === 'posts' && !isOwner.value) {
    q = query(collection(db, collectionName), where("authorId", "==", props.userId), where("isAnonymous", "==", false), orderBy("createdAt", "desc"), limit(10));
  }
  
  const querySnapshot = await getDocs(q);
  lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];

  if (tab === 'posts') {
    userPosts.value = querySnapshot.docs.map(doc => ({ 
        ...doc.data(), id: doc.id, authorAvatarUrl: userProfile.value.avatarUrl 
    } as Post));
  } else {
    userComments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  if (querySnapshot.empty || querySnapshot.docs.length < 10) {
    hasMore.value = false;
  }

  isTabLoading.value = false;
  await nextTick();
  setupObserver();
};

const loadMore = async () => {
  if (isMoreLoading.value || !hasMore.value || !lastVisibleDoc.value) return;
  
  isMoreLoading.value = true;
  const collectionName = activeTab.value as 'posts' | 'comments';
  let q = query(
    collection(db, collectionName),
    where("authorId", "==", props.userId),
    orderBy("createdAt", "desc"),
    startAfter(lastVisibleDoc.value),
    limit(10)
  );

  if (collectionName === 'posts' && !isOwner.value) {
    q = query(collection(db, collectionName), where("authorId", "==", props.userId), where("isAnonymous", "==", false), orderBy("createdAt", "desc"), startAfter(lastVisibleDoc.value), limit(10));
  }

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
    if (activeTab.value === 'posts') {
      const newPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, authorAvatarUrl: userProfile.value.avatarUrl } as Post));
      userPosts.value.push(...newPosts);
    } else {
      const newComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      userComments.value.push(...newComments);
    }
    if(querySnapshot.docs.length < 10) hasMore.value = false;
  } else {
    hasMore.value = false;
  }
  isMoreLoading.value = false;
};

const setupObserver = () => {
  if (observer) observer.disconnect();
  if (sentinelRef.value) {
    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMore();
      }
    });
    observer.observe(sentinelRef.value);
  }
};

onMounted(() => fetchUserProfile(props.userId));
onUnmounted(() => { if (observer) observer.disconnect(); });
watch(() => props.userId, (newId) => { activeTab.value = 'about'; fetchUserProfile(newId); });
watch(activeTab, (newTab) => {
  if (newTab === 'posts' || newTab === 'comments') {
    fetchInitialTabData(newTab);
  } else {
    if (observer) observer.disconnect();
  }
});
</script>

<template>
  <div v-if="isLoading" class="loading-page">Caricamento profilo...</div>
  <div v-else-if="userProfile" class="profile-layout">
    <ProfileHeader 
      :user-profile="userProfile" 
      :is-owner="isOwner" 
      :is-uploading="isUploading"
      v-model:active-tab="activeTab" 
      @trigger-file-upload="triggerFileUpload"
      @open-settings-menu="isSettingsMenuOpen = true"
    />
    
    <main class="profile-content">
      <div class="content-box">
        <AboutTab 
          v-if="activeTab === 'about'" 
          :user-profile="userProfile" 
          :is-owner="isOwner"
          :editing-section="editingSection"
          v-model:editable-data="editableData"
          @open-editor="openEditor"
          @cancel-edit="cancelEdit"
          @save-changes="saveChanges"
          @update-and-save-field="handleUpdateAndSaveField"
        />
        
        <div v-if="activeTab === 'posts'" class="scrollable-content">
          <div v-if="isTabLoading" class="loading-content">Caricamento...</div>
          <div v-else-if="userPosts.length > 0">
              <PostCard v-for="post in userPosts" :key="post.id" :post="post" />
              <div ref="sentinelRef" class="sentinel"></div>
              <div v-if="isMoreLoading" class="loading-more"><Loader :size="24" class="spinner" /></div>
          </div>
          <div v-else class="empty-state"><h3>Nessun post.</h3></div>
        </div>

        <div v-if="activeTab === 'comments'" class="scrollable-content">
          <div v-if="isTabLoading" class="loading-content">Caricamento...</div>
          <div v-else-if="userComments.length > 0" class="comments-list">
              <div v-for="comment in userComments" :key="comment.id" class="comment-item">
                <p class="comment-text">"{{ comment.text }}"</p>
                <div class="comment-footer">
                  <span class="comment-timestamp">{{ formatTimeAgo(comment.createdAt) }}</span>
                  <button @click="router.push({ name: 'PostView', params: { postId: comment.postId } })" class="go-to-post-btn">
                    <span>Vai al Post</span>
                    <ArrowRight :size="16" />
                  </button>
                </div>
              </div>
              <div ref="sentinelRef" class="sentinel"></div>
              <div v-if="isMoreLoading" class="loading-more"><Loader :size="24" class="spinner" /></div>
          </div>
          <div v-else class="empty-state"><h3>Nessun commento.</h3></div>
        </div>
      </div>
    </main>
  </div>
  <div v-else class="loading-page">Profilo non trovato.</div>
  
  <input type="file" ref="avatarInputRef" @change="handleFileChange($event, 'avatar')" accept="image/*" style="display: none;" />
  <input type="file" ref="bannerInputRef" @change="handleFileChange($event, 'banner')" accept="image/*" style="display: none;" />
  <UploadSuccessModal v-if="showSuccessModal" @close="closeSuccessModal" />
  
  <SettingsMenu v-if="isSettingsMenuOpen" @close="isSettingsMenuOpen = false" />
</template>

<style scoped>
.loading-page { text-align: center; padding: 3rem; color: #a0a0a0; }
.profile-layout { max-width: 900px; margin: 0 auto; padding: 0 20px 40px; }
.profile-content { margin-top: 1.5rem; }
.content-box { background-color: #2a2a2a; border: 1px solid #363636; border-radius: 12px; max-height: 60vh; overflow-y: auto; padding: 1.5rem; }
.content-box::-webkit-scrollbar { width: 0 !important; }
.loading-content, .empty-state { text-align: center; padding: 2rem; color: #a0a0a0; }
.comments-list { display: flex; flex-direction: column; gap: 1rem; }
.comment-item { background-color: #1a1a1a; border-radius: 8px; padding: 1rem 1.5rem; border: 1px solid #363636; }
.comment-text { color: #e0e0e0; font-style: italic; margin: 0 0 1rem 0; }
.comment-footer { display: flex; justify-content: space-between; align-items: center; }
.comment-timestamp { font-size: 0.8rem; color: #a0a0a0; }
.go-to-post-btn { background-color: #374151; color: #e0e0e0; border: none; border-radius: 999px; padding: 0.5rem 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease; }
.go-to-post-btn:hover { background-color: #4f46e5; color: #fff; transform: scale(1.05); }
.go-to-post-btn:hover svg { transform: translateX(4px); }
.go-to-post-btn svg { transition: transform 0.2s ease; }
.sentinel { height: 10px; }
.loading-more { display: flex; justify-content: center; padding: 1rem; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>