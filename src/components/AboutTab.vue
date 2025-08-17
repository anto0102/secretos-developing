<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import { Pencil, Music, Film, Book, User, Calendar, Star, Gamepad2, Dumbbell, UserRound, Venus, Mars } from 'lucide-vue-next';
import FavoritesEditor from './FavoritesEditor.vue';
import { parseText, handleMentionClick } from '../utils/textParser'; // <-- CORRETTO: import di parseText
import { useRouter } from 'vue-router';

const props = defineProps({
  userProfile: Object,
  editingSection: String,
  editableData: Object,
  isOwner: Boolean,
});

const emit = defineEmits(['openEditor', 'saveChanges', 'cancelEdit', 'update:editableData', 'update-and-save-field']);

const parsedBio = ref('');
const router = useRouter();

watch(() => props.userProfile?.bio, async (newBio) => {
    if (newBio) {
        parsedBio.value = await parseText(newBio); // <-- CORRETTO: usa parseText
    } else {
        parsedBio.value = 'Nessuna bio impostata.';
    }
}, { immediate: true });

const onBioClick = (event: MouseEvent) => {
  handleMentionClick(event, router);
};

const updateData = (field: string, value: any) => {
  const newData = { ...props.editableData, [field]: value };
  emit('update:editableData', newData);
};

const updateGender = (gender: 'male' | 'female' | 'nonbinary') => {
  emit('update-and-save-field', { field: 'gender', value: gender });
};
</script>

<template>
  <div class="tab-content about-tab">
    <div class="section-box">
      <h3 class="section-header"><User :size="20" class="header-icon" /> Bio</h3>
      <div v-if="editingSection !== 'bio'">
        <p class="bio-text" @click="onBioClick" v-html="parsedBio"></p>
        <button v-if="isOwner" @click="emit('openEditor', 'bio')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
      </div>
      <div v-else>
        <textarea :value="editableData.bio" @input="updateData('bio', ($event.target as HTMLTextAreaElement).value)" maxlength="300"></textarea>
        <div class="edit-actions">
          <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
          <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
        </div>
      </div>
    </div>

    <div class="section-box favorites-section">
      <h3 class="section-header"><Star :size="20" class="header-icon" /> Preferiti</h3>
      <div v-if="editingSection !== 'favorites'">
        <div class="favorites-display">
          <div class="favorite-item">
            <Music :size="20" class="icon" />
            <p v-if="userProfile?.favorites?.music?.track || userProfile?.favorites?.music?.author">
              {{ userProfile.favorites.music.track }} di {{ userProfile.favorites.music.author }}
              <a v-if="userProfile.favorites.music.link" :href="userProfile.favorites.music.link" target="_blank" class="track-link">Ascolta</a>
            </p><p v-else>Non impostato</p>
          </div>
          <div class="favorite-item"><Film :size="20" class="icon" /><p>{{ userProfile?.favorites?.movie || 'Non impostato' }}</p></div>
          <div class="favorite-item"><Book :size="20" class="icon" /><p>{{ userProfile?.favorites?.book || 'Non impostato' }}</p></div>
        </div>
        <button v-if="isOwner" @click="emit('openEditor', 'favorites')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
      </div>
      <div v-else>
        <FavoritesEditor v-model:favorites="editableData.favorites" />
        <div class="edit-actions">
          <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
          <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
        </div>
      </div>
    </div>
    
    <div class="section-box">
      <h3 class="section-header"><UserRound :size="20" class="header-icon" /> Genere</h3>
      <div v-if="editingSection !== 'gender'">
        <p>
          <span v-if="userProfile?.gender === 'male'">Uomo</span>
          <span v-else-if="userProfile?.gender === 'female'">Donna</span>
          <span v-else-if="userProfile?.gender === 'nonbinary'">Non binario</span>
          <span v-else>Non specificato</span>
        </p>
        <button v-if="isOwner" @click="emit('openEditor', 'gender')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
      </div>
      <div v-else class="gender-options">
          <button @click="updateGender('male')" :class="{ active: editableData.gender === 'male' }"><Mars :size="18"/> Uomo</button>
          <button @click="updateGender('female')" :class="{ active: editableData.gender === 'female' }"><Venus :size="18"/> Donna</button>
          <button @click="updateGender('nonbinary')" :class="{ active: editableData.gender === 'nonbinary' }"><UserRound :size="18"/> Non binario</button>
      </div>
    </div>

    <div class="details-grid">
      <div class="section-box">
        <h3 class="section-header"><User :size="20" class="header-icon" /> Pronomi</h3>
        <div v-if="editingSection !== 'pronouns'">
          <p>{{ userProfile?.pronouns || 'Non specificato.' }}</p>
          <button v-if="isOwner" @click="emit('openEditor', 'pronouns')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" :value="editableData.pronouns" @input="updateData('pronouns', ($event.target as HTMLInputElement).value)" placeholder="lui/egli, lei/ella...">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header"><Calendar :size="20" class="header-icon" /> Data di nascita</h3>
        <div v-if="editingSection !== 'birthdate'">
          <p>{{ userProfile?.birthdate || 'Non specificata.' }}</p>
          <button v-if="isOwner" @click="emit('openEditor', 'birthdate')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="date" :value="editableData.birthdate" @input="updateData('birthdate', ($event.target as HTMLInputElement).value)">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header"><Gamepad2 :size="20" class="header-icon" /> Videogioco</h3>
        <div v-if="editingSection !== 'videogame'">
          <p>{{ userProfile?.videogame || 'Non specificato.' }}</p>
          <button v-if="isOwner" @click="emit('openEditor', 'videogame')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" :value="editableData.videogame" @input="updateData('videogame', ($event.target as HTMLInputElement).value)" placeholder="Il tuo gioco preferito">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header"><Dumbbell :size="20" class="header-icon" /> Sport</h3>
        <div v-if="editingSection !== 'sport'">
          <p>{{ userProfile?.sport || 'Non specificato.' }}</p>
          <button v-if="isOwner" @click="emit('openEditor', 'sport')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" :value="editableData.sport" @input="updateData('sport', ($event.target as HTMLInputElement).value)" placeholder="Il tuo sport preferito">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-tab { display: flex; flex-direction: column; gap: 1.5rem; }
.section-box { background-color: #1f1f1f; padding: 1.5rem; border-radius: 12px; position: relative; text-align: left; border: 1px solid #363636; }
.section-header { display: flex; align-items: center; gap: 0.5rem; margin-top: 0; margin-bottom: 0.75rem; color: #a0a0a0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
.bio-text { white-space: pre-wrap; }
.inner-edit-btn { position: absolute; top: 1.5rem; right: 1.5rem; background-color: transparent; border: 1px solid #555; color: #ccc; transition: all 0.2s ease; padding: 0.5rem; border-radius: 50%; width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
.inner-edit-btn:hover { background-color: #444; color: #fff; transform: rotate(15deg); }
.section-box input, .section-box textarea { width: 100%; box-sizing: border-box; background-color: #1a1a1a; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.5rem; resize: vertical; }
.edit-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
.action-btn { border: none; padding: 0.6rem 1.5rem; border-radius: 999px; font-weight: bold; cursor: pointer; transition: transform 0.2s ease, filter 0.2s; }
.action-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
.save-btn { background-color: #fff; color: #1a1a1a; }
.cancel-btn { background-color: #ef4444; color: #fff; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.favorites-display { display: flex; flex-direction: column; gap: 1rem; }
.gender-options { display: flex; flex-direction: row; gap: 1rem; flex-wrap: wrap; }
.gender-options button { display:flex; align-items:center; gap:0.5rem; background-color: #333; color: #ccc; border: 1px solid #555; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
.gender-options button:hover { background-color: #444; }
.gender-options button.active { background-color: #4f46e5; color: #fff; border-color:#4f46e5; }
.favorite-item { display: flex; align-items: center; gap: 0.75rem; color: #ccc; }
.favorite-item p { margin: 0; }
.favorite-item .icon { color: #a0a0a0; flex-shrink: 0; }
.track-link { color: #fff; background-color: #555; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.8rem; font-weight: bold; text-decoration: none; margin-left: 0.5rem; transition: all 0.2s ease; }
.track-link:hover { background-color: #777; }

/* Stili per le mention nella Bio */
.bio-text ::v-deep .mention {
  color: #818cf8;
  font-weight: bold;
  background-color: rgba(79, 70, 229, 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}
.bio-text ::v-deep .mention:hover {
    text-decoration: underline;
}
</style>