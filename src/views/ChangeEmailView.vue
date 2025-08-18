<script setup lang="ts">
import { ref } from 'vue';
import { auth } from '../firebase/config';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const newEmail = ref('');
const currentPassword = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const isLoading = ref(false);

const changeEmail = async () => {
  isLoading.value = true;
  message.value = '';
  const user = auth.currentUser;

  if (!user || !user.email) {
    messageType.value = 'error';
    message.value = 'Utente non trovato o non loggato con email/password.';
    isLoading.value = false;
    return;
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword.value);

  try {
    // 1. Ri-autentica l'utente per sicurezza
    await reauthenticateWithCredential(user, credential);

    // 2. Se l'autenticazione ha successo, aggiorna l'email
    await updateEmail(user, newEmail.value);

    messageType.value = 'success';
    message.value = 'Email aggiornata! Controlla la tua nuova casella di posta per la verifica.';
    newEmail.value = '';
    currentPassword.value = '';
  } catch (error) {
    messageType.value = 'error';
    if (error.code === 'auth/wrong-password') {
        message.value = 'La password inserita non è corretta.';
    } else if (error.code === 'auth/email-already-in-use') {
        message.value = 'Questa email è già utilizzata da un altro account.';
    } else {
        message.value = 'Errore durante l\'aggiornamento. Riprova.';
    }
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="settings-page">
    <div class="settings-card">
      <h3>Modifica Email</h3>
      <p>Per modificare il tuo indirizzo email, inserisci la tua password attuale per conferma.</p>
      <div class="input-group">
        <label for="newEmail">Nuova Email</label>
        <input id="newEmail" type="email" v-model="newEmail" />
      </div>
      <div class="input-group">
        <label for="currentPassword">Password Attuale</label>
        <input id="currentPassword" type="password" v-model="currentPassword" />
      </div>
      <button @click="changeEmail" :disabled="isLoading || !newEmail || !currentPassword">
        {{ isLoading ? 'Salvataggio...' : 'Cambia Email' }}
      </button>
      <p v-if="message" :class="['message', messageType]">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.settings-page { max-width: 800px; margin: 2rem auto; padding: 1rem; }
.settings-card { background-color: #2a2a2a; padding: 2rem; border-radius: 12px; }
h3 { color: #d1d5db; text-align: center; margin-bottom: 1rem; }
p { text-align: center; color: #a0a0a0; margin-bottom: 1.5rem; }
.input-group { margin: 1rem 0; }
label { display: block; margin-bottom: 0.5rem; }
input { width: 100%; padding: 0.75rem; border-radius: 4px; border: 1px solid #555; background-color: #1a1a1a; color: #fff; font-size: 1rem; box-sizing: border-box;}
button { width: 100%; margin-top: 1rem; padding: 0.75rem; border: none; border-radius: 4px; background-color: #4f46e5; color: #fff; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
button:hover { background-color: #4338ca; }
button:disabled { background-color: #3730a3; cursor: not-allowed; }
.message { margin-top: 1rem; text-align: center; font-weight: bold; }
.message.success { color: #22c55e; }
.message.error { color: #ef4444; }
</style>