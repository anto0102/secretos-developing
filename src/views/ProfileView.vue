<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auth, db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProfileHeader from '../components/ProfileHeader.vue';
import AboutTab from '../components/AboutTab.vue';
import UploadSuccessModal from '../components/UploadSuccessModal.vue';

// LA SEZIONE SCRIPT È QUELLA CHE GIÀ FUNZIONAVA E NON È STATA TOCCATA
const user = ref<User | null>(null);
const userProfile = ref<any>(null);
const isLoading = ref(true);
const editingSection = ref<string | null>(null);
const editableData = ref<any>({});
const isUploading = ref<'avatar' | 'banner' | null>(null);
const activeTab = ref<'about' | 'posts' | 'comments'>('about');
const showSuccessModal = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
      fetchUserProfile(currentUser.uid);
    } else {
      isLoading.value = false;
    }
  });
});

const fetchUserProfile = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    userProfile.value = docSnap.data();
    editableData.value = JSON.parse(JSON.stringify(userProfile.value));
  } else {
    console.error("Nessun profilo trovato per questo utente!");
  }
  isLoading.value = false;
};

const handleOpenEditor = (section: string) => {
  editingSection.value = section;
};

const handleSaveChanges = async () => {
  if (!user.value || !editingSection.value) return;
  const userDocRef = doc(db, "users", user.value.uid);
  try {
    const dataToUpdate: { [key: string]: any } = {};
    if (editingSection.value === 'favorites') {
      dataToUpdate.favorites = editableData.value.favorites;
    } else {
      dataToUpdate[editingSection.value] = editableData.value[editingSection.value];
    }
    await updateDoc(userDocRef, dataToUpdate);
    await fetchUserProfile(user.value.uid);
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
  } finally {
    editingSection.value = null;
  }
};

const handleCancelEdit = () => {
  editingSection.value = null;
  editableData.value = JSON.parse(JSON.stringify(userProfile.value));
};

const handleUploadSuccess = async () => {
    await fetchUserProfile(user.value.uid);
    showSuccessModal.value = true;
};
</script>

<template>
  <div v-if="isLoading" class="loading">Caricamento profilo...</div>
  <div v-else-if="userProfile" class="main-wrapper">
    <div class="profile-page">
      <ProfileHeader 
        :user-profile="userProfile"
        :is-uploading="isUploading"
        :active-tab="activeTab"
        @upload-start="isUploading = $event"
        @upload-end="isUploading = null"
        @upload-success="handleUploadSuccess"
        @update:active-tab="activeTab = $event"
      />

      <main class="profile-content">
        <AboutTab 
          v-if="activeTab === 'about'"
          :user-profile="userProfile"
          :editing-section="editingSection"
          v-model:editable-data="editableData"
          @open-editor="handleOpenEditor"
          @save-changes="handleSaveChanges"
          @cancel-edit="handleCancelEdit"
        />

        <div v-if="activeTab === 'posts'" class="tab-content posts-tab">
          <div class="empty-state">
            <h2>Sezione Post in arrivo!</h2>
            <p>Qui potrai visualizzare tutti i post recenti di questo utente.</p>
          </div>
        </div>

        <div v-if="activeTab === 'comments'" class="tab-content comments-tab">
          <div class="empty-state">
            <h2>Sezione Commenti in arrivo!</h2>
            <p>Qui potrai visualizzare gli ultimi commenti dell'utente.</p>
          </div>
        </div>
      </main>

      <UploadSuccessModal v-if="showSuccessModal" @close="showSuccessModal = false" />
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
}
.profile-page {
  padding-bottom: 3rem;
}
.loading {
  text-align: center;
  color: #a0a0a0;
  padding: 3rem;
}
.profile-content {
  padding-left: 1rem;
  padding-right: 1rem;
}
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #a0a0a0;
}
.empty-state h2 {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
}
</style>