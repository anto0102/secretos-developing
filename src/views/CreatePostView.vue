<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase/config';
// Importiamo le funzioni che ci servono per leggere un singolo documento
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const postText = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const submitPost = async () => {
  if (postText.value.trim() === '') {
    errorMsg.value = "Il post non può essere vuoto.";
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    errorMsg.value = "Devi aver effettuato l'accesso per poter pubblicare.";
    return;
  }
  
  isLoading.value = true;
  errorMsg.value = '';

  try {
    // --- 1. RECUPERA L'USERNAME DELL'UTENTE ---
    // Creiamo un riferimento al documento dell'utente nella collezione 'users'
    const userDocRef = doc(db, "users", user.uid);
    // Leggiamo i dati di quel documento
    const userDocSnap = await getDoc(userDocRef);

    let authorUsername = 'Anonimo'; // Valore di default
    if (userDocSnap.exists()) {
      // Se il documento esiste, prendiamo il campo 'username'
      authorUsername = userDocSnap.data().username;
    } else {
      // Questo non dovrebbe succedere se la registrazione è andata a buon fine
      console.error("Nessun documento utente trovato per l'utente loggato!");
    }

    // --- 2. SALVA IL POST CON L'USERNAME CORRETTO ---
    await addDoc(collection(db, "posts"), {
      text: postText.value,
      author: authorUsername,   // <-- Usiamo l'username che abbiamo recuperato
      authorId: user.uid,
      score: 0,
      commentsCount: 0,
      createdAt: serverTimestamp()
    });
    
    router.push('/');

  } catch (error) {
    console.error("Errore durante la creazione del post:", error);
    errorMsg.value = "C'è stato un problema durante la pubblicazione del post.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="create-post-container">
    <div class="create-post-box">
      <h2>Crea un nuovo post</h2>
      <form @submit.prevent="submitPost">
        <textarea
          v-model="postText"
          placeholder="Scrivi qui il tuo segreto..."
          rows="8"
        ></textarea>
        <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Pubblicazione...' : 'Pubblica' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Gli stili rimangono invariati */
.create-post-container { display: flex; justify-content: center; padding: 2rem; }
.create-post-box { width: 100%; max-width: 600px; }
h2 { margin-bottom: 1.5rem; }
textarea { width: 100%; padding: 0.75rem; border-radius: 4px; border: 1px solid #555; background-color: #2a2a2a; color: #fff; font-size: 1rem; resize: vertical; margin-bottom: 1rem; }
button { width: 100%; padding: 0.75rem; border: none; border-radius: 4px; background-color: #4f46e5; color: #fff; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
button:hover { background-color: #4338ca; }
button:disabled { background-color: #374151; cursor: not-allowed; }
.error-message { color: #ef4444; margin-bottom: 1rem; text-align: center; }
</style>
// ...
// Dentro la funzione submitPost
try {
    await addDoc(collection(db, "posts"), {
      text: postText.value,
      author: authorUsername,
      authorId: user.uid,
      score: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      upvotedBy: [], // <-- AGGIUNGI QUESTO
      downvotedBy: []  // <-- E QUESTO
    });
    
    router.push('/');
// ...