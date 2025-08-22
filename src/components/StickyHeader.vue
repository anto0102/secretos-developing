<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const props = defineProps<{
  title: string;
  userAvatarUrl?: string;
  userId?: string;
}>();

const router = useRouter();

const goBack = () => {
  router.back();
};

const goToProfile = () => {
  if (props.userId) {
    router.push({ name: 'Profile', params: { userId: props.userId } });
  }
};

</script>

<template>
  <header class="sticky-header">
    <button @click="goBack" class="header-btn back-btn">
      <ArrowLeft :size="22" />
    </button>
    <h1 class="header-title">{{ title }}</h1>
    <button v-if="userAvatarUrl && userId" @click="goToProfile" class="header-btn profile-btn">
      <img :src="userAvatarUrl" alt="User Avatar" class="profile-avatar" />
    </button>
    <div v-else class="btn-placeholder"></div> <!-- Placeholder to keep title centered -->
  </header>
</template>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #363636;
  z-index: 100;
  box-sizing: border-box; /* Ensure padding is calculated correctly */
}

.header-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: #a0a0a0;
  transition: background-color 0.2s;
}

.header-btn:hover {
  background-color: #2a2a2a;
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.btn-placeholder {
  width: 40px;
  height: 40px;
}

@media (max-width: 768px) {
  .sticky-header {
    padding: 0.75rem 1.25rem; /* Increased horizontal padding for mobile */
  }
  .header-btn {
    width: 36px;
    height: 36px;
  }
  .profile-avatar {
    width: 28px;
    height: 28px;
  }
  .btn-placeholder {
    width: 36px;
    height: 36px;
  }
  .header-title {
    font-size: 1rem;
  }
}
</style>
