<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, updateDoc, collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import BadgeIcon from './BadgeIcon.vue';
import CustomBadgeUploader from './CustomBadgeUploader.vue'; // Import the uploader
import { badges as officialBadgesData } from '../utils/badges';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';

interface CustomBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const props = defineProps<{
  userProfile: any; // Consider creating a strict UserProfile type
  isOwner: boolean;
}>();

const activeTab = ref('official');
const customBadges = ref<CustomBadge[]>([]);
const showUploader = ref(false);
const editingBadge = ref<CustomBadge | null>(null);

let customBadgesUnsubscribe: Unsubscribe | null = null;

const fetchCustomBadges = () => {
  if (!auth.currentUser) return;
  const customBadgesRef = collection(db, 'users', auth.currentUser.uid, 'customBadges');
  customBadgesUnsubscribe = onSnapshot(customBadgesRef, (snapshot) => {
    customBadges.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomBadge));
  });
};

onMounted(() => {
  if (props.isOwner) {
    fetchCustomBadges();
  }
});

onUnmounted(() => {
  if (customBadgesUnsubscribe) {
    customBadgesUnsubscribe();
  }
});

const setPrimaryOfficialBadge = async (badgeId: string) => {
  if (!props.isOwner || !auth.currentUser) return;
  const functions = getFunctions();
  const setBadgeFn = httpsCallable(functions, 'setPrimaryOfficialBadge');
  try {
    const newPrimary = props.userProfile.primaryOfficialBadge === badgeId ? null : badgeId;
    await setBadgeFn({ badgeId: newPrimary });
  } catch (error) {
    console.error("Errore nell'impostare il badge ufficiale primario:", error);
  }
};

const setPrimaryCustomBadge = async (badgeId: string) => {
  if (!props.isOwner || !auth.currentUser) return;
  const functions = getFunctions();
  const setBadgeFn = httpsCallable(functions, 'setPrimaryCustomBadge');
  try {
    const newPrimary = props.userProfile.primaryCustomBadge === badgeId ? null : badgeId;
    await setBadgeFn({ badgeId: newPrimary });
  } catch (error) {
    console.error("Errore nell'impostare il badge personalizzato primario:", error);
  }
};

const handleEditCustomBadge = (badge: CustomBadge) => {
  editingBadge.value = badge;
  showUploader.value = true;
};

const handleDeleteCustomBadge = async (badge: CustomBadge) => {
  if (confirm(`Sei sicuro di voler eliminare il badge "${badge.name}"?`)) {
    try {
      const functions = getFunctions();
      const deleteBadgeFn = httpsCallable(functions, 'deleteCustomBadge');
      await deleteBadgeFn({ badgeId: badge.id });
    } catch (error) {
      console.error("Errore durante l'eliminazione del badge:", error);
      alert("Impossibile eliminare il badge.");
    }
  }
};

const openUploader = () => {
  editingBadge.value = null;
  showUploader.value = true;
};

</script>

<template>
  <div class="badges-container">
    <div class="tabs">
      <button @click="activeTab = 'official'" :class="{ active: activeTab === 'official' }">Ufficiali</button>
      <button @click="activeTab = 'custom'" :class="{ active: activeTab === 'custom' }" v-if="isOwner">Personalizzati</button>
    </div>

    <!-- Official Badges -->
    <div v-if="activeTab === 'official'" class="tab-content">
      <p v-if="!userProfile.badges || userProfile.badges.length === 0">
        Questo utente non ha ancora guadagnato nessun badge ufficiale.
      </p>
      <div v-else class="badges-grid">
        <div
          v-for="badgeId in userProfile.badges"
          :key="badgeId"
          class="badge-item"
          :class="{
            'is-primary': userProfile.primaryOfficialBadge === badgeId,
            'is-selectable': isOwner
          }"
          @click="isOwner && setPrimaryOfficialBadge(badgeId)"
        >
          <BadgeIcon :badge-id="badgeId" :size="48" />
          <span class="badge-name">{{ officialBadgesData[badgeId]?.name || badgeId }}</span>
        </div>
      </div>
      <p v-if="isOwner" class="helper-text">
        Clicca su un badge per impostarlo come primario o per rimuoverlo.
      </p>
    </div>

    <!-- Custom Badges -->
    <div v-if="activeTab === 'custom' && isOwner" class="tab-content">
      <div class="custom-badges-grid">
        <div
          v-for="badge in customBadges"
          :key="badge.id"
          class="badge-item custom-badge"
          :class="{ 
            'is-primary': userProfile.primaryCustomBadge === badge.id,
            'is-selectable': isOwner
          }"
          @click="isOwner && setPrimaryCustomBadge(badge.id)"
        >
          <div class="custom-badge-image-wrapper">
            <img :src="badge.imageUrl" :alt="badge.name" class="custom-badge-image" />
          </div>
          <span class="badge-name">{{ badge.name }}</span>
          <div class="custom-badge-actions">
            <button @click.stop="handleEditCustomBadge(badge)"><Edit :size="16"/></button>
            <button @click.stop="handleDeleteCustomBadge(badge)"><Trash2 :size="16"/></button>
          </div>
        </div>

        <div v-if="customBadges.length < 6" class="upload-badge-slot" @click="openUploader">
            <Plus :size="32"/>
            <span>Carica Badge</span>
        </div>
      </div>
       <p class="helper-text">
        Clicca su un badge per impostarlo come primario. Puoi caricare fino a 6 badge personalizzati.
      </p>
    </div>

    <CustomBadgeUploader 
      v-if="showUploader"
      :badge-to-edit="editingBadge"
      @close="showUploader = false"
    />

  </div>
</template>

<style scoped>
.badges-container {
  width: 100%;
  background-color: #1f1f1f;
  padding: 1.5rem;
  border-radius: 12px;
}
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #363636;
}
.tabs button {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}
.tabs button:hover { color: #fff; }
.tabs button.active {
  color: #fff;
}
.tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #4f46e5;
}

.tab-content { animation: fadeIn 0.5s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.badges-grid, .custom-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
}
.badge-item.is-selectable {
  cursor: pointer;
}
.badge-item.is-selectable:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
}
.badge-item.is-primary {
  border-color: #4f46e5;
  box-shadow: 0 0 15px rgba(79, 70, 229, 0.6);
}
.badge-name {
  font-size: 0.9rem;
  font-weight: bold;
  word-break: break-word;
}
.helper-text {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #a0a0a0;
}

/* Custom Badge Specific Styles */
.custom-badge-image-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1f1f1f;
  border: 2px dashed #444;
}
.custom-badge-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.custom-badge-actions {
  display: flex;
  gap: 0.5rem;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  pointer-events: none; /* Allow hover events to pass through */
}
.custom-badge-actions button {
  background-color: rgba(0,0,0,0.5);
  border: none;
  color: #a0a0a0;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto; /* Make buttons clickable again */
}
.custom-badge-actions button:hover { 
  background-color: rgba(0,0,0,0.8);
  color: #fff;
}

.upload-badge-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 8px;
  border: 2px dashed #444;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.2s ease;
}
.upload-badge-slot:hover {
  border-color: #4f46e5;
  color: #fff;
}

@media (max-width: 768px) {
  .badges-grid, .custom-badges-grid {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 1rem;
    margin: 0 -1.5rem; /* Extend to edges */
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .badges-grid::-webkit-scrollbar, .custom-badges-grid::-webkit-scrollbar {
    display: none;
  }

  .badge-item {
    flex-shrink: 0;
    width: 110px;
  }
  
  .upload-badge-slot {
    flex-shrink: 0;
    width: 110px;
    height: auto; /* Let content define height */
  }
}
</style>
