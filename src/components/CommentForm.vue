<script setup lang="ts">
import { defineEmits, ref } from 'vue';

const emit = defineEmits(['submit-comment']);

const newCommentText = ref('');

const submitComment = () => {
    emit('submit-comment', newCommentText.value);
    newCommentText.value = '';
};
</script>

<template>
  <div class="comments-form-section">
    <h3>Lascia un commento</h3>
    <form @submit.prevent="submitComment">
      <textarea v-model="newCommentText" placeholder="Scrivi il tuo commento..."></textarea>
      <button type="submit" :disabled="!newCommentText.trim()">Invia</button>
    </form>
  </div>
</template>

<style scoped>
.comments-form-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #363636;
}
.comments-form-section h3 {
  font-size: 1.25rem;
  color: #fff;
  margin-top: 0;
}
.comments-form-section form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.comments-form-section textarea {
  width: 100%;
  box-sizing: border-box;
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.75rem;
  resize: vertical;
  min-height: 80px;
}
.comments-form-section button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 999px;
  background-color: #4f46e5;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.comments-form-section button:disabled {
  background-color: #374151;
  cursor: not-allowed;
}
</style>