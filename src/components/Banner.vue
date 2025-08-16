<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { Camera, Loader } from 'lucide-vue-next';

const props = defineProps({
  bannerUrl: String,
  isUploading: String,
  isOwner: Boolean, // Riceviamo la prop
});

const emit = defineEmits(['triggerFileUpload']);
</script>

<template>
  <div class="banner-container">
    <img v-if="bannerUrl" :src="bannerUrl" class="banner-img" alt="User banner">
    <div v-else class="banner-placeholder"></div>
    <button v-if="isOwner" @click="emit('triggerFileUpload', 'banner')" class="edit-btn banner-edit" :disabled="!!isUploading">
      <Camera :size="20" />
    </button>
    <div v-if="isUploading === 'banner'" class="upload-overlay">
      <Loader :size="40" class="spinner" />
    </div>
  </div>
</template>

<style scoped>
.banner-container {
  height: 250px;
  background-color: #333;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.banner-placeholder {
  background: linear-gradient(45deg, #2a2a2a, #3a3a3a);
  width: 100%;
  height: 100%;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
}
.edit-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
.banner-edit {
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
}
.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>