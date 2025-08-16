<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { MoreHorizontal, Trash2, Pencil } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps<{
  authorId: string | undefined;
  author: string | undefined;
  authorAvatarUrl: string | undefined;
  isAnonymous: boolean | undefined;
  postId: string;
}>();

const emit = defineEmits(['delete-post', 'edit-post']);

const router = useRouter();
const isMenuOpen = ref(false);
const isOwner = computed(() => auth.currentUser?.uid === props.authorId);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};
</script>

<template>
  <div class="card-header">
    <router-link v-if="authorId && !isAnonymous" :to="{ name: 'Profile', params: { userId: authorId } }" class="author-link">
      <img v-if="authorAvatarUrl" :src="authorAvatarUrl" class="author-avatar" alt="Avatar">
      <div v-else class="author-avatar-placeholder"></div>
      <span class="author">{{ author }}</span>
    </router-link>
    <div v-else class="author-link">
      <div class="author-avatar-placeholder"></div>
      <span class="author">{{ author }}</span>
    </div>

    <div v-if="isOwner" class="menu-container">
      <MoreHorizontal :size="20" class="icon" @click.stop="toggleMenu" />
      <transition name="fade">
        <div v-if="isMenuOpen" class="dropdown-menu" @mouseleave="isMenuOpen = false">
          <button @click="emit('edit-post')" class="menu-item edit-item">
            <Pencil :size="16" /><span>Modifica</span>
          </button>
          <button @click="emit('delete-post')" class="menu-item delete-item">
            <Trash2 :size="16" /><span>Elimina</span>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.author-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}
.author-avatar,
.author-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #444;
}
.author {
  color: #a0a0a0;
  font-size: 0.9rem;
  font-weight: bold;
  transition: color 0.2s;
}
.author-link:hover .author {
  color: #fff;
}
.menu-container {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background-color: #363636;
  border-radius: 6px;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
  width: 150px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  padding: 0.5rem;
  width: 100%;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.menu-item:hover {
  background-color: #4b5563;
}
.edit-item {
  color: #fff;
}
.delete-item {
  color: #ef4444;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.icon {
  color: #a0a0a0;
  cursor: pointer;
}
</style>