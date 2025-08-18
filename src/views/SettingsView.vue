<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const username = ref('');
const currentUsername = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const isLoading = ref(false);

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      currentUsername.value = userDoc.data().username;
      username.value = currentUsername.value;
    }
  }
});

const updateUsername = async () => {
  isLoading.value = true;
  message.value = '';
  const user = auth.currentUser;
  if (!user || !username.value.trim() || username.value.trim() === currentUsername.value) {
    isLoading.value = false;
    return;
  }

  // Controlla se il nuovo username è già in uso
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where("username", "==", username.value.trim()));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    messageType.value = 'error';
    message.value = 'Username già in uso.';
    isLoading.value = false;
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      username: username.value.trim()
    });
    currentUsername.value = username.value.trim();
    messageType.value = 'success';
    message.value = 'Username aggiornato con successo!';
  } catch (error) {
    messageType.value = 'error';
    message.value = 'Errore durante l\'aggiornamento.';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="settings-page">
    <h1>Preferenze Account</h1>
    <div class="settings-card">
      <h3>Modifica Username</h3>
      <p>Questo nome sarà visibile pubblicamente agli altri utenti.</p>
      <div class="input-group">
        <label for="username">Username</label>
        <input id="username" type="text" v-model="username" />
      </div>
      <button @click="updateUsername" :disabled="isLoading || !username.trim() || username.trim() === currentUsername">
        {{ isLoading ? 'Salvataggio...' : 'Salva Modifiche' }}
      </button>
      <p v-if="message" :class="['message', messageType]">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.settings-page { max-width: 800px; margin: 2rem auto; padding: 1rem; }
.settings-card { background-color: #2a2a2a; padding: 2rem; border-radius: 12px; }
h1, h3 { color: #d1d5db; text-align: center; margin-bottom: 1rem; }
p { text-align: center; color: #a0a0a0; margin-bottom: 1.5rem; }
.input-group { margin: 1rem 0; }
label { display: block; margin-bottom: 0.5rem; }
input { 
  width: 100%; 
  padding: 0.75rem; 
  border-radius: 4px; 
  border: 1px solid #555; 
  background-color: #1a1a1a; 
  color: #fff; 
  font-size: 1rem;
  box-sizing: border-box;
}
button { 
  width: 100%; 
  margin-top: 1rem; 
  padding: 0.75rem; 
  border: none; 
  border-radius: 4px; 
  background-color: #4f46e5; 
  color: #fff; 
  font-weight: bold; 
  cursor: pointer; 
  transition: background-color 0.2s; 
}
button:hover { background-color: #4338ca; }
button:disabled { background-color: #3730a3; cursor: not-allowed; }
.message { margin-top: 1rem; text-align: center; font-weight: bold; }
.message.success { color: #22c55e; }
.message.error { color: #ef4444; }
</style>