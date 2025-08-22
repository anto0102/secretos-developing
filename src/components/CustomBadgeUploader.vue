<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auth, storage } from '../firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader, UploadCloud } from 'lucide-vue-next';

interface BadgeData {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
}

const props = defineProps<{
  badgeToEdit?: BadgeData | null;
}>();

const emit = defineEmits(['close']);

const name = ref('');
const description = ref('');
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const isLoading = ref(false);
const errorMsg = ref('');

const isEditMode = !!props.badgeToEdit;

onMounted(() => {
  if (isEditMode && props.badgeToEdit) {
    name.value = props.badgeToEdit.name;
    description.value = props.badgeToEdit.description;
    imagePreviewUrl.value = props.badgeToEdit.imageUrl;
  }
});

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file && (file.type.startsWith('image/gif') || file.type.startsWith('image/png') || file.type.startsWith('image/jpeg'))) {
    selectedFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  } else {
    errorMsg.value = "Per favore, seleziona un file GIF, PNG o JPG.";
  }
};

const handleSubmit = async () => {
  if (!name.value.trim()) {
    errorMsg.value = "Il nome del badge è obbligatorio.";
    return;
  }
  if (!isEditMode && !selectedFile.value) {
    errorMsg.value = "L'immagine del badge è obbligatoria.";
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';

  try {
    let imageUrl = props.badgeToEdit?.imageUrl || '';

    // Upload new image if one is selected
    if (selectedFile.value) {
      const userId = auth.currentUser!.uid;
      const filePath = `users/${userId}/custom_badges/${Date.now()}_${selectedFile.value.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, selectedFile.value);
      imageUrl = await getDownloadURL(fileRef);
      // Note: Deleting the old image if it's an edit is handled in the backend to prevent orphaned files if the function fails.
    }

    const functions = getFunctions();
    if (isEditMode) {
      const updateCustomBadge = httpsCallable(functions, 'updateCustomBadge');
      await updateCustomBadge({ 
        badgeId: props.badgeToEdit!.id,
        name: name.value,
        description: description.value,
        // The backend currently doesn't support updating the image, but this is how you would pass it.
      });
    } else {
      const createCustomBadge = httpsCallable(functions, 'createCustomBadge');
      await createCustomBadge({
        name: name.value,
        description: description.value,
        imageUrl: imageUrl,
      });
    }

    emit('close');
  } catch (error: any) {
    console.error("Errore durante il salvataggio del badge:", error);
    errorMsg.value = error.message || "Si è verificato un errore.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <h3>{{ isEditMode ? 'Modifica Badge' : 'Carica Nuovo Badge' }}</h3>
      
      <form @submit.prevent="handleSubmit">
        <div class="file-uploader" @click="($refs.fileInput as HTMLInputElement).click()">
          <input type="file" ref="fileInput" @change="handleFileSelect" accept=".gif,.png,.jpg,.jpeg" style="display: none;"/>
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="Anteprima Badge" class="image-preview"/>
          <div v-else class="upload-placeholder">
            <UploadCloud :size="48" />
            <p>Trascina un file o clicca per caricare (GIF, PNG, JPG)</p>
          </div>
        </div>

        <div class="input-group">
          <label for="badge-name">Nome *</label>
          <input id="badge-name" type="text" v-model="name" maxlength="30"/>
        </div>

        <div class="input-group">
          <label for="badge-desc">Descrizione</label>
          <textarea id="badge-desc" v-model="description" maxlength="100"></textarea>
        </div>

        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

        <div class="actions">
          <button type="button" @click="emit('close')" class="btn-secondary" :disabled="isLoading">Annulla</button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            <Loader v-if="isLoading" :size="20" class="spinner" />
            <span v-else>{{ isEditMode ? 'Salva Modifiche' : 'Crea Badge' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}
.modal-container {
  background-color: #2a2a2a;
  color: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px; /* Adjusted max-width */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.file-uploader {
  border: 2px dashed #555;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.2s;
}
.file-uploader:hover { border-color: #4f46e5; }
.image-preview {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
}
.upload-placeholder { color: #a0a0a0; }

.input-group { margin-bottom: 1rem; }
.input-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
.input-group input, .input-group textarea {
  width: 100%;
  background-color: #1f1f1f;
  border: 1px solid #363636;
  color: #fff;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.error-message { color: #ef4444; margin-bottom: 1rem; text-align: center; }

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-primary {
  background-color: #4f46e5;
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background-color: #4338ca; }
.btn-secondary {
  background-color: #363636;
  color: #fff;
}
.btn-secondary:hover:not(:disabled) { background-color: #444; }
button:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
