<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ArrowUp, ArrowDown, MessageCircle, MoreHorizontal, Trash2, CheckCircle, Eye, X, Pencil } from 'lucide-vue-next';
import { type Post } from '../types';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion, increment, Timestamp, onSnapshot } from 'firebase/firestore';
import PostHeader from './PostHeader.vue';
import PostMedia from './PostMedia.vue';
import PostFooter from './PostFooter.vue';
import { formatTimeAgo } from '../utils/dateUtils';
import { useRouter } from 'vue-router';

const props = defineProps<{ post: Post }>();
const emit = defineEmits(['delete-post']);
const router = useRouter();

const livePost = ref<Post | null>(null);
const isEditing = ref(false);
const editedText = ref('');
const isVotersModalOpen = ref(false);
const votersList = ref<{ optionText: string, users: {id: string, username: string, avatarUrl: string}[] }[]>([]);
let unsubscribe: (() => void) | null = null;
let timeoutId: number | null = null;

const isPollExpiredRef = ref(false);

const setupPostListener = (id: string) => {
    if (unsubscribe) unsubscribe();
    const postDocRef = doc(db, 'posts', id);
    unsubscribe = onSnapshot(postDocRef, (docSnap) => {
        if (docSnap.exists()) {
            livePost.value = { ...props.post, ...docSnap.data(), id: docSnap.id } as Post;
            if (!isEditing.value) {
                editedText.value = livePost.value.text;
            }
        } else {
            livePost.value = null;
        }
    });
};

const checkPollExpiration = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (!livePost.value?.isPoll || !livePost.value?.pollEndDate) {
        isPollExpiredRef.value = false;
        return;
    }
    
    const now = new Date();
    const endDate = livePost.value.pollEndDate.toDate();
    const timeRemaining = endDate.getTime() - now.getTime();

    if (timeRemaining <= 0) {
        isPollExpiredRef.value = true;
    } else {
        isPollExpiredRef.value = false;
        timeoutId = setTimeout(() => {
            isPollExpiredRef.value = true;
        }, timeRemaining);
    }
};

onMounted(() => {
    setupPostListener(props.post.id);
    editedText.value = props.post.text;
    checkPollExpiration(); // Esegui subito il controllo
});

onUnmounted(() => {
    if (unsubscribe) unsubscribe();
    if (timeoutId) clearTimeout(timeoutId);
});

watch(() => props.post.id, (newId) => {
    setupPostListener(newId);
});
watch(livePost, () => {
    checkPollExpiration();
});

const postData = computed(() => livePost.value || props.post);
const isPollExpired = computed(() => isPollExpiredRef.value);

const isOwner = computed(() => auth.currentUser?.uid === postData.value?.authorId);

const parseMarkdown = (text: string) => {
    // Bold, Italic, Underline, Strikethrough, Spoiler, Highlight
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
    text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');    // Italic
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');    // Underline
    text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');    // Strikethrough
    text = text.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text">$1</span>'); // Spoiler
    text = text.replace(/==#(.*?)==(.*?)==/g, (match, p1, p2) => { // Highlight
        return `<mark style="background-color: #${p1};">${p2}</mark>`;
    });
    return text;
};

const totalVotes = computed(() => {
  if (!postData.value?.isPoll || !postData.value?.pollOptions) return 0;
  return postData.value.pollOptions.reduce((sum, option) => sum + option.votes, 0);
});

const userHasVoted = computed(() => {
    if (!postData.value?.isPoll || !postData.value?.pollOptions || !auth.currentUser) return false;
    return postData.value.pollOptions.some(option => option.votedBy?.includes(auth.currentUser.uid));
});

const userVotesIndices = computed(() => {
    if (!userHasVoted.value) return [];
    const indices: number[] = [];
    if (postData.value?.pollOptions) {
        postData.value.pollOptions.forEach((option, index) => {
            if (option.votedBy?.includes(auth.currentUser.uid)) {
                indices.push(index);
            }
        });
    }
    return indices;
});

const showResults = computed(() => {
  if (!postData.value?.isPoll) return false;
  if (!postData.value?.pollSettings) return true;
  if (postData.value.pollSettings.resultsVisibility === 'always') return true;
  return userHasVoted.value || isPollExpired.value;
});

const handleVoteOnPoll = (selectedIndex: number) => {
  if (isPollExpired.value) {
    return;
  }
  voteOnPoll(selectedIndex);
};

const voteOnPoll = async (selectedIndex: number) => {
  if (!auth.currentUser || !postData.value) return;
  const postRef = doc(db, "posts", postData.value.id);
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

const showVoters = async () => {
  if (!postData.value?.pollOptions) return;
  isVotersModalOpen.value = true;
  const allVoterIds = postData.value.pollOptions.flatMap(opt => opt.votedBy || []);
  const uniqueVoterIds = [...new Set(allVoterIds)];

  if (uniqueVoterIds.length === 0) {
    votersList.value = postData.value.pollOptions.map(option => ({
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

  votersList.value = postData.value.pollOptions.map(option => ({
    optionText: option.text,
    users: (option.votedBy || []).map(id => usersMap.get(id)).filter(Boolean)
  }));
};

const handleEditPost = (postId: string) => {
    router.push({ name: 'CreatePost', params: { postId } });
};

const handleSaveClick = async () => {
  if (!postData.value || editedText.value.trim() === postData.value.text) {
    isEditing.value = false;
    return;
  }
  try {
    const postRef = doc(db, 'posts', postData.value.id);
    await updateDoc(postRef, {
      text: editedText.value.trim(),
      isEdited: true,
      editedAt: Timestamp.now(),
    });
    isEditing.value = false;
  } catch (error) {
    console.error('Errore durante la modifica del post:', error);
  }
};

const handleCancelClick = () => {
  if (postData.value) {
    editedText.value = postData.value.text;
  }
  isEditing.value = false;
};

const handleVote = async (voteType: 'up' | 'down') => {
  if (!auth.currentUser || !postData.value) return;
  const postRef = doc(db, "posts", postData.value.id);
  const userId = auth.currentUser.uid;
  const isUpvoted = postData.value.upvotedBy?.includes(userId);
  const isDownvoted = postData.value.downvotedBy?.includes(userId);

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
</script>

<template>
  <div class="post-detail-card" v-if="postData">
    <PostHeader
      :author-id="postData.authorId"
      :author="postData.author"
      :author-avatar-url="postData.authorAvatarUrl"
      :is-anonymous="postData.isAnonymous"
      :post-id="postData.id"
      @delete-post="emit('delete-post')"
      @edit-post="handleEditPost"
    />
    
    <div v-if="!isEditing">
      <p class="card-text" v-html="parseMarkdown(postData.text)"></p>
    </div>
    <div v-else>
      <textarea v-model="editedText" class="edit-textarea"></textarea>
      <div class="edit-actions">
        <button @click="handleCancelClick" class="cancel-btn">Annulla</button>
        <button @click="handleSaveClick" class="save-btn">Salva</button>
      </div>
    </div>
    
    <div v-if="postData.mediaUrl" class="media-container">
        <PostMedia 
            :media-url="postData.mediaUrl" 
            :media-type="postData.mediaType" 
            :is-media-spoiler="postData.isMediaSpoiler"
            :post-id="postData.id"
        />
    </div>

    <div v-if="postData.isPoll && postData.pollOptions" class="poll-container">
      <div v-if="postData.pollEndDate && !isPollExpired" class="poll-end-date">
          Scade il: {{ postData.pollEndDate.toDate().toLocaleString() }}
      </div>
      <div v-if="isPollExpired" class="poll-expired-message">
          Sondaggio terminato.
      </div>
      <div 
        v-for="(option, index) in postData.pollOptions" 
        :key="index"
        class="poll-option"
        :class="{ 'is-voted-by-user': userVotesIndices.includes(index), 'disabled': isPollExpired }"
        @click="handleVoteOnPoll(index)"
      >
        <div v-if="showResults" class="poll-bar" :style="{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }"></div>
        <div class="poll-info">
          <div class="poll-text-wrapper">
            <CheckCircle v-if="userVotesIndices.includes(index)" :size="16" class="check-icon"/>
            <span class="poll-text">{{ option.text }}</span>
          </div>
          <span v-if="showResults" class="poll-votes">{{ Math.round(totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0) }}%</span>
        </div>
      </div>
      <div class="poll-footer">
        <span class="total-votes">{{ totalVotes }} voti totali</span>
        <button v-if="postData.pollSettings?.voteVisibility === 'public' && userHasVoted" @click="showVoters" class="view-voters-btn">
          <Eye :size="14"/>
          <span>Vedi voti</span>
        </button>
      </div>
       <p v-if="!showResults" class="results-hidden-text">I risultati saranno visibili dopo il voto.</p>
    </div>

    <div class="card-footer">
      <div class="voting">
        <ArrowUp 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'upvoted': postData.upvotedBy?.includes(auth.currentUser?.uid) }"
          @click="handleVote('up')" 
        />
        <span class="score">{{ postData.score }} punti</span>
        <ArrowDown 
          :size="22" 
          class="icon vote-icon" 
          :class="{ 'downvoted': postData.downvotedBy?.includes(auth.currentUser?.uid) }"
          @click="handleVote('down')" 
        />
      </div>
      <div class="comments-count">
        <MessageCircle :size="20" class="icon" />
        <span>{{ postData.commentsCount }}</span>
      </div>
    </div>
    
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
      <span class="created-label">
        {{ formatTimeAgo(postData.createdAt) }}
        <span v-if="postData.isEdited" class="edited-label"> (modificato {{ formatTimeAgo(postData.editedAt) }})</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.post-detail-card {
  background-color: #2a2a2a; border-radius: 12px; padding: 1.5rem;
  margin-bottom: 2rem; border: 1px solid #363636;
}
.card-text { 
  color: #e0e0e0; line-height: 1.6; font-size: 1rem; 
  white-space: pre-wrap; margin-top: 1rem; word-wrap: break-word; 
}
.card-text ::v-deep b, .card-text ::v_deep .spoiler-text {
  word-break: break-word;
  overflow-wrap: break-word;
}
.voting, .comments-count { display: flex; align-items: center; gap: 0.75rem; }
.score { font-weight: bold; font-size: 1rem; min-width: 60px; text-align: center; }
.icon { cursor: pointer; transition: color 0.2s; }
.icon:hover { color: #fff; }
.vote-icon:hover { transform: scale(1.1); }
.vote-icon.upvoted { color: #22c55e; }
.vote-icon.downvoted { color: #ef4444; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  color: #a0a0a0;
}
.menu-container { position: relative; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0; background-color: #363636;
  border-radius: 6px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10; width: 150px;
}
.menu-item {
  display: flex; align-items: center; gap: 0.75rem; background: none; border: none;
  color: #ef4444; padding: 0.5rem; width: 100%; text-align: left;
  border-radius: 4px; cursor: pointer; font-weight: bold;
}
.menu-item:hover { background-color: #4b5563; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

.media-container { position: relative; width: 100%; max-width: 100%; margin-top: 1rem; border-radius: 8px; overflow: hidden; line-height: 0; display: block; }
.post-media { width: 100%; height: auto; max-height: 500px; border-radius: 8px; display: block; }
.post-media.is-spoiler { filter: blur(15px); transition: filter 0.3s ease; }
.post-media.is-spoiler:hover { filter: blur(5px); }
.spoiler-overlay-media { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.6); z-index: 5; cursor: pointer; font-size: 1.2rem; font-weight: bold; color: #fff; transition: all 0.2s ease; }
.spoiler-overlay-media:hover { background-color: rgba(0, 0, 0, 0.8); }

.poll-container { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.poll-expired-message { text-align: center; color: #ef4444; font-style: italic; font-size: 0.9rem; margin-bottom: 1rem; }
.poll-end-date { text-align: center; color: #a0a0a0; font-style: italic; font-size: 0.9rem; margin-bottom: 1rem; }
.poll-option { position: relative; border: 2px solid #363636; background-color: #2a2a2a; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s ease; }
.poll-option.disabled { cursor: not-allowed; opacity: 0.6; }
.poll-option.disabled:hover { border-color: #363636; }
.poll-option:hover { border-color: #4f46e5; }
.poll-option.is-voted-by-user { border-color: #4f46e5; box-shadow: 0 0 10px rgba(79, 70, 229, 0.5); }
.poll-bar { position: absolute; top: 0; left: 0; height: 100%; background: #4f46e5; opacity: 0.3; transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
.poll-info { position: relative; padding: 0.8rem 1rem; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; color: #fff; font-weight: bold; }
.poll-text-wrapper { display: flex; align-items: flex-start; gap: 0.5rem; flex-grow: 1; min-width: 0; word-break: break-word; }
.poll-text { min-width: 0; word-break: break-word; }
.poll-votes { font-size: 0.9rem; color: #a0a0a0; font-weight: bold; flex-shrink: 0; }
.results-hidden-text { font-size: 0.8rem; text-align: center; color: #a0a0a0; margin-top: 0.5rem; }
.poll-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; color: #a0a0a0; }
.total-votes { font-size: 0.8rem; color: #a0a0a0; }
.view-voters-btn { background: none; border: none; color: #a0a0a0; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: color 0.2s; }
.view-voters-btn:hover { color: #fff; }

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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

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