<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import ProfileHeader from '../components/ProfileHeader.vue';
import AboutTab from '../components/AboutTab.vue';
import PostCard from '../components/PostCard.vue';
import { type Post } from '../types';

const props = defineProps<{ userId: string }>();

const userProfile = ref<any>(null);
const isLoading = ref(true);
const isOwner = computed(() => auth.currentUser && auth.currentUser.uid === props.userId);
const activeTab = ref<'about' | 'posts' | 'comments'>('about');
const userPosts = ref<Post[]>([]);
const isTabLoading = ref(false);

const fetchUserProfile = async (uid: string) => {
  if (!uid) { isLoading.value = false; userProfile.value = null; return; }
  isLoading.value = true;
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  userProfile.value = docSnap.exists() ? docSnap.data() : null;
  isLoading.value = false;
};

onMounted(() => fetchUserProfile(props.userId));
watch(() => props.userId, (newId) => fetchUserProfile(newId));

watch(activeTab, async (newTab) => {
  if (!userProfile.value || newTab !== 'posts') return;
  isTabLoading.value = true;
  const q = query(collection(db, "posts"), where("authorId", "==", props.userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  userPosts.value = querySnapshot.docs.map(doc => ({ 
      ...doc.data(), id: doc.id, authorAvatarUrl: userProfile.value.avatarUrl 
  } as Post));
  isTabLoading.value = false;
});
</script>

<template>
  <div v-if="isLoading" class="loading">Caricamento...</div>
  <div v-else-if="userProfile" class="main-wrapper">
    <ProfileHeader :user-profile="userProfile" :is-owner="isOwner" v-model:active-tab="activeTab" />
    <main class="profile-content">
      <AboutTab v-if="activeTab === 'about'" :user-profile="userProfile" :is-owner="isOwner" />
      <div v-if="activeTab === 'posts'">
         <div v-if="isTabLoading" class="loading">...</div>
         <div v-else-if="userPosts.length > 0">
            <PostCard v-for="post in userPosts" :key="post.id" :post="post" />
         </div>
         <div v-else class="empty-state"><h3>Nessun post</h3></div>
      </div>
    </main>
  </div>
  <div v-else class="loading">Profilo non trovato.</div>
</template>

<style scoped>
.main-wrapper { max-width: 900px; margin: 0 auto; padding: 0 20px; }
.loading { text-align: center; padding: 3rem; }
/* ...altri stili... */
</style>