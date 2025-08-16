<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

// Definiamo che tipo di dati (props) il componente si aspetta di ricevere
const props = defineProps<{
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  }
}>();

const router = useRouter();

// Funzione per navigare alla pagina del profilo quando si clicca
const goToProfile = () => {
  // --- INIZIO MODIFICA ---
  // Aggiungiamo i "params" con l'id dell'utente, che è obbligatorio per la rotta 'Profile'
  router.push({ name: 'Profile', params: { userId: props.user.id } }); 
  // --- FINE MODIFICA ---
};
</script>

<template>
  <div class="user-card" @click="goToProfile">
    <div class="avatar-container">
      <img v-if="user.avatarUrl" :src="user.avatarUrl" class="avatar-img" alt="Avatar utente">
      <div v-else class="avatar-placeholder"></div>
    </div>
    <div class="user-info">
      <span class="username">{{ user.username }}</span>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #363636;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}
.user-card:hover {
  background-color: #3a3a3a;
  transform: translateY(-2px);
}
.avatar-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #444, #555);
}
.username {
  font-weight: bold;
  font-size: 1.1rem;
  color: #e0e0e0;
}
</style>