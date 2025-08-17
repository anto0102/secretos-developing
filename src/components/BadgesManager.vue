<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import BadgeIcon from './BadgeIcon.vue';
import { badges } from '../utils/badges';

const props = defineProps<{
  userProfile: any; // UserProfile type
  isOwner: boolean;
}>();

const handleSetPrimaryBadge = async (badgeId: string) => {
  if (!props.isOwner || !auth.currentUser) return;

  const newPrimaryBadge = props.userProfile.primaryBadge === badgeId ? null : badgeId;

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      primaryBadge: newPrimaryBadge
    });
    // L'aggiornamento sarà visibile grazie al listener in ProfileView
  } catch (error) {
    console.error("Errore nell'impostare il badge primario:", error);
  }
};
</script>

<template>
  <div class="badges-container">
    <p v-if="!userProfile.badges || userProfile.badges.length === 0">
      Questo utente non ha ancora guadagnato nessun badge.
    </p>
    <div v-else class="badges-grid">
      <div
        v-for="badgeId in userProfile.badges"
        :key="badgeId"
        class="badge-item"
        :class="{
          'is-primary': userProfile.primaryBadge === badgeId,
          'is-selectable': isOwner
        }"
        @click="handleSetPrimaryBadge(badgeId)"
      >
        <BadgeIcon :badge-id="badgeId" :size="32" />
        <span class="badge-name">{{ badges[badgeId]?.name || badgeId }}</span>
      </div>
    </div>
    <p v-if="isOwner" class="helper-text">
      Clicca su un badge per impostarlo come primario o per rimuoverlo.
    </p>
  </div>
</template>

<style scoped>
.badges-container {
  width: 100%;
}
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}
.badge-item.is-selectable {
  cursor: pointer;
}
.badge-item.is-selectable:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
}
.badge-item.is-primary {
  border-color: #4f46e5;
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
}
.badge-name {
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
}
.helper-text {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #a0a0a0;
}
</style>