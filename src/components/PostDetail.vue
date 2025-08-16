<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-vue-next';
import { type Post } from '../types';
import { auth } from '../firebase/config';

const props = defineProps<{ post: Post }>();
const emit = defineEmits(['vote', 'delete-post']);

const isMenuOpen = ref(false);

const isOwner = computed(() => auth.currentUser?.uid === props.post?.authorId);
const isUpvoted = computed(() => auth.currentUser && props.post.upvotedBy?.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.post.downvotedBy?.includes(auth.currentUser.uid));

const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };
</script>

<template>
  <div class="post-detail-card">
    <div class="card-header">
      <span class="author">{{ post.author }}</span>
      <div class="actions">
        <div v-if="isOwner" class="menu-container">
          <MoreHorizontal :size="20" class="icon" @click.stop="toggleMenu" />
          <transition name="fade">
            <div v-if="isMenuOpen" class="dropdown-menu">
              <button @click="emit('delete-post')" class="menu-item">
                <Trash2 :size="16" />
                <span>Elimina</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <p class="card-text">{{ post.text }}</p>
    <div class="card-footer">
      <div class="voting">
        <ArrowUp 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'upvoted': isUpvoted }"
          @click="emit('vote', 'up')" 
        />
        <span class="score">{{ post.score }} punti</span>
        <ArrowDown 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'downvoted': isDownvoted }"
          @click="emit('vote', 'down')" 
        />
      </div>
      <div class="comments-count">
        <MessageCircle :size="20" class="icon" />
        <span>{{ post.commentsCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail-card {
  background-color: #2a2a2a; border-radius: 12px; padding: 1.5rem;
  margin-bottom: 2rem; border: 1px solid #363636;
}
.card-header, .card-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem; color: #a0a0a0; font-size: 0.9rem;
}
.author { font-size: 1.25rem; font-weight: bold; color: #fff; }
.card-text { color: #e0e0e0; line-height: 1.6; font-size: 1rem; white-space: pre-wrap; margin-top: 1rem; }
.voting, .comments-count { display: flex; align-items: center; gap: 0.75rem; }
.score { font-weight: bold; font-size: 1rem; min-width: 60px; text-align: center; }
.icon { cursor: pointer; transition: color 0.2s; }
.icon:hover { color: #fff; }
.vote-icon:hover { transform: scale(1.1); }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }

.menu-container { position: relative; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0; background-color: #363636;
  border-radius: 6px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10; width: 150px;
}
.menu-item {
  display: flex; align-items: center; gap: 0.75rem; background: none; border: none;
  color: #ef4444; padding: 0.5rem; width: 100%; text-align: left;
  border-radius: 4px; cursor: pointer; font-weight: bold;
}
.menu-item:hover { background-color: #4b5563; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>