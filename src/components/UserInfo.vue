<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, LayoutGrid, MessageSquare, Image, Loader, MoreHorizontal, UserPlus, UserCheck } from 'lucide-vue-next';
import BadgeIcon from './BadgeIcon.vue';

const props = defineProps({
  userProfile: Object,
  isUploading: String,
  activeTab: String,
  isOwner: Boolean,
  authorPrimaryBadge: String,
  isFollowing: Boolean,
  isFollowLoading: Boolean,
  followersCount: Number,
  followingCount: Number,
});

const emit = defineEmits(['triggerFileUpload', 'update:activeTab', 'openSettingsMenu', 'toggle-follow', 'show-follow-list']); // <-- Aggiungi l'evento
const router = useRouter();

const followButtonText = computed(() => {
    if (props.isFollowing) return 'Segui già';
    return 'Segui';
});
</script>

<template>
  <div class="user-info-layout">
    <div class="user-identity">
      <div class="avatar-container">
        <img v-if="userProfile?.avatarUrl" :src="userProfile.avatarUrl" class="avatar-img" alt="User avatar">
        <div v-else class="avatar-placeholder"></div>
        <button v-if="isOwner" @click="emit('triggerFileUpload', 'avatar')" class="edit-btn avatar-edit" :disabled="!!isUploading">
          <Camera :size="18" />
        </button>
        <div v-if="isUploading === 'avatar'" class="upload-overlay">
          <Loader :size="40" class="spinner" />
        </div>
      </div>
      <div class="user-details">
        <div class="username-badge-row">
            <h1 class="username premium-username">{{ userProfile?.username }}</h1>
            <BadgeIcon v-if="userProfile?.primaryBadge" :badge-id="userProfile.primaryBadge" :size="24" />
        </div>
        <div class="stats-container">
            <div class="stat-item" @click="emit('show-follow-list', 'followers')">
                <strong>{{ followersCount }}</strong>
                <span>Follower</span>
            </div>
            <div class="stat-item" @click="emit('show-follow-list', 'following')">
                <strong>{{ followingCount }}</strong>
                <span>Seguiti</span>
            </div>
        </div>
      </div>
    </div>
    
    <div class="actions-row">
        <button v-if="!isOwner" @click="emit('toggle-follow')" class="follow-btn" :class="{ 'is-following': isFollowing }" :disabled="isFollowLoading">
            <Loader v-if="isFollowLoading" :size="16" class="spinner" />
            <UserCheck v-else-if="isFollowing" :size="16" />
            <UserPlus v-else :size="16" />
            <span>{{ followButtonText }}</span>
        </button>
        <div class="nav-buttons-container">
            <button @click="emit('update:activeTab', 'about')" :class="{ active: activeTab === 'about' }">
                <LayoutGrid :size="16" /><span class="button-text">Profilo</span>
            </button>
            <button @click="emit('update:activeTab', 'posts')" :class="{ active: activeTab === 'posts' }">
                <Image :size="16" /><span class="button-text">Post</span>
            </button>
            <button @click="emit('update:activeTab', 'comments')" :class="{ active: activeTab === 'comments' }">
                <MessageSquare :size="16" /><span class="button-text">Commenti</span>
            </button>
            <button v-if="isOwner" @click="emit('openSettingsMenu')" class="settings-btn">
                <MoreHorizontal :size="20" />
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.user-info-layout { display: flex; flex-direction: column; gap: 1rem; }
.user-identity { display: flex; align-items: flex-end; gap: 1.5rem; }
.actions-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.avatar-container { width: 130px; height: 130px; border-radius: 50%; border: 4px solid #1a1a1a; background-color: #1a1a1a; overflow: hidden; position: relative; flex-shrink: 0; }
.user-details { display: flex; flex-direction: column; gap: 0.5rem; padding-bottom: 0.5rem; }
.username-badge-row { display: flex; align-items: center; gap: 0.75rem; }
.username { font-size: 2.25rem; font-weight: 700; margin: 0; line-height: 1; }
.premium-username { background: linear-gradient(to right, #bdbdbd, #e0e0e0, #bdbdbd); background-clip: text; -webkit-background-clip: text; color: transparent; }
.stats-container { display: flex; gap: 1.5rem; color: #a0a0a0; }
.stat-item { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; cursor: pointer; transition: color 0.2s; } /* Aggiunto cursor e transition */
.stat-item:hover { color: #fff; }
.stat-item strong { font-weight: bold; color: #fff; }
.follow-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; background-color: #4f46e5; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; min-width: 120px; }
.follow-btn:hover:not(:disabled) { background-color: #4338ca; transform: scale(1.02); }
.follow-btn.is-following { background-color: #363636; color: #e0e0e0; }
.follow-btn:disabled { cursor: not-allowed; opacity: 0.7; }
.nav-buttons-container { display: flex; gap: 0.5rem; }
.nav-buttons-container button { background-color: #2a2a2a; color: #a0a0a0; border: 1px solid #363636; padding: 0.75rem 1.25rem; border-radius: 999px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; }
.nav-buttons-container button:hover { background-color: #3a3a3a; color: #fff; }
.nav-buttons-container button.active { background-color: #fff; color: #1a1a1a; border-color: #fff; }
.settings-btn { border-radius: 50%; width: 40px; height: 40px; padding: 0.5rem; }
.avatar-img, .avatar-placeholder, .upload-overlay { width: 100%; height: 100%; object-fit: cover; }
.edit-btn { position: absolute; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.6); color: #fff; border: none; border-radius: 50%; cursor: pointer; transition: all 0.2s ease; }
.edit-btn:hover { background-color: rgba(0, 0, 0, 0.8); transform: scale(1.1); }
.avatar-edit { bottom: 0.5rem; right: 0.5rem; width: 36px; height: 36px; }
.upload-overlay { position: absolute; top: 0; left: 0; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 20; }
.spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #fff; width: 40px; height: 40px; animation: spin 1s linear infinite; }
.follow-btn .spinner { width: 16px; height: 16px; border-width: 2px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@media (max-width: 768px) {
    .user-info-layout { align-items: center; }
    .user-identity { flex-direction: column; align-items: center; text-align: center; }
    .actions-row { flex-direction: column; gap: 1rem; width: 100%; }
    .username { font-size: 1.75rem; }
    .nav-buttons-container { width: 100%; }
    .nav-buttons-container button { flex-grow: 1; justify-content: center; }
    .button-text { display: none; }
}
</style>