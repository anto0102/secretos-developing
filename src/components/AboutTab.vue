<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { Pencil, Music, Film, Book, User, Calendar, Star, Gamepad2, Dumbbell, UserRound, Venus, Mars } from 'lucide-vue-next';
import FavoritesEditor from './FavoritesEditor.vue';

const props = defineProps({
  userProfile: Object,
  editingSection: String,
  editableData: Object,
});

const emit = defineEmits(['openEditor', 'saveChanges', 'cancelEdit']);

const updateGender = (gender: 'male' | 'female' | 'nonbinary') => {
  const newEditableData = { ...props.editableData };
  newEditableData.gender = gender;
  emit('update:editable-data', newEditableData);
  
  // Imposta la sezione di editing e salva le modifiche
  emit('openEditor', 'gender');
  emit('saveChanges');
};
</script>

<template>
  <div class="tab-content about-tab">
    <div class="section-box">
      <h3 class="section-header">
        <User :size="20" class="header-icon" />
        Bio
      </h3>
      <div v-if="editingSection !== 'bio'">
        <p>{{ userProfile?.bio || 'Nessuna bio impostata.' }}</p>
        <button @click="emit('openEditor', 'bio')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
      </div>
      <div v-else>
        <textarea v-model="editableData.bio" maxlength="300"></textarea>
        <div class="edit-actions">
          <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
          <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
        </div>
      </div>
    </div>

    <div class="section-box favorites-section">
      <h3 class="section-header">
        <Star :size="20" class="header-icon" />
        Preferiti
      </h3>
      <div v-if="editingSection !== 'favorites'">
        <div class="favorites-display">
          <div class="favorite-item">
            <Music :size="20" class="icon" />
            <p>Musica: 
              <span v-if="userProfile?.favorites?.music?.track">{{ userProfile.favorites.music.track }}</span>
              <span v-if="userProfile?.favorites?.music?.author"> di {{ userProfile.favorites.music.author }}</span>
              <span v-else>Non impostato</span>
              <a v-if="userProfile?.favorites?.music?.link" :href="userProfile.favorites.music.link" target="_blank" class="track-link">Ascolta</a>
            </p>
          </div>
          <div class="favorite-item">
            <Film :size="20" class="icon" />
            <p>Film: <span>{{ userProfile?.favorites?.movie || 'Non impostato' }}</span></p>
          </div>
          <div class="favorite-item">
            <Book :size="20" class="icon" />
            <p>Libro: <span>{{ userProfile?.favorites?.book || 'Non impostato' }}</span></p>
          </div>
        </div>
        <button @click="emit('openEditor', 'favorites')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
      </div>
      <div v-else>
        <FavoritesEditor v-model:favorites="editableData.favorites" />
        <div class="edit-actions">
          <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
          <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
        </div>
      </div>
    </div>
    
    <div class="details-grid">
      <div class="section-box">
        <h3 class="section-header">
          <User :size="20" class="header-icon" />
          Pronomi
        </h3>
        <div v-if="editingSection !== 'pronouns'">
          <p>{{ userProfile?.pronouns || 'Non specificato.' }}</p>
          <button @click="emit('openEditor', 'pronouns')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" v-model="editableData.pronouns" placeholder="lui/egli, lei/ella...">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header">
          <Calendar :size="20" class="header-icon" />
          Data di nascita
        </h3>
        <div v-if="editingSection !== 'birthdate'">
          <p>{{ userProfile?.birthdate || 'Non specificata.' }}</p>
          <button @click="emit('openEditor', 'birthdate')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="date" v-model="editableData.birthdate">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>

      <div class="section-box">
        <h3 class="section-header">
          <UserRound :size="20" class="header-icon" />
          Genere
        </h3>
        <div v-if="editingSection !== 'gender'">
          <p>
            <span v-if="userProfile?.gender === 'male'">Maschio</span>
            <span v-else-if="userProfile?.gender === 'female'">Femmina</span>
            <span v-else-if="userProfile?.gender === 'nonbinary'">Non binario</span>
            <span v-else>Non specificato.</span>
          </p>
          <button @click="emit('openEditor', 'gender')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else class="gender-options">
          <button 
            @click="updateGender('male')"
            :class="{ active: editableData.gender === 'male' }"
          >
            <Venus :size="18" /> Maschio
          </button>
          <button 
            @click="updateGender('female')"
            :class="{ active: editableData.gender === 'female' }"
          >
            <Mars :size="18" /> Femmina
          </button>
          <button 
            @click="updateGender('nonbinary')"
            :class="{ active: editableData.gender === 'nonbinary' }"
          >
            <UserRound :size="18" /> Non binario
          </button>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header">
          <Gamepad2 :size="20" class="header-icon" />
          Videogioco
        </h3>
        <div v-if="editingSection !== 'videogame'">
          <p>{{ userProfile?.videogame || 'Non specificato.' }}</p>
          <button @click="emit('openEditor', 'videogame')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" v-model="editableData.videogame" placeholder="Nome del videogioco preferito">
          <div class="edit-actions">
            <button @click="emit('cancelEdit')" class="action-btn cancel-btn">Annulla</button>
            <button @click="emit('saveChanges')" class="action-btn save-btn">Salva</button>
          </div>
        </div>
      </div>
      <div class="section-box">
        <h3 class="section-header">
          <Dumbbell :size="20" class="header-icon" />
          Sport
        </h3>
        <div v-if="editingSection !== 'sport'">
          <p>{{ userProfile?.sport || 'Non specificato.' }}</p>
          <button @click="emit('openEditor', 'sport')" class="edit-btn inner-edit-btn"><Pencil :size="16" /></button>
        </div>
        <div v-else>
          <input type="text" v-model="editableData.sport" placeholder="Nome dello sport preferito">
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
/* Stili per il link della traccia musicale */
.track-link {
  color: #fff;
  background-color: #555;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  font-weight: bold;
  text-decoration: none;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}
.track-link:hover {
  background-color: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Nuovi stili per le icone delle card */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.header-icon {
  color: #a0a0a0;
  opacity: 0.8;
}

/* Stili esistenti */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.section-box {
  background-color: #2a2a2a; padding: 1.5rem; border-radius: 12px;
  margin-top: 1.5rem; position: relative;
  text-align: left;
}
.section-box h3 {
  margin-top: 0; margin-bottom: 0.5rem; color: #a0a0a0;
  font-size: 0.9rem; text-transform: uppercase;
}
.inner-edit-btn {
  position: absolute; top: 1.5rem; right: 1.5rem;
  background-color: transparent;
  border: 1px solid #555;
  color: #ccc;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.inner-edit-btn:hover {
  background-color: #444;
  color: #fff;
  transform: rotate(15deg);
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
.action-btn {
  border: none; padding: 0.6rem 1.5rem; border-radius: 999px;
  font-weight: bold; cursor: pointer; transition: transform 0.2s ease, filter 0.2s;
}
.action-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}
.save-btn {
  background-color: #fff;
  color: #1a1a1a;
}
.cancel-btn {
  background-color: #ef4444;
  color: #fff;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.favorites-section {
  position: relative;
}
.favorites-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.favorite-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ccc;
  font-size: 1rem;
}
.favorite-item span {
  font-weight: 600;
  color: #fff;
}
.favorite-item .icon {
  color: #fff;
  opacity: 0.7;
}
.section-box input, .section-box textarea { width: 100%; box-sizing: border-box; background-color: #1a1a1a; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.5rem; }
.gender-options {
  display: flex;
  gap: 1rem;
}
.gender-options button {
  background-color: #333;
  color: #ccc;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.gender-options button:hover {
  background-color: #444;
}
.gender-options button.active {
  background-color: #4CAF50;
  color: #fff;
}
</style>