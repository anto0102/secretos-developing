<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Banner from './Banner.vue';
import UserInfo from './UserInfo.vue';

const props = defineProps({
  userProfile: Object,
  isUploading: String,
  activeTab: String,
  isOwner: Boolean,
});

const emit = defineEmits(['triggerFileUpload', 'update:activeTab']);

const handleTriggerFileUpload = (type: string) => {
    emit('triggerFileUpload', type);
};

const handleUpdateActiveTab = (tab: string) => {
    emit('update:active-tab', tab);
};
</script>

<template>
  <header class="profile-header">
    <Banner
      :banner-url="userProfile?.bannerUrl"
      :is-uploading="isUploading"
      :is-owner="isOwner" @trigger-file-upload="handleTriggerFileUpload"
    />
    
    <div class="user-info-wrapper">
        <UserInfo
            :user-profile="userProfile"
            :is-uploading="isUploading"
            :active-tab="activeTab"
            :is-owner="isOwner" @trigger-file-upload="handleTriggerFileUpload"
            @update:active-tab="handleUpdateActiveTab"
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
    margin-top: -65px;
    position: relative;
}
</style>