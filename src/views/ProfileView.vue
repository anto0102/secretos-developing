<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';
// --- ECCO LA CORREZIONE: Aggiunto 'getDoc' alla lista degli import ---
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import ProfileHeader from '../components/ProfileHeader.vue';
import AboutTab from '../components/AboutTab.vue';
import PostCard from '../components/PostCard.vue';
import FollowListModal from '../components/FollowListModal.vue';
import { type Post, type UserProfile } from '../types';
import { Loader, ArrowRight, Grid3x3, Bookmark, Repeat } from 'lucide-vue-next';
import { formatTimeAgo } from '../utils/dateUtils';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '../firebase/config';
import UploadSuccessModal from '../components/UploadSuccessModal.vue';
import SettingsMenu from '../components/SettingsMenu.vue';
import SubNavSlider from '../components/SubNavSlider.vue';

const props = defineProps<{ userId: string }>();
const router = useRouter();

const userProfile = ref<UserProfile | null>(null);
const loggedInUserProfile = ref<UserProfile | null>(null);
const isLoading = ref(true);
const isOwner = computed(() => auth.currentUser && auth.currentUser.uid === props.userId);
const activeTab = ref<'about' | 'posts' | 'comments'>('about');
const postFilter = ref('my_posts'); // my_posts, saved_posts, reposts

const postTabs = computed(() => {
  const tabs = [{ key: 'my_posts', label: 'I miei Post', icon: Grid3x3 }];
  if (isOwner.value) {
    tabs.push({ key: 'saved_posts', label: 'Salvati', icon: Bookmark });
    tabs.push({ key: 'reposts', label: 'Repost', icon: Repeat });
  }
  return tabs;
});

const userPosts = ref<Post[]>([]);
const userComments = ref<any[]>([]);
const isTabLoading = ref(false);

const lastVisibleDoc = ref<DocumentSnapshot | null>(null);
const isMoreLoading = ref(false);
const hasMore = ref(true);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver;
let profileUnsubscribe: (() => void) | null = null;
let loggedInUserUnsubscribe: (() => void) | null = null;

const editingSection = ref<string | null>(null);
const editableData = ref<any>({});

const isUploading = ref<string | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const bannerInputRef = ref<HTMLInputElement | null>(null);
const showSuccessModal = ref(false);
const isSettingsMenuOpen = ref(false);

const isFollowModalOpen = ref(false);
const followModalTitle = ref('');
const usersToShow = ref<UserProfile[]>([]);
const isFollowModalLoading = ref(false);

const enrichPostsWithAuthors = async (postsData: Post[]): Promise<Post[]> => {
    const authorIds = [...new Set(postsData.map(post => post.authorId).filter(Boolean))];
    if (authorIds.length === 0) return postsData;

    const userDocs = await Promise.all(authorIds.map(id => getDoc(doc(db, "users", id))));
    const authorProfileMap = new Map<string, UserProfile>();
    userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
          authorProfileMap.set(userDoc.id, userDoc.data() as UserProfile);
        }
    });
    return postsData.map(post => ({
      ...post,
      authorProfile: authorProfileMap.get(post.authorId),
    }));
};

const showFollowList = async (type: 'followers' | 'following') => {
    if (!userProfile.value) return;

    isFollowModalOpen.value = true;
    isFollowModalLoading.value = true;
    usersToShow.value = [];
    followModalTitle.value = type === 'followers' ? 'Follower' : 'Seguiti';
    
    const userIds = (userProfile.value as any)[type] || [];

    try {
        if (userIds.length > 0) {
            const userDocsPromises = userIds.slice(0, 30).map((id: string) => getDoc(doc(db, "users", id)));
            const userDocsSnapshots = await Promise.all(userDocsPromises);
            
            usersToShow.value = userDocsSnapshots
                .filter(snap => snap.exists())
                .map(snap => ({ id: snap.id, ...snap.data() } as UserProfile));
        }
    } catch (error) {
        console.error("Errore nel caricare la lista di utenti:", error);
    } finally {
        isFollowModalLoading.value = false;
    }
};

const isFollowLoading = ref(false); 

const isFollowing = computed(() => {
  if (!loggedInUserProfile.value || !loggedInUserProfile.value.following) return false;
  return loggedInUserProfile.value.following.includes(props.userId);
});

const followersCount = computed(() => userProfile.value?.followers?.length || 0);
const followingCount = computed(() => userProfile.value?.following?.length || 0);

const toggleFollow = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || isOwner.value || isFollowLoading.value) return;

    isFollowLoading.value = true;
    try {
        const functions = getFunctions();
        const toggleFollowCallable = httpsCallable(functions, 'toggleFollow');
        await toggleFollowCallable({ userId: props.userId });
    } catch (error) {
        console.error("Errore durante l'operazione di follow:", error);
    } finally {
        isFollowLoading.value = false;
    }
};

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
    editingSection.value = null;
  } catch (error) {
    console.error(`Errore durante l'aggiornamento del campo ${field}:`, error);
  }
};

const fetchUserProfile = (uid: string) => {
  if (profileUnsubscribe) profileUnsubscribe();
  if (!uid) { 
    isLoading.value = false; 
    userProfile.value = null; 
    return; 
  }
  isLoading.value = true;
  const docRef = doc(db, "users", uid);
  profileUnsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      userProfile.value = { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
      userProfile.value = null;
    }
    isLoading.value = false;
  }, (error) => {
    console.error("Errore nel fetch del profilo utente:", error);
    isLoading.value = false;
  });
};

const setupLoggedInUserListener = (uid: string | null) => {
    if(loggedInUserUnsubscribe) loggedInUserUnsubscribe();
    if (uid) {
        const userDocRef = doc(db, "users", uid);
        loggedInUserUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                loggedInUserProfile.value = docSnap.data() as UserProfile;
            }
        });
    } else {
        loggedInUserProfile.value = null;
    }
};

const fetchInitialTabData = async (tab: 'posts' | 'comments') => {
  if (!userProfile.value) return;
  isTabLoading.value = true;
  hasMore.value = true;
  lastVisibleDoc.value = null;
  userPosts.value = [];
  userComments.value = [];

  if (tab === 'posts') {
    if (postFilter.value === 'my_posts') {
      let q = query(
        collection(db, 'posts'),
        where("authorId", "==", props.userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      if (!isOwner.value) {
        q = query(q, where("isAnonymous", "==", false));
      }
      const querySnapshot = await getDocs(q);
      lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
      userPosts.value = querySnapshot.docs.map(doc => ({ 
          ...doc.data(), id: doc.id, authorProfile: userProfile.value 
      } as Post));
      if (querySnapshot.empty || querySnapshot.docs.length < 10) hasMore.value = false;

    } else if (postFilter.value === 'saved_posts') {
      const savedPostIds = loggedInUserProfile.value?.savedPosts || [];
      if (savedPostIds.length > 0) {
        const postIdsToFetch = savedPostIds.slice(0, 10);
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("__name__", "in", postIdsToFetch));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
        userPosts.value = await enrichPostsWithAuthors(fetchedPosts);
        if (savedPostIds.length <= 10) hasMore.value = false;
      } else {
        hasMore.value = false;
      }
    } else if (postFilter.value === 'reposts') {
        const q = query(
            collection(db, 'posts'), 
            where("authorId", "==", props.userId),
            where("repostOf", ">", ""), // Hacky way to check for existence
            orderBy("repostOf"), // Firestore requires this for the inequality filter
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
        userPosts.value = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
        if (querySnapshot.empty || querySnapshot.docs.length < 10) hasMore.value = false;
    }
  } else if (tab === 'comments') {
    const q = query(
      collection(db, 'comments'),
      where("authorId", "==", props.userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
    userComments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (querySnapshot.empty || querySnapshot.docs.length < 10) hasMore.value = false;
  }

  isTabLoading.value = false;
  await nextTick();
  setupObserver();
};

const loadMore = async () => {
  if (isMoreLoading.value || !hasMore.value) return;
  isMoreLoading.value = true;

  if (activeTab.value === 'posts') {
    if (postFilter.value === 'my_posts') {
      if (!lastVisibleDoc.value) { isMoreLoading.value = false; return; }
      let q = query(
        collection(db, 'posts'),
        where("authorId", "==", props.userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleDoc.value),
        limit(10)
      );
      if (!isOwner.value) {
        q = query(q, where("isAnonymous", "==", false));
      }
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
        const newPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, authorProfile: userProfile.value } as Post));
        userPosts.value.push(...newPosts);
        if(querySnapshot.docs.length < 10) hasMore.value = false;
      } else {
        hasMore.value = false;
      }
    } else if (postFilter.value === 'saved_posts') {
      const savedPostIds = loggedInUserProfile.value?.savedPosts || [];
      const currentLoadedCount = userPosts.value.length;
      if (savedPostIds.length > currentLoadedCount) {
        const postIdsToFetch = savedPostIds.slice(currentLoadedCount, currentLoadedCount + 10);
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("__name__", "in", postIdsToFetch));
        const querySnapshot = await getDocs(q);
        const newPosts = await enrichPostsWithAuthors(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post)));
        userPosts.value.push(...newPosts);
        if (userPosts.value.length >= savedPostIds.length) hasMore.value = false;
      } else {
        hasMore.value = false;
      }
    } else if (postFilter.value === 'reposts') {
        if (!lastVisibleDoc.value) { isMoreLoading.value = false; return; }
        const q = query(
            collection(db, 'posts'), 
            where("authorId", "==", props.userId),
            where("repostOf", ">", ""),
            orderBy("repostOf"),
            orderBy("createdAt", "desc"),
            startAfter(lastVisibleDoc.value),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
            const newPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
            userPosts.value.push(...newPosts);
            if(querySnapshot.docs.length < 10) hasMore.value = false;
        } else {
            hasMore.value = false;
        }
    }
  } else if (activeTab.value === 'comments') {
    if (!lastVisibleDoc.value) { isMoreLoading.value = false; return; }
    const q = query(
      collection(db, 'comments'),
      where("authorId", "==", props.userId),
      orderBy("createdAt", "desc"),
      startAfter(lastVisibleDoc.value),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastVisibleDoc.value = querySnapshot.docs[querySnapshot.docs.length - 1];
      const newComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      userComments.value.push(...newComments);
      if(querySnapshot.docs.length < 10) hasMore.value = false;
    } else {
      hasMore.value = false;
    }
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

onMounted(() => {
    fetchUserProfile(props.userId);
    auth.onAuthStateChanged(user => {
        setupLoggedInUserListener(user ? user.uid : null);
    });
});
onUnmounted(() => { 
  if (observer) observer.disconnect();
  if (profileUnsubscribe) profileUnsubscribe();
  if (loggedInUserUnsubscribe) loggedInUserUnsubscribe();
});
watch(() => props.userId, (newId) => { 
  activeTab.value = 'about'; 
  postFilter.value = 'my_posts'; // Reset post filter
  fetchUserProfile(newId); 
});
watch(activeTab, (newTab) => {
  if (newTab === 'posts' || newTab === 'comments') {
    fetchInitialTabData(newTab);
  }
});
watch(postFilter, () => {
  if (activeTab.value === 'posts') {
    fetchInitialTabData('posts');
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
      :is-following="isFollowing"
      :is-follow-loading="isFollowLoading"
      :followers-count="followersCount"
      :following-count="followingCount"
      @trigger-file-upload="triggerFileUpload"
      @open-settings-menu="isSettingsMenuOpen = true"
      @toggle-follow="toggleFollow"
      @show-follow-list="showFollowList"
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
          <SubNavSlider 
            :tabs="postTabs"
            :active-tab="postFilter"
            @set-tab="postFilter = $event"
          />
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
  
  <SettingsMenu :show="isSettingsMenuOpen" @close="isSettingsMenuOpen = false" />
  
  <FollowListModal 
    :show="isFollowModalOpen" 
    :title="followModalTitle"
    :users="usersToShow"
    :loading="isFollowModalLoading"
    @close="isFollowModalOpen = false"
  />
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