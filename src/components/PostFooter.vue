<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle, Bookmark, Repeat } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps<{
  score: number;
  commentsCount: number;
  upvotedBy: string[];
  downvotedBy: string[];
  isSaved: boolean;
  repostsCount: number;
  repostedBy: string[]; // New prop
}>();

const emit = defineEmits(['vote', 'goToPost', 'toggle-save', 'repost', 'show-reposts']);

const isUpvoted = computed(() => auth.currentUser && props.upvotedBy.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.downvotedBy.includes(auth.currentUser.uid));
const isReposted = computed(() => auth.currentUser && props.repostedBy.includes(auth.currentUser.uid)); // New computed

</script>

<template>
  <div class="card-footer">
    <div class="voting">
      <ArrowUp
        :size="22"
        class="icon vote-icon"
        :class="{ upvoted: isUpvoted }"
        @click.stop="emit('vote', 'up')"
      />
      <span class="score">{{ score }} punti</span>
      <ArrowDown
        :size="22"
        class="icon vote-icon"
        :class="{ downvoted: isDownvoted }"
        @click.stop="emit('vote', 'down')"
      />
    </div>
    <div class="actions">
      <div class="action-item comments" @click.stop="emit('goToPost')">
        <MessageCircle :size="20" class="icon" />
        <span>{{ commentsCount }}</span>
      </div>
      <div class="action-item reposts">
        <Repeat 
          :size="20" 
          class="icon repost-icon" 
          :class="{ reposted: isReposted }" 
          @click.stop="emit('repost')" 
        />
        <span v-if="repostsCount > 0" @click.stop="emit('show-reposts')" class="repost-count">{{ repostsCount }}</span>
      </div>
      <div class="action-item save" @click.stop="emit('toggle-save')">
        <Bookmark 
          :size="20" 
          class="icon save-icon"
          :class="{ saved: isSaved }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  color: #a0a0a0;
}
.voting,
.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}
.action-item:hover,
.action-item:hover .icon {
  color: #fff;
}
.icon {
  color: #a0a0a0;
  cursor: pointer;
}
.vote-icon, .repost-icon {
  transition: color 0.2s, transform 0.2s;
}
.vote-icon:hover, .repost-icon:hover {
  transform: scale(1.2);
  color: #fff;
}
.vote-icon.upvoted {
  color: #22c55e;
}
.vote-icon.downvoted {
  color: #ef4444;
}
.repost-icon.reposted {
  color: #34d399; /* A green color to indicate reposted */
}
.score {
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
}
.save-icon {
  transition: all 0.2s ease;
}
.save-icon.saved {
  color: #4f46e5;
  fill: #4f46e5;
}
.repost-count {
  cursor: pointer;
}
.repost-count:hover {
  text-decoration: underline;
}
</style>