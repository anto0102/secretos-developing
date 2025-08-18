<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Banner from './Banner.vue';
import UserInfo from './UserInfo.vue';

const props = defineProps({
  userProfile: Object,
  isUploading: String,
  activeTab: String,
  isOwner: Boolean,
  isFollowing: Boolean,
  isFollowLoading: Boolean,
  followersCount: Number,
  followingCount: Number,
});

const emit = defineEmits(['triggerFileUpload', 'update:activeTab', 'openSettingsMenu', 'toggle-follow', 'show-follow-list']); // <-- Aggiungi l'evento

const handleTriggerFileUpload = (type: string) => {
    emit('triggerFileUpload', type);
};

const handleUpdateActiveTab = (tab: string) => {
    emit('update:activeTab', tab);
};

// --- NUOVA FUNZIONE PER PASSARE L'EVENTO ---
const handleShowFollowList = (type: 'followers' | 'following') => {
    emit('show-follow-list', type);
}
</script>

<template>
  <header class="profile-header">
    <Banner
      :banner-url="userProfile?.bannerUrl"
      :is-uploading="isUploading"
      :is-owner="isOwner"
      @trigger-file-upload="handleTriggerFileUpload"
    />
    
    <div class="user-info-wrapper">
      <UserInfo
        :user-profile="userProfile"
        :is-uploading="isUploading"
        :active-tab="activeTab"
        :is-owner="isOwner"
        :is-following="isFollowing"
        :is-follow-loading="isFollowLoading"
        :followers-count="followersCount"
        :following-count="followingCount"
        @trigger-file-upload="handleTriggerFileUpload"
        @update:active-tab="handleUpdateActiveTab"
        @open-settings-menu="emit('openSettingsMenu')"
        @toggle-follow="emit('toggle-follow')"
        @show-follow-list="handleShowFollowList" 
      />
    </div>
  </header>
</template>

<style scoped>
.profile-header {
  position: relative;
  margin-bottom: 2rem;
}
.user-info-wrapper {
    margin-top: -80px; 
    position: relative;
    padding: 0 1rem;
}
</style>