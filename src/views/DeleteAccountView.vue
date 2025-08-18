<script setup lang="ts">
import { ref } from 'vue';
import { auth } from '../firebase/config';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'vue-router';

const confirmText = ref('');
const errorMsg = ref('');
const isLoading = ref(false);
const router = useRouter();

const handleDelete = async () => {
  if (confirmText.value !== 'ELIMINA') {
    errorMsg.value = 'Scrivi "ELIMINA" per confermare.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';
  const user = auth.currentUser;

  if (user) {
    try {
      // Questa funzione elimina l'utente da Firebase Auth.
      // La Cloud Function che abbiamo scritto si occuperà di pulire i suoi dati.
      await deleteUser(user);
      router.push('/'); // Reindirizza alla home dopo l'eliminazione
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        errorMsg.value = 'Questa operazione è sensibile. Effettua nuovamente il login e riprova.';
      } else {
        errorMsg.value = 'Si è verificato un errore. Riprova.';
      }
      isLoading.value = false;
    }
  }
};
</script>

<template>
  <div class="settings-page">
    <div class="settings-card delete-card">
      <h3>Elimina Account</h3>
      <p class="warning-text">
        <strong>Attenzione:</strong> questa azione è definitiva e non può essere annullata. Tutti i tuoi post, commenti e dati verranno eliminati in modo permanente.
      </p>
      <div class="input-group">
        <label for="confirm">Per confermare, scrivi "ELIMINA" nel campo qui sotto.</label>
        <input id="confirm" type="text" v-model="confirmText" />
      </div>
      <button @click="handleDelete" :disabled="isLoading || confirmText !== 'ELIMINA'" class="delete-btn">
        {{ isLoading ? 'Eliminazione in corso...' : 'Elimina il mio account definitivamente' }}
      </button>
      <p v-if="errorMsg" class="message error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.settings-page { max-width: 800px; margin: 2rem auto; padding: 1rem; }
.settings-card { background-color: #2a2a2a; padding: 2rem; border-radius: 12px; }
.delete-card { border: 1px solid #ef4444; }
h3 { color: #d1d5db; text-align: center; margin-bottom: 1rem; }
.warning-text { text-align: center; color: #facc15; margin-bottom: 1.5rem; line-height: 1.6; }
.input-group { margin: 1rem 0; }
label { display: block; margin-bottom: 0.5rem; }
input { width: 100%; padding: 0.75rem; border-radius: 4px; border: 1px solid #555; background-color: #1a1a1a; color: #fff; font-size: 1rem; box-sizing: border-box; }
.delete-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: #ef4444;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.delete-btn:hover { background-color: #dc2626; }
.delete-btn:disabled { background-color: #b91c1c; cursor: not-allowed; opacity: 0.7; }
.message.error { color: #ef4444; margin-top: 1rem; text-align: center; font-weight: bold; }
</style>