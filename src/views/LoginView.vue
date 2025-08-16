<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';

const router = useRouter();

// Variabili per i campi del form
const email = ref('');
const password = ref('');
const username = ref('');
const errorMsg = ref('');

// --- 1. VARIABILE DI STATO PER GESTIRE LA MODALITÀ ---
// Inizia in modalità 'login' (false)
const isRegisterMode = ref(false);

// Funzione per cambiare modalità
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  // Pulisce i campi e i messaggi di errore quando si cambia modalità
  email.value = '';
  password.value = '';
  username.value = '';
  errorMsg.value = '';
};

// La funzione di login rimane la stessa
const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    errorMsg.value = '';
    router.push('/');
  } catch (error: any) {
    errorMsg.value = "Email o password non validi.";
    console.error(error);
  }
};

// La funzione di registrazione rimane la stessa
const register = async () => {
  if (username.value.trim() === '' || email.value.trim() === '' || password.value.trim() === '') {
    errorMsg.value = "Tutti i campi sono obbligatori.";
    return;
  }
  errorMsg.value = '';
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.value));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      errorMsg.value = "Questo username è già stato scelto. Provane un altro.";
      return;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      username: username.value,
      email: user.email,
      createdAt: new Date()
    });
    router.push('/');
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      errorMsg.value = "Questa email è già registrata.";
    } else {
      errorMsg.value = "Errore durante la registrazione: " + error.message;
    }
    console.error(error);
  }
};

// --- 2. UN'UNICA FUNZIONE CHE DECIDE COSA FARE ---
const handleSubmit = () => {
  if (isRegisterMode.value) {
    register();
  } else {
    login();
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ isRegisterMode ? 'Crea un nuovo account' : 'Accedi' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="isRegisterMode" class="input-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="username" placeholder="Scegli il tuo username" />
        </div>

        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="tua@email.com" />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" placeholder="••••••••" />
        </div>

        <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
        
        <button type="submit" class="submit-btn">
          {{ isRegisterMode ? 'Registrati' : 'Accedi' }}
        </button>
      </form>

      <div class="toggle-mode">
        <span v-if="isRegisterMode">
          Hai già un account? <a @click="toggleMode">Accedi</a>
        </span>
        <span v-else>
          Non hai un account? <a @click="toggleMode">Registrati</a>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Aggiungiamo solo gli stili per il nuovo link di toggle */
.login-container { display: flex; justify-content: center; align-items: center; height: 100%; padding: 2rem; }
.login-box { width: 100%; max-width: 400px; padding: 2rem; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #363636; }
h2 { text-align: center; margin-bottom: 1.5rem; }
.input-group { margin-bottom: 1rem; }
label { display: block; margin-bottom: 0.5rem; color: #a0a0a0; }
input { width: 100%; padding: 0.75rem; border-radius: 4px; border: 1px solid #555; background-color: #1a1a1a; color: #fff; font-size: 1rem; }
.submit-btn { width: 100%; margin-top: 1rem; padding: 0.75rem; border: none; border-radius: 4px; background-color: #4f46e5; color: #fff; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
.submit-btn:hover { background-color: #4338ca; }
.error-message { color: #ef4444; margin-top: 1rem; text-align: center; }
.toggle-mode {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #a0a0a0;
}
.toggle-mode a {
  color: #6d63ff;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}
</style>