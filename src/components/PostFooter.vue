<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle } from 'lucide-vue-next';
import { auth } from '../firebase/config';

const props = defineProps<{
  score: number;
  commentsCount: number;
  upvotedBy: string[];
  downvotedBy: string[];
}>();

const emit = defineEmits(['vote', 'goToPost']);

const isUpvoted = computed(() => auth.currentUser && props.upvotedBy.includes(auth.currentUser.uid));
const isDownvoted = computed(() => auth.currentUser && props.downvotedBy.includes(auth.currentUser.uid));
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
    <div class="comments" @click.stop="emit('goToPost')">
      <MessageCircle :size="20" class="icon" />
      <span>{{ commentsCount }}</span>
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
.comments {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.comments {
  gap: 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}
.comments:hover,
.comments:hover .icon {
  color: #fff;
}
.icon {
  color: #a0a0a0;
  cursor: pointer;
}
.vote-icon {
  transition: color 0.2s, transform 0.2s;
}
.vote-icon:hover {
  transform: scale(1.2);
  color: #fff;
}
.vote-icon.upvoted {
  color: #22c55e;
}
.vote-icon.downvoted {
  color: #ef4444;
}
.score {
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
}
</style>