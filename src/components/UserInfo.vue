<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, LayoutGrid, MessageSquare, Image, Loader, MoreHorizontal } from 'lucide-vue-next';

const props = defineProps({
  userProfile: Object,
  isUploading: String,
  activeTab: String,
  isOwner: Boolean,
});

const emit = defineEmits(['triggerFileUpload', 'update:activeTab', 'openSettingsMenu']);
const router = useRouter();
</script>

<template>
  <div class="user-info-container">
    <div class="profile-info-content">
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
      <h1 class="username">{{ userProfile?.username }}</h1>
    </div>
    <div class="nav-buttons-container">
      <button @click="emit('update:activeTab', 'about')" :class="{ active: activeTab === 'about' }">
        <LayoutGrid :size="16" />
        <span class="button-text">Profilo</span>
      </button>
      <button @click="emit('update:activeTab', 'posts')" :class="{ active: activeTab === 'posts' }">
        <Image :size="16" />
        <span class="button-text">Post</span>
      </button>
      <button @click="emit('update:activeTab', 'comments')" :class="{ active: activeTab === 'comments' }">
        <MessageSquare :size="16" />
        <span class="button-text">Commenti</span>
      </button>
      <button v-if="isOwner" @click="emit('openSettingsMenu')" class="settings-btn">
        <MoreHorizontal :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Gli stili rimangono invariati, non è necessario copiarli se non li hai modificati */
.user-info-container { display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
.profile-info-content { display: flex; align-items: center; gap: 1.5rem; }
.avatar-container { width: 130px; height: 130px; border-radius: 50%; border: 4px solid #1a1a1a; background-color: #1a1a1a; overflow: hidden; position: relative; }
.username { font-size: 2.25rem; font-weight: 700; color: #d1d5db; margin: 0; }
.nav-buttons-container { display: flex; gap: 0.5rem; }
.nav-buttons-container button { background-color: #2a2a2a; color: #a0a0a0; border: none; padding: 0.75rem 1.25rem; border-radius: 999px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; }
.nav-buttons-container button:hover { background-color: #3a3a3a; color: #fff; }
.nav-buttons-container button.active { background-color: #fff; color: #1a1a1a; }
.nav-buttons-container button.active:hover { transform: scale(1.02); }
.button-text { display: block; }
.settings-btn { background-color: #2a2a2a; color: #a0a0a0; border: none; padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s ease; }
.settings-btn:hover { background-color: #3a3a3a; color: #fff; }
.avatar-placeholder { background: linear-gradient(45deg, #2a2a2a, #3a3a3a); width: 100%; height: 100%; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.edit-btn { display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.6); color: #fff; border: none; border-radius: 50%; cursor: pointer; transition: all 0.2s ease; position: absolute; }
.edit-btn:hover { background-color: rgba(0, 0, 0, 0.8); transform: scale(1.1); }
.avatar-edit { bottom: 0.5rem; right: 0.5rem; width: 36px; height: 36px; }
.upload-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 20; }
.spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #fff; width: 40px; height: 40px; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .user-info-container { flex-direction: column; align-items: center; gap: 1rem; padding-top: 2rem; }
  .profile-info-content { flex-direction: column; text-align: center; gap: 0.5rem; }
  .username { font-size: 1.5rem; }
  .nav-buttons-container { width: 100%; justify-content: center; }
  .nav-buttons-container button { flex-grow: 1; padding: 0.75rem; justify-content: center; }
  .button-text { display: none; }
}
</style>