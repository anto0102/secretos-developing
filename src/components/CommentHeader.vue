<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue';
import { MoreHorizontal, Trash2, ChevronDown } from 'lucide-vue-next';
import { auth } from '../firebase/config';
import { useRouter } from 'vue-router';
import { formatTimeAgo } from '../utils/dateUtils';

const props = defineProps<{
  authorAvatarUrl?: string;
  authorUsername: string;
  authorId: string;
  replyCount?: number;
  areRepliesVisible: boolean;
  createdAt: any;
}>();

const emit = defineEmits(['delete-comment', 'toggle-replies']);
const router = useRouter();

const isMenuOpen = ref(false);
const isOwner = computed(() => auth.currentUser?.uid === props.authorId);

</script>

<template>
  <div class="comment-header-row">
    <div class="author-info">
      <img v-if="authorAvatarUrl" :src="authorAvatarUrl" class="comment-avatar" alt="Avatar">
      <div v-else class="comment-avatar-placeholder"></div>
      <router-link :to="{ name: 'Profile', params: { userId: authorId } }" class="author-link">
        <span class="comment-author">{{ authorUsername }}</span>
      </router-link>
      <span class="comment-timestamp">{{ formatTimeAgo(createdAt) }}</span>
    </div>
    <div class="controls">
      <button v-if="replyCount && replyCount > 0" class="toggle-replies-btn" @click="$emit('toggle-replies', !areRepliesVisible)">
        <span>{{ areRepliesVisible ? 'Nascondi' : `${replyCount} risposte` }}</span>
        <ChevronDown 
          :size="18" 
          class="chevron-icon" 
          :class="{ 'rotated': !areRepliesVisible }"
        />
      </button>

      <div v-if="isOwner" class="menu-container">
        <MoreHorizontal :size="20" class="icon" @click.stop="isMenuOpen = !isMenuOpen" />
        <transition name="fade">
          <div v-if="isMenuOpen" class="dropdown-menu" @mouseleave="isMenuOpen = false">
            <button @click="$emit('delete-comment')" class="menu-item">
              <Trash2 :size="16" />
              <span>Elimina</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-header-row { display: flex; align-items: center; justify-content: space-between; }
.author-info { display: flex; align-items: center; gap: 0.75rem; }
.comment-avatar, .comment-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background-color: #444; }
.author-link { text-decoration: none; }
.comment-author { font-weight: bold; color: #fff; }
.comment-timestamp { font-size: 0.8rem; color: #a0a0a0; }
.controls { display: flex; align-items: center; gap: 0.5rem; }
.icon { cursor: pointer; color: #a0a0a0; }
.menu-container { position: relative; }
.dropdown-menu { position: absolute; top: 100%; right: 0; background-color: #363636; border-radius: 6px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10; width: 150px; }
.menu-item { display: flex; align-items: center; gap: 0.75rem; background: none; border: none; color: #ef4444; padding: 0.5rem; width: 100%; text-align: left; border-radius: 4px; cursor: pointer; font-weight: bold; }
.menu-item:hover { background-color: #4b5563; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
.toggle-replies-btn { background: none; border: none; color: #a0a0a0; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: color 0.2s, background-color 0.2s; }
.toggle-replies-btn:hover { color: #fff; background-color: #363636; }
.chevron-icon { transition: transform 0.3s ease; }
.chevron-icon.rotated { transform: rotate(-90deg); }
</style>