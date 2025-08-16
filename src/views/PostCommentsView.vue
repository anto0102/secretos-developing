<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="post-comments-view">
    <h1>Commenti per il post: {{ postId }}</h1>
    <p>Qui andrà la sezione per i commenti e il form per scrivere un nuovo commento.</p>
  </div>
</template>

<style scoped>
.post-comments-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  color: #fff;
  text-align: center;
}
</style>