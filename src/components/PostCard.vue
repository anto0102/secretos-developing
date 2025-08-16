<script setup lang="ts">
import { ref, computed } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, deleteDoc, updateDoc, arrayRemove, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { X } from 'lucide-vue-next';
import { type Post } from '../types';
import PostHeader from './PostHeader.vue';
import PostMedia from './PostMedia.vue';
import PostFooter from './PostFooter.vue';
import { formatTimeAgo } from '../utils/dateUtils';

const props = defineProps<{ post: Post }>();
const router = useRouter();

const isVotersModalOpen = ref(false);
const votersList = ref<{ optionText: string, users: {id: string, username: string, avatarUrl: string}[] }[]>([]);

const parseMarkdown = (text: string) => {
    // Sostituisci il grassetto (bold)
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Sostituisci il testo spoiler
    text = text.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text">$1</span>');
    return text;
};

const totalVotes = computed(() => {
  if (!props.post.isPoll || !props.post.pollOptions) return 0;
  return props.post.pollOptions.reduce((sum, option) => sum + option.votes, 0);
});

const userHasVoted = computed(() => {
    if (!props.post.isPoll || !props.post.pollOptions || !auth.currentUser) return false;
    return props.post.pollOptions.some(option => option.votedBy?.includes(auth.currentUser.uid));
});

const userVotesIndices = computed(() => {
    if (!userHasVoted.value) return [];
    const indices: number[] = [];
    if (props.post.pollOptions) {
        props.post.pollOptions.forEach((option, index) => {
            if (option.votedBy?.includes(auth.currentUser.uid)) {
                indices.push(index);
            }
        });
    }
    return indices;
});

const showResults = computed(() => {
  if (!props.post.isPoll) return false;
  if (!props.post.pollSettings) return true;
  if (props.post.pollSettings.resultsVisibility === 'always') return true;
  return userHasVoted.value;
});

const voteOnPoll = async (selectedIndex: number) => {
  if (!auth.currentUser) return;
  const postRef = doc(db, "posts", props.post.id);
  const userId = auth.currentUser.uid;
  
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  let currentPost = postSnap.data() as Post;
  if (!currentPost.pollOptions) return;
  let currentOptions = JSON.parse(JSON.stringify(currentPost.pollOptions));
  
  const voteType = currentPost.pollSettings?.voteType || 'single';
  const hasVotedThisOption = currentOptions[selectedIndex].votedBy?.includes(userId);

  if (voteType === 'multiple') {
    if (hasVotedThisOption) {
      currentOptions[selectedIndex].votes--;
      currentOptions[selectedIndex].votedBy = currentOptions[selectedIndex].votedBy.filter(id => id !== userId);
    } else {
      currentOptions[selectedIndex].votes++;
      if (!currentOptions[selectedIndex].votedBy) currentOptions[selectedIndex].votedBy = [];
      currentOptions[selectedIndex].votedBy.push(userId);
    }
  } else {
    const previousVoteIndex = currentOptions.findIndex(opt => opt.votedBy?.includes(userId));
    if (previousVoteIndex === selectedIndex) return;
    if (previousVoteIndex !== -1) {
      currentOptions[previousVoteIndex].votes--;
      currentOptions[previousVoteIndex].votedBy = currentOptions[previousVoteIndex].votedBy.filter(id => id !== userId);
    }
    currentOptions[selectedIndex].votes++;
    if (!currentOptions[selectedIndex].votedBy) currentOptions[selectedIndex].votedBy = [];
    currentOptions[selectedIndex].votedBy.push(userId);
  }
  
  await updateDoc(postRef, { pollOptions: currentOptions });
};

const handleVote = async (voteType: 'up' | 'down') => {
  if (!auth.currentUser) return;
  const postRef = doc(db, "posts", props.post.id);
  const userId = auth.currentUser.uid;
  const isUpvoted = props.post.upvotedBy?.includes(userId);
  const isDownvoted = props.post.downvotedBy?.includes(userId);

  if (voteType === 'up') {
    if (isUpvoted) {
      await updateDoc(postRef, { upvotedBy: arrayRemove(userId), score: increment(-1) });
    } else {
      await updateDoc(postRef, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId), score: increment(isDownvoted ? 2 : 1) });
    }
  } else {
    if (isDownvoted) {
      await updateDoc(postRef, { downvotedBy: arrayRemove(userId), score: increment(1) });
    } else {
      await updateDoc(postRef, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId), score: increment(isUpvoted ? -2 : -1) });
    }
  }
};

const handleDeletePost = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;
    try {
        await deleteDoc(doc(db, "posts", props.post.id));
    } catch (error) {
        console.error("Errore durante l'eliminazione del post:", error);
    }
};

const showVoters = async () => {
  if (!props.post.pollOptions) return;
  isVotersModalOpen.value = true;
  const allVoterIds = props.post.pollOptions.flatMap(opt => opt.votedBy || []);
  const uniqueVoterIds = [...new Set(allVoterIds)];

  if (uniqueVoterIds.length === 0) {
    votersList.value = props.post.pollOptions.map(option => ({
      optionText: option.text,
      users: []
    }));
    return;
  }

  const userDocs = await Promise.all(uniqueVoterIds.map(id => getDoc(doc(db, "users", id))));
  const usersMap = new Map();
  userDocs.forEach(userDoc => {
    if (userDoc.exists()) {
      const data = userDoc.data();
      usersMap.set(userDoc.id, { id: userDoc.id, username: data.username, avatarUrl: data.avatarUrl });
    }
  });

  votersList.value = props.post.pollOptions.map(option => ({
    optionText: option.text,
    users: (option.votedBy || []).map(id => usersMap.get(id)).filter(Boolean)
  }));
};
</script>

<template>
  <div class="post-card">
    <PostHeader
      :author-id="post.authorId"
      :author="post.author"
      :author-avatar-url="post.authorAvatarUrl"
      :is-anonymous="post.isAnonymous"
      :post-id="post.id"
      @delete-post="handleDeletePost"
    />

    <p class="card-text" @click="router.push({ name: 'PostView', params: { postId: post.id } })" v-html="parseMarkdown(post.text)"></p>

    <PostMedia
      :media-url="post.mediaUrl"
      :media-type="post.mediaType"
      :is-media-spoiler="post.isMediaSpoiler"
      :post-id="post.id"
    />

    <div v-if="post.isPoll && post.pollOptions" class="poll-container">
      <div 
        v-for="(option, index) in post.pollOptions" 
        :key="index"
        class="poll-option"
        :class="{ 'is-voted-by-user': userVotesIndices.includes(index) }"
        @click="voteOnPoll(index)"
      >
        <div v-if="showResults" class="poll-bar" :style="{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }"></div>
        <div class="poll-info">
          <div class="poll-text-wrapper">
            <span class="poll-text">{{ option.text }}</span>
          </div>
          <span v-if="showResults" class="poll-votes">{{ Math.round(totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0) }}%</span>
        </div>
      </div>
      <div class="poll-footer">
        <span class="total-votes">{{ totalVotes }} voti totali</span>
        <button v-if="post.pollSettings?.voteVisibility === 'public' && userHasVoted" @click="showVoters" class="view-voters-btn">
          Vedi voti
        </button>
      </div>
       <p v-if="!showResults" class="results-hidden-text">I risultati saranno visibili dopo il voto.</p>
    </div>

    <PostFooter
      :score="post.score"
      :comments-count="post.commentsCount"
      :upvoted-by="post.upvotedBy"
      :downvoted-by="post.downvotedBy"
      @vote="handleVote"
      @go-to-post="router.push({ name: 'PostView', params: { postId: post.id } })"
    />
    
    <transition name="fade">
      <div v-if="isVotersModalOpen" class="modal-overlay" @click.self="isVotersModalOpen = false">
        <div class="modal-container">
          <button @click="isVotersModalOpen = false" class="close-modal-btn"><X :size="20"/></button>
          <h3>Chi ha votato</h3>
          <div class="voters-by-option" v-for="item in votersList" :key="item.optionText">
            <h4>{{ item.optionText }}</h4>
            <div v-if="item.users.length > 0" class="voter-list">
              <div v-for="user in item.users" :key="user.id" class="voter-item">
                <img :src="user.avatarUrl" class="voter-avatar" />
                <span>{{ user.username }}</span>
              </div>
            </div>
            <p v-else class="no-votes">Nessun voto per questa opzione.</p>
          </div>
        </div>
      </div>
    </transition>

    <div class="post-meta">
      <span v-if="post.isEdited" class="edited-label">modificato {{ formatTimeAgo(post.editedAt) }}</span>
      <span v-else class="created-label">{{ formatTimeAgo(post.createdAt) }}</span>
    </div>

  </div>
</template>

<style scoped>
.post-card {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #363636;
  position: relative;
  overflow-x: hidden;
}
.card-text {
  color: #e0e0e0;
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-wrap;
  cursor: pointer;
  word-wrap: break-word;
}
.card-text ::v-deep b, .card-text ::v-deep .spoiler-text {
  word-break: break-word;
  overflow-wrap: break-word;
}
.card-text ::v-deep b {
  color: #fff;
  font-weight: bold;
}
.card-text ::v-deep .spoiler-text {
  background-color: #3f4657;
  color: transparent;
  user-select: none;
  transition: color 0.2s ease, background-color 0.2s ease;
  padding: 0 0.25rem;
  border-radius: 4px;
}
.card-text ::v-deep .spoiler-text:hover {
  color: #fff;
  background-color: #4b5563;
}
.poll-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.poll-option {
  position: relative;
  border: 2px solid #363636;
  background-color: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}
.poll-option:hover {
  border-color: #4f46e5;
}
.poll-option.is-voted-by-user {
  border-color: #4f46e5;
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
}
.poll-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #4f46e5;
  opacity: 0.3;
  transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.poll-info {
  position: relative;
  padding: 0.8rem 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  color: #fff;
  font-weight: bold;
}
.poll-text-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-grow: 1;
  min-width: 0;
  word-break: break-word;
}
.poll-text {
  min-width: 0;
  word-break: break-word;
}
.poll-votes {
  font-size: 0.9rem;
  color: #a0a0a0;
  font-weight: bold;
  flex-shrink: 0;
}
.results-hidden-text {
  font-size: 0.8rem;
  text-align: center;
  color: #a0a0a0;
  margin-top: 0.5rem;
}
.poll-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0 0.5rem;
}
.total-votes {
  font-size: 0.8rem;
  color: #a0a0a0;
}
.view-voters-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color 0.2s;
}
.view-voters-btn:hover {
  color: #fff;
}
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
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  position: relative;
}
.close-modal-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}
.close-modal-btn:hover {
  background-color: #363636;
  color: #fff;
}
.modal-container h3 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 1.5rem;
}
.voters-by-option {
  margin-bottom: 1rem;
}
.voters-by-option h4 {
  background-color: #363636;
  padding: 0.5rem;
  border-radius: 6px;
  margin: 0 0 0.75rem 0;
}
.voter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.voter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #1f1f1f;
  padding: 0.5rem;
  border-radius: 6px;
}
.voter-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.no-votes {
  font-size: 0.9rem;
  color: #a0a0a0;
  text-align: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.post-meta {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  font-size: 0.8rem;
  color: #a0a0a0;
  font-style: italic;
}
.edited-label {
  margin-left: 0.5rem;
}
</style>