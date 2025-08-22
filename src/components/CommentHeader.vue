<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, watch, watchEffect } from 'vue';
import { MoreHorizontal, Trash2, ChevronDown, UserCircle, Venus, Mars } from 'lucide-vue-next';
import { auth, db } from '../firebase/config';
import { useRouter } from 'vue-router';
import { formatTimeAgo } from '../utils/dateUtils';
import { doc, getDoc } from 'firebase/firestore';
import { type Post } from '../types';
import BadgeIcon from './BadgeIcon.vue';
import ActionSheetModal from './ActionSheetModal.vue';

const props = defineProps<{
  authorAvatarUrl?: string;
  authorUsername: string;
  authorId: string;
  authorPrimaryOfficialBadge?: string;
  authorPrimaryCustomBadgeId?: string;
  replyCount?: number;
  areRepliesVisible: boolean;
  createdAt: any;
  postId: string;
  postIsAnonymous: boolean;
  postAuthorId: string;
}>();

const emit = defineEmits(['delete-comment', 'toggle-replies']);
const router = useRouter();

const isActionSheetOpen = ref(false);
const isOwner = computed(() => auth.currentUser?.uid === props.authorId);
const isOP = computed(() => props.authorId === props.postAuthorId);
const anonymousGender = ref('nonbinary');
const customPrimaryBadgeData = ref<any>(null);

watchEffect(async () => {
    if (props.authorId && props.authorPrimaryCustomBadgeId) {
        try {
            const badgeRef = doc(db, 'users', props.authorId, 'customBadges', props.authorPrimaryCustomBadgeId);
            const badgeSnap = await getDoc(badgeRef);
            customPrimaryBadgeData.value = badgeSnap.exists() ? badgeSnap.data() : null;
        } catch (e) {
            console.error("Error fetching custom badge for comment header", e);
            customPrimaryBadgeData.value = null;
        }
    } else {
        customPrimaryBadgeData.value = null;
    }
});

const showAnonymousAuthor = computed(() => props.postIsAnonymous && isOP.value);

const fetchAnonymousGender = async () => {
    if (showAnonymousAuthor.value) {
        const postDocRef = doc(db, 'posts', props.postId);
        const postDocSnap = await getDoc(postDocRef);
        if (postDocSnap.exists()) {
            const postData = postDocSnap.data() as Post;
            if (postData.anonymousAuthorGender) {
                anonymousGender.value = postData.anonymousAuthorGender;
            }
        }
    }
};

watch(() => props.postId, fetchAnonymousGender, { immediate: true });

const anonymousIcon = computed(() => {
    if (anonymousGender.value === 'male') return Mars;
    if (anonymousGender.value === 'female') return Venus;
    return UserCircle;
});

const commentActions = computed(() => [
  {
    label: 'Elimina',
    icon: Trash2,
    isDestructive: true,
    action: () => emit('delete-comment'),
  },
]);

const goToProfile = () => {
    if (!showAnonymousAuthor.value) {
        router.push({ name: 'Profile', params: { userId: props.authorId } });
    }
};
</script>

<template>
  <div class="comment-header-row">
    <div class="author-info">
      <div v-if="showAnonymousAuthor" class="author-link is-anonymous-link" @click="goToProfile">
        <component :is="anonymousIcon" :size="24" class="comment-avatar is-anonymous-avatar-icon" />
        <span class="comment-author">{{ authorUsername }}</span>
        <span class="op-badge">OP</span>
      </div>
      <router-link v-else :to="{ name: 'Profile', params: { userId: authorId } }" class="author-link">
        <img v-if="authorAvatarUrl" :src="authorAvatarUrl" class="comment-avatar" alt="Avatar">
        <div v-else class="comment-avatar-placeholder"></div>
        <span class="comment-author">{{ authorUsername }}</span>
        <BadgeIcon v-if="authorPrimaryOfficialBadge" :badge-id="authorPrimaryOfficialBadge" :size="18" />
        <div v-if="customPrimaryBadgeData" class="custom-badge-wrapper" :title="customPrimaryBadgeData.name">
            <img :src="customPrimaryBadgeData.imageUrl" class="custom-badge-icon" :alt="customPrimaryBadgeData.name" />
        </div>
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
        <MoreHorizontal :size="20" class="icon" @click.stop="isActionSheetOpen = true" />
      </div>
    </div>
  </div>

  <ActionSheetModal
    :show="isActionSheetOpen"
    :actions="commentActions"
    title="Opzioni Commento"
    @close="isActionSheetOpen = false"
  />
</template>

<style scoped>
.comment-header-row { display: flex; align-items: center; justify-content: space-between; }
.author-info { display: flex; align-items: center; gap: 0.5rem; }
.comment-avatar, .comment-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background-color: #444; }
.comment-avatar.is-anonymous-avatar-icon { color: #a0a0a0; }
.author-link { text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
.author-link.is-anonymous-link { cursor: default; }
.comment-author { font-weight: bold; color: #fff; }
.op-badge { background-color: #4f46e5; color: #fff; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }
.comment-timestamp { font-size: 0.8rem; color: #a0a0a0; }
.controls { display: flex; align-items: center; gap: 0.5rem; }
.icon { cursor: pointer; color: #a0a0a0; }
.menu-container { position: relative; }
.toggle-replies-btn { background: none; border: none; color: #a0a0a0; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.9rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: color 0.2s, background-color 0.2s; }
.toggle-replies-btn:hover { color: #fff; background-color: #363636; }
.chevron-icon { transition: transform 0.3s ease; }
.chevron-icon.rotated { transform: rotate(-90deg); }
.custom-badge-wrapper {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.custom-badge-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}
</style>