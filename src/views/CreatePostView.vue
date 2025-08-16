<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Loader, ArrowLeft, Settings, Image as ImageIcon, X, Bold, EyeOff } from 'lucide-vue-next';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const router = useRouter();
const postText = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const currentUser = ref<{ username: string; avatarUrl: string; birthdate?: string; gender?: string; } | null>(null);

const isSettingsOpen = ref(false);
const isAnonymous = ref(false);
const isPoll = ref(false);
const isMediaSpoiler = ref(false);
const pollOptions = ref([ { text: '' }, { text: '' } ]);
const pollSettings = ref({
  voteType: 'single',
  resultsVisibility: 'always',
  voteVisibility: 'public'
});

const MAX_CHARS = 500;
const MAX_POLL_OPTIONS = 5;

const selectedMediaFile = ref<File | null>(null);
const mediaPreviewUrl = ref<string | null>(null);
const mediaType = ref<'image' | 'video' | null>(null);
const mediaInputRef = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (isPoll.value) return;
  mediaInputRef.value?.click();
};

const handleMediaSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    selectedMediaFile.value = file;
    mediaPreviewUrl.value = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      mediaType.value = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType.value = 'video';
    } else {
      mediaType.value = null;
    }
  }
};

const clearMedia = () => {
  selectedMediaFile.value = null;
  mediaPreviewUrl.value = null;
  mediaType.value = null;
  isMediaSpoiler.value = false;
  if (mediaInputRef.value) {
    mediaInputRef.value.value = '';
  }
};

const applyMarkdown = (syntax: string) => {
  const textarea = document.querySelector('textarea');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = postText.value.substring(start, end);
  const newText = postText.value.substring(0, start) + syntax + selectedText + syntax + postText.value.substring(end);
  postText.value = newText;
};

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      currentUser.value = {
        username: data.username,
        avatarUrl: data.avatarUrl,
        birthdate: data.birthdate,
        gender: data.gender
      };
    }
  }
});

const calculateAge = (birthdate: string): number | null => {
  if (!birthdate) return null;
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const authorName = computed(() => {
  if (isAnonymous.value && currentUser.value) {
    const age = currentUser.value.birthdate ? `di ${calculateAge(currentUser.value.birthdate)} anni` : '';
    let gender = '';
    if (currentUser.value.gender === 'male') gender = 'Uomo';
    else if (currentUser.value.gender === 'female') gender = 'Donna';
    else gender = 'Persona';
    return `${gender} ${age}`.trim();
  }
  return currentUser.value?.username || 'Utente';
});

const charsRemaining = computed(() => MAX_CHARS - postText.value.length);

const isFormValid = computed(() => {
  const textLen = postText.value.trim().length;
  const isTextValid = textLen > 0 && textLen <= MAX_CHARS;

  if (isPoll.value) {
    const validOptions = pollOptions.value.filter(opt => opt.text.trim() !== '');
    return isTextValid && validOptions.length >= 2;
  }
  
  return isTextValid || selectedMediaFile.value;
});

const addPollOption = () => {
  if (pollOptions.value.length < MAX_POLL_OPTIONS) {
    pollOptions.value.push({ text: '' });
  }
};
const removePollOption = (index: number) => {
  if (pollOptions.value.length > 2) {
    pollOptions.value.splice(index, 1);
  }
};

watch(isPoll, (newVal) => {
  if (newVal) {
    clearMedia();
  } else {
    pollOptions.value = [{ text: '' }, { text: '' }];
  }
});
watch(selectedMediaFile, (newVal) => {
    if (!newVal) {
        isMediaSpoiler.value = false;
    }
});
watch(isMediaSpoiler, (newVal) => {
    if (newVal) {
        isPoll.value = false;
    }
});

const submitPost = async () => {
  if (!isFormValid.value) return;
  const user = auth.currentUser;
  if (!user || !currentUser.value) {
    errorMsg.value = "Devi essere loggato per pubblicare.";
    return;
  }
  
  isLoading.value = true;
  errorMsg.value = '';

  let mediaUrl = null;
  if (selectedMediaFile.value) {
    const filePath = `posts/${user.uid}/${Date.now()}_${selectedMediaFile.value.name}`;
    const fileRef = storageRef(storage, filePath);
    try {
      await uploadBytes(fileRef, selectedMediaFile.value);
      mediaUrl = await getDownloadURL(fileRef);
    } catch (e) {
      console.error("Errore nel caricamento del media:", e);
      errorMsg.value = "C'è stato un problema durante il caricamento del media.";
      isLoading.value = false;
      return;
    }
  }

  try {
    const postData: any = {
      text: postText.value,
      author: authorName.value,
      authorId: user.uid,
      isAnonymous: isAnonymous.value,
      score: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      upvotedBy: [],
      downvotedBy: [],
      mediaUrl: mediaUrl,
      mediaType: mediaType.value,
      isMediaSpoiler: isMediaSpoiler.value
    };

    if (isPoll.value) {
      postData.isPoll = true;
      postData.pollOptions = pollOptions.value
        .filter(opt => opt.text.trim() !== '')
        .map(opt => ({ text: opt.text, votes: 0, votedBy: [] }));
      postData.pollSettings = pollSettings.value;
    }

    await addDoc(collection(db, "posts"), postData);
    
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
  <div class="page-wrapper">
    <div class="create-post-container" :class="{ 'settings-open': isSettingsOpen }">
      <header class="main-header">
        <button @click="router.back()" class="header-btn"><ArrowLeft :size="22" /></button>
        <h1 class="page-title">Nuovo Post</h1>
        <button @click="isSettingsOpen = !isSettingsOpen" class="header-btn" :class="{ active: isSettingsOpen }"><Settings :size="22" /></button>
      </header>
      
      <div class="content-body">
        <div v-if="currentUser" class="user-header">
          <img :src="currentUser.avatarUrl" class="avatar" alt="User avatar">
          <span class="username">{{ authorName }}</span>
        </div>
        
        <form @submit.prevent="submitPost">
          <div class="textarea-wrapper">
            <textarea
              v-model="postText"
              :placeholder="isPoll ? 'Qual è la tua domanda?' : 'Scrivi qui...'"
              :maxlength="MAX_CHARS"
            ></textarea>
            <div class="markdown-toolbar">
                <button type="button" @click="applyMarkdown('**')"><Bold :size="20" /></button>
                <button type="button" @click="applyMarkdown('||')"><EyeOff :size="20" /></button>
            </div>
            <div class="char-counter" :class="{ 'is-warning': charsRemaining < 20, 'is-error': charsRemaining < 0 }">
              {{ charsRemaining }}
            </div>
          </div>
          
          <transition name="fade">
            <div v-if="mediaPreviewUrl" class="media-preview">
              <img v-if="mediaType === 'image'" :src="mediaPreviewUrl" alt="Anteprima media" />
              <video v-else-if="mediaType === 'video'" :src="mediaPreviewUrl" controls></video>
              <button type="button" @click="clearMedia" class="clear-media-btn"><X :size="20" /></button>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="isPoll" class="poll-creator">
              <h3 class="poll-title">Opzioni Sondaggio</h3>
              <transition-group name="list" tag="div" class="poll-options-list">
                <div v-for="(option, index) in pollOptions" :key="index" class="poll-option">
                  <input
                    type="text"
                    v-model="option.text"
                    :placeholder="`Opzione ${index + 1}`"
                    maxlength="50"
                  />
                  <button v-if="index > 1" @click.prevent="removePollOption(index)" class="remove-option-btn">
                    <X :size="18" />
                  </button>
                </div>
              </transition-group>
              <button
                v-if="pollOptions.length < MAX_POLL_OPTIONS"
                @click.prevent="addPollOption"
                class="add-option-btn"
              >
                Aggiungi Opzione
              </button>
            </div>
          </transition>

          <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
          <button type="submit" :disabled="isLoading || !isFormValid" class="submit-btn">
            <span v-if="!isLoading">Pubblica</span>
            <Loader v-else :size="20" class="spinner" />
          </button>
        </form>
      </div>
    </div>

    <aside class="settings-panel" :class="{ 'is-open': isSettingsOpen }">
      <h3 class="panel-title">Opzioni Post</h3>
      <div class="setting-item">
        <div class="setting-label"><strong>Post Anonimo</strong><p>Nascondi il tuo username.</p></div>
        <label class="switch"><input type="checkbox" v-model="isAnonymous"><span class="slider"></span></label>
      </div>
      <div class="divider"></div>
      <h3 class="panel-title">Aggiungi al post</h3>
      
      <div class="setting-item">
        <div class="setting-label"><strong>Crea Sondaggio</strong><p>Trasforma il post in un sondaggio.</p></div>
        <label class="switch"><input type="checkbox" v-model="isPoll" :disabled="!!selectedMediaFile"><span class="slider"></span></label>
      </div>
      
      <button type="button" @click="triggerFileInput" class="panel-button" :disabled="isPoll || !!selectedMediaFile">
        <ImageIcon :size="20" /><span>Aggiungi Media</span>
      </button>
      <input type="file" ref="mediaInputRef" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" />
      <transition name="fade">
        <div v-if="selectedMediaFile" class="setting-item spoiler-media-setting">
            <div class="setting-label"><strong>Oscura media</strong><p>Rende l'immagine o il video sfocato.</p></div>
            <label class="switch"><input type="checkbox" v-model="isMediaSpoiler"><span class="slider"></span></label>
        </div>
      </transition>
      
      <transition name="fade">
        <div v-if="isPoll" class="advanced-poll-settings">
          <div class="setting-item-col">
            <label>Tipo di voto</label>
            <div class="radio-group">
              <button type="button" @click="pollSettings.voteType = 'single'" :class="{ active: pollSettings.voteType === 'single' }">Singolo</button>
              <button type="button" @click="pollSettings.voteType = 'multiple'" :class="{ active: pollSettings.voteType === 'multiple' }">Multiplo</button>
            </div>
          </div>
          <div class="setting-item-col">
            <label>Visibilità risultati</label>
            <div class="radio-group">
              <button type="button" @click="pollSettings.resultsVisibility = 'always'" :class="{ active: pollSettings.resultsVisibility === 'always' }">Sempre</button>
              <button type="button" @click="pollSettings.resultsVisibility = 'after_vote'" :class="{ active: pollSettings.resultsVisibility === 'after_vote' }">Dopo il voto</button>
            </div>
          </div>
          <div class="setting-item-col">
            <label>Visibilità del voto</label>
            <div class="radio-group">
              <button type="button" @click="pollSettings.voteVisibility = 'public'" :class="{ active: pollSettings.voteVisibility === 'public' }">Pubblico</button>
              <button type="button" @click="pollSettings.voteVisibility = 'anonymous'" :class="{ active: pollSettings.voteVisibility === 'anonymous' }">Anonimo</button>
            </div>
          </div>
        </div>
      </transition>

    </aside>
  </div>
</template>

<style scoped>
/* Stili Generali (invariati) */
.page-wrapper { position: relative; width: 100%; overflow-x: hidden; min-height: 100vh; }
.create-post-container { width: 100%; padding: 1rem; box-sizing: border-box; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-title { font-size: 1.2rem; font-weight: bold; margin: 0; }
.header-btn { background: none; border: 1px solid #363636; color: #a0a0a0; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s ease; }
.header-btn:hover { color: #fff; background-color: #2a2a2a; }
.header-btn.active { color: #4f46e5; border-color: #4f46e5; transform: rotate(45deg); }
.content-body { max-width: 700px; margin: 0 auto; }
.user-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.username { font-weight: bold; }
.textarea-wrapper { position: relative; margin-bottom: 1rem; }
textarea { width: 100%; min-height: 120px; background: transparent; color: #e0e0e0; border: none; font-size: 1.5rem; resize: vertical; padding: 0.5rem; box-sizing: border-box; outline: none; }
.char-counter { position: absolute; bottom: 0.5rem; right: 0.5rem; font-size: 0.8rem; color: #a0a0a0; }
.char-counter.is-warning { color: #f59e0b; }
.char-counter.is-error { color: #ef4444; }
.submit-btn { width: 100%; margin-top: 1.5rem; padding: 0.8rem; border: none; border-radius: 999px; background: linear-gradient(45deg, #4f46e5, #818cf8); color: #fff; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; display: flex; justify-content: center; align-items: center; }
.submit-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 4px 20px rgba(79, 70, 229, 0.5); }
.submit-btn:disabled { background: #374151; cursor: not-allowed; }
.settings-panel { position: absolute; top: 0; right: 0; width: 300px; height: 100%; background-color: #2a2a2a; border-left: 1px solid #363636; padding: 1rem; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); box-sizing: border-box; }
.settings-panel.is-open { transform: translateX(0); }
.create-post-container.settings-open { transform: translateX(-300px); }
.panel-title { font-size: 1rem; font-weight: bold; margin: 1.5rem 0 1rem 0; }
.setting-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.setting-label strong { display: block; color: #fff; }
.setting-label p { font-size: 0.8rem; color: #a0a0a0; margin: 0; }
.divider { height: 1px; background-color: #363636; margin: 1.5rem 0; }
.panel-button { width: 100%; display: flex; align-items: center; gap: 0.75rem; background-color: #363636; border: none; color: #fff; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: background-color 0.2s; }
.panel-button:hover { background-color: #444; }
.panel-button:disabled { cursor: not-allowed; opacity: 0.5; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #363636; transition: .4s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: #4f46e5; }
input:checked + .slider:before { transform: translateX(20px); }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-message { color: #ef4444; margin-top: 1rem; text-align: center; }
.poll-creator { margin-top: 1.5rem; border-top: 1px solid #363636; padding-top: 1.5rem; }
.poll-title { font-size: 0.9rem; font-weight: bold; color: #a0a0a0; text-transform: uppercase; margin: 0 0 1rem 0; }
.poll-options-list { display: flex; flex-direction: column; gap: 0.75rem; }
.poll-option { display: flex; align-items: center; gap: 0.5rem; }
.poll-option input { flex-grow: 1; background-color: #1a1a1a; border: 1px solid #363636; border-radius: 6px; padding: 0.75rem; color: #fff; font-size: 1rem; transition: border-color 0.2s; }
.poll-option input:focus { outline: none; border-color: #4f46e5; }
.remove-option-btn { background: none; border: none; color: #a0a0a0; cursor: pointer; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.remove-option-btn:hover { background-color: #363636; color: #ef4444; }
.add-option-btn { width: 100%; margin-top: 1rem; background-color: transparent; border: 1px dashed #555; color: #a0a0a0; padding: 0.6rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: bold; }
.add-option-btn:hover { background-color: #2a2a2a; color: #fff; border-color: #777; }
.advanced-poll-settings { background-color: #1f1f1f; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
.setting-item-col { margin-bottom: 0.75rem; }
.setting-item-col:last-child { margin-bottom: 0; }
.setting-item-col label { font-size: 0.9rem; font-weight: bold; color: #a0a0a0; display: block; margin-bottom: 0.5rem; }
.radio-group { display: flex; background-color: #363636; border-radius: 6px; padding: 4px; }
.radio-group button { flex: 1; background: none; border: none; color: #a0a0a0; padding: 0.5rem; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.radio-group button.active { background-color: #4f46e5; color: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(30px); }

.media-preview {
  position: relative;
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 1rem;
  border: 1px solid #363636;
}
.media-preview img, .media-preview video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.clear-media-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.clear-media-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
.markdown-toolbar {
    display: flex;
    gap: 0.5rem;
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    z-index: 10;
}
.markdown-toolbar button {
    background: #363636;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    color: #a0a0a0;
    transition: background-color 0.2s, color 0.2s;
}
.markdown-toolbar button:hover {
    background-color: #444;
    color: #fff;
}
.spoiler-media-setting {
    margin-top: 1.5rem;
    border-top: 1px solid #363636;
    padding-top: 1.5rem;
}
</style>