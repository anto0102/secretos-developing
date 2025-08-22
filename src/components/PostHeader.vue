<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { MoreHorizontal, Trash2, Pencil, UserCircle, Venus, Mars } from 'lucide-vue-next';
import { auth, db } from '../firebase/config';
import { getDoc, doc } from 'firebase/firestore';
import { type Post } from '../types';
import BadgeIcon from './BadgeIcon.vue';
import ChannelBadge from './ChannelBadge.vue';
import ActionSheetModal from './ActionSheetModal.vue';

const props = defineProps<{
  authorId: string | undefined;
  author: string | undefined;
  authorAvatarUrl: string | undefined;
  authorPrimaryOfficialBadge?: string;
  authorPrimaryCustomBadgeId?: string;
  isAnonymous: boolean | undefined;
  postId: string;
  channel?: string;
}>();

const emit = defineEmits(['delete-post', 'edit-post']);

const router = useRouter();
const isActionSheetOpen = ref(false);
const isOwner = computed(() => auth.currentUser?.uid === props.authorId);
const anonymousPostGender = ref('nonbinary');
const customPrimaryBadgeData = ref<any>(null);

watchEffect(async () => {
    if (props.authorId && props.authorPrimaryCustomBadgeId) {
        try {
            const badgeRef = doc(db, 'users', props.authorId, 'customBadges', props.authorPrimaryCustomBadgeId);
            const badgeSnap = await getDoc(badgeRef);
            customPrimaryBadgeData.value = badgeSnap.exists() ? badgeSnap.data() : null;
        } catch (e) {
            console.error("Error fetching custom badge for post header", e);
            customPrimaryBadgeData.value = null;
        }
    } else {
        customPrimaryBadgeData.value = null;
    }
});

const fetchAnonymousGender = async () => {
  if (props.isAnonymous) {
    const postDocRef = doc(db, 'posts', props.postId);
    const postDocSnap = await getDoc(postDocRef);
    if (postDocSnap.exists()) {
      const postData = postDocSnap.data() as Post;
      if (postData.anonymousAuthorGender) {
        anonymousPostGender.value = postData.anonymousAuthorGender;
      }
    }
  }
};

const anonymousIcon = computed(() => {
    if (anonymousPostGender.value === 'male') return Mars;
    if (anonymousPostGender.value === 'female') return Venus;
    return UserCircle;
});

fetchAnonymousGender();

const postActions = computed(() => [
  {
    label: 'Modifica',
    icon: Pencil,
    action: () => emit('edit-post', props.postId),
  },
  {
    label: 'Elimina',
    icon: Trash2,
    isDestructive: true,
    action: () => emit('delete-post'),
  },
]);

const goToProfile = () => {
  if (!props.isAnonymous) {
    router.push({ name: 'Profile', params: { userId: props.authorId } });
  }
};
</script>

<template>
  <div class="card-header">
    <router-link v-if="authorId && !isAnonymous" :to="{ name: 'Profile', params: { userId: authorId } }" class="author-link">
      <img v-if="authorAvatarUrl" :src="authorAvatarUrl" class="author-avatar" alt="Avatar">
      <div v-else class="author-avatar-placeholder"></div>
      <span class="author">{{ author }}</span>
      <BadgeIcon v-if="authorPrimaryOfficialBadge" :badge-id="authorPrimaryOfficialBadge" :size="18" />
      <div v-if="customPrimaryBadgeData" class="custom-badge-wrapper" :title="customPrimaryBadgeData.name">
          <img :src="customPrimaryBadgeData.imageUrl" class="custom-badge-icon" :alt="customPrimaryBadgeData.name" />
      </div>
    </router-link>
    <div v-else class="author-link is-anonymous-link">
      <component :is="anonymousIcon" :size="24" class="author-avatar is-anonymous-avatar-icon" />
      <span class="author">{{ author }}</span>
    </div>

    <ChannelBadge v-if="channel" :channel-id="channel" />

    <div v-if="isOwner" class="menu-container">
      <MoreHorizontal :size="20" class="icon" @click.stop="isActionSheetOpen = true" />
    </div>
  </div>

  <ActionSheetModal
    :show="isActionSheetOpen"
    :actions="postActions"
    title="Opzioni Post"
    @close="isActionSheetOpen = false"
  />
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
  gap: 0.5rem;
  text-decoration: none;
}
.author-link.is-anonymous-link {
    cursor: default;
}
.author-avatar,
.author-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
}
.author-avatar.is-anonymous-avatar-icon {
    color: #a0a0a0;
}
.author {
  color: #a0a0a0;
  font-size: 1rem;
  font-weight: bold;
  transition: color 0.2s;
}
.author-link:hover .author {
  color: #fff;
}
.menu-container {
  position: relative;
}
.icon {
  color: #a0a0a0;
  cursor: pointer;
}
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