<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, deleteDoc, updateDoc, arrayRemove, arrayUnion, increment, onSnapshot, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'vue-router';
import { X, CheckCircle, Eye, Repeat } from 'lucide-vue-next';
import { type Post, type UserProfile } from '../types';
import PostHeader from './PostHeader.vue';
import PostMedia from './PostMedia.vue';
import PostFooter from './PostFooter.vue';
import RepostListModal from './RepostListModal.vue';
import ConfirmRepostModal from './ConfirmRepostModal.vue'; // Import new modal
import { formatTimeAgo } from '../utils/dateUtils';
import { parseText, handleMentionClick } from '../utils/textParser';

interface PostWithAuthor extends Post {
  authorProfile?: UserProfile;
}

const props = defineProps<{ post: PostWithAuthor }>();
const router = useRouter();

const livePost = ref<PostWithAuthor | null>(null);
const originalPost = ref<PostWithAuthor | null>(null); // For reposts
const isLoadingOriginal = ref(false);
const parsedPostText = ref('');
const loggedInUserProfile = ref<UserProfile | null>(null);
const isRepostListModalOpen = ref(false);
const isConfirmRepostModalOpen = ref(false); // For new modal
const isReposting = ref(false); // To show loading state in modal

let postUnsubscribe: (() => void) | null = null;
let userUnsubscribe: (() => void) | null = null;
let timeoutId: number | null = null;

watch(() => livePost.value?.text, async (newText) => {
  const textToParse = newText || props.post.text;
  if (textToParse) {
    parsedPostText.value = await parseText(textToParse);
  } else {
    parsedPostText.value = '';
  }
}, { immediate: true });

const isVotersModalOpen = ref(false);
const votersList = ref<{ optionText: string, users: {id: string, username: string, avatarUrl: string}[] }[]>([]);
const isPollExpiredRef = ref(false);

const setupPostListener = (id: string) => {
  if (postUnsubscribe) postUnsubscribe();
  const postRef = doc(db, 'posts', id);
  postUnsubscribe = onSnapshot(postRef, (docSnap) => {
    if (docSnap.exists()) {
      livePost.value = { ...props.post, ...docSnap.data(), id: docSnap.id } as PostWithAuthor;
    } else {
      livePost.value = null;
    }
  });
};

const setupLoggedInUserListener = (uid: string | null) => {
    if (userUnsubscribe) userUnsubscribe();
    if (uid) {
        const userRef = doc(db, 'users', uid);
        userUnsubscribe = onSnapshot(userRef, (docSnap) => {
            loggedInUserProfile.value = docSnap.exists() ? docSnap.data() as UserProfile : null;
        });
    } else {
        loggedInUserProfile.value = null;
    }
};

const setupPollExpirationTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const postData = livePost.value || props.post;
    if (!postData.isPoll || !postData.pollEndDate) {
        isPollExpiredRef.value = false;
        return;
    }

    const now = new Date();
    const endDate = postData.pollEndDate.toDate();
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
  setupPollExpirationTimeout();
  auth.onAuthStateChanged(user => {
      setupLoggedInUserListener(user ? user.uid : null);
  });
});

onUnmounted(() => {
  if (postUnsubscribe) postUnsubscribe();
  if (userUnsubscribe) userUnsubscribe();
  if (timeoutId) clearTimeout(timeoutId);
});

watch(() => props.post.id, (newId) => {
  setupPostListener(newId);
});
watch(livePost, () => {
    setupPollExpirationTimeout();
});

watch(() => props.post.repostOf, async (repostOfId) => {
    if (repostOfId) {
        isLoadingOriginal.value = true;
        const postRef = doc(db, "posts", repostOfId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = { ...postSnap.data(), id: postSnap.id } as Post;
            const authorRef = doc(db, "users", postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
                postData.authorProfile = authorSnap.data() as UserProfile;
            }
            originalPost.value = postData as PostWithAuthor;
        }
        isLoadingOriginal.value = false;
    }
}, { immediate: true });

const postData = computed(() => originalPost.value || livePost.value || props.post);
const isPollExpired = computed(() => isPollExpiredRef.value);

const isPostSaved = computed(() => {
    if (!loggedInUserProfile.value?.savedPosts) return false;
    return loggedInUserProfile.value.savedPosts.includes(props.post.id);
});

const totalVotes = computed(() => {
  if (!postData.value.isPoll || !postData.value.pollOptions) return 0;
  return postData.value.pollOptions.reduce((sum, option) => sum + option.votes, 0);
});

const userHasVoted = computed(() => {
    if (!postData.value.isPoll || !postData.value.pollOptions || !auth.currentUser) return false;
    return postData.value.pollOptions.some(option => option.votedBy?.includes(auth.currentUser!.uid));
});

const userVotesIndices = computed(() => {
    if (!userHasVoted.value) return [];
    const indices: number[] = [];
    if (postData.value.pollOptions) {
        postData.value.pollOptions.forEach((option, index) => {
            if (option.votedBy?.includes(auth.currentUser!.uid)) {
                indices.push(index);
            }
        });
    }
    return indices;
});

const showResults = computed(() => {
  if (!postData.value.isPoll) return false;
  if (!postData.value.pollSettings) return true;
  if (postData.value.pollSettings.resultsVisibility === 'always') return true;
  return userHasVoted.value || isPollExpired.value;
});

const handleVoteOnPoll = (selectedIndex: number) => {
  if (isPollExpired.value) return;
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
      currentOptions[selectedIndex].votedBy = currentOptions[selectedIndex].votedBy.filter((id: string) => id !== userId);
    } else {
      currentOptions[selectedIndex].votes++;
      if (!currentOptions[selectedIndex].votedBy) currentOptions[selectedIndex].votedBy = [];
      currentOptions[selectedIndex].votedBy.push(userId);
    }
  } else {
    const previousVoteIndex = currentOptions.findIndex((opt: any) => opt.votedBy?.includes(userId));
    if (previousVoteIndex === selectedIndex) return;
    if (previousVoteIndex !== -1) {
      currentOptions[previousVoteIndex].votes--;
      currentOptions[previousVoteIndex].votedBy = currentOptions[previousVoteIndex].votedBy.filter((id: string) => id !== userId);
    }
    currentOptions[selectedIndex].votes++;
    if (!currentOptions[selectedIndex].votedBy) currentOptions[selectedIndex].votedBy = [];
    currentOptions[selectedIndex].votedBy.push(userId);
  }
  await updateDoc(postRef, { pollOptions: currentOptions });
};

const handleVote = async (voteType: 'up' | 'down') => {
  if (!auth.currentUser) return;
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

const handleToggleSave = async () => {
    const user = auth.currentUser;
    if (!user) return; // Or prompt to login
    const userRef = doc(db, 'users', user.uid);
    if (isPostSaved.value) {
        await updateDoc(userRef, { savedPosts: arrayRemove(props.post.id) });
    } else {
        await updateDoc(userRef, { savedPosts: arrayUnion(props.post.id) });
    }
};

const handleRepost = () => {
    if (!auth.currentUser) {
        alert("Devi essere loggato per repostare.");
        return;
    }
    isConfirmRepostModalOpen.value = true;
};

const executeRepost = async () => {
    isReposting.value = true;
    try {
        const functions = getFunctions();
        const repostPostFn = httpsCallable(functions, 'repostPost');
        await repostPostFn({ originalPostId: postData.value.id });
        // alert("Post repostato con successo!");
    } catch (error: any) {
        console.error("Errore durante il repost:", error);
        alert(`Errore: ${error.message}`);
    } finally {
        isReposting.value = false;
        isConfirmRepostModalOpen.value = false;
    }
};

const handleDeletePost = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;
    try {
        await deleteDoc(doc(db, "posts", postData.value.id));
    } catch (error) {
        console.error("Errore durante l'eliminazione del post:", error);
    }
};

const handleShowReposts = () => {
    isRepostListModalOpen.value = true;
};

const showVoters = async () => {
  if (!postData.value.pollOptions) return;
  isVotersModalOpen.value = true;
  const allVoterIds = postData.value.pollOptions.flatMap(opt => opt.votedBy || []);
  const uniqueVoterIds = [...new Set(allVoterIds)];

  if (uniqueVoterIds.length === 0) {
    votersList.value = postData.value.pollOptions.map(option => ({ optionText: option.text, users: [] }));
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

const onTextClick = (event: MouseEvent) => {
    handleMentionClick(event, router);
    if (!(event.target as HTMLElement).closest('a[data-mention="true"]')) {
        router.push({ name: 'PostView', params: { postId: postData.value.id } });
    }
};
</script>

<template>
  <div class="post-card">
    <div v-if="post.repostOf" class="repost-header">
      <Repeat :size="16" class="repost-icon" />
      <span>Repostato da <router-link :to="{ name: 'Profile', params: { userId: post.authorId } }" class="repost-author">@{{ post.author }}</router-link></span>
    </div>

    <div v-if="isLoadingOriginal" class="loading-original">Caricamento...</div>
    <template v-else>
      <PostHeader
        :author-id="postData.authorId"
        :author="postData.author"
        :author-avatar-url="postData.authorProfile?.avatarUrl"
        :author-primary-official-badge="postData.authorProfile?.primaryOfficialBadge"
        :author-primary-custom-badge-id="postData.authorProfile?.primaryCustomBadge"
        :is-anonymous="postData.isAnonymous"
        :post-id="postData.id"
        :channel="postData.channel"
        @delete-post="handleDeletePost"
        @edit-post="handleEditPost"
    />

    <p class="card-text" @click="onTextClick" v-html="parsedPostText"></p>

    <PostMedia
      :media-url="postData.mediaUrl"
      :media-type="postData.mediaType"
      :is-media-spoiler="postData.isMediaSpoiler"
      :post-id="postData.id"
    />

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

    <PostFooter
      :score="postData.score"
      :comments-count="postData.commentsCount"
      :upvoted-by="postData.upvotedBy || []"
      :downvoted-by="postData.downvotedBy || []"
      :is-saved="isPostSaved"
      :reposts-count="postData.repostsCount || 0"
      :reposted-by="postData.repostedBy || []"
      @vote="handleVote"
      @toggle-save="handleToggleSave"
      @repost="handleRepost"
      @show-reposts="handleShowReposts"
      @go-to-post="router.push({ name: 'PostView', params: { postId: postData.id } })"
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
      <span class="created-label">
        {{ formatTimeAgo(postData.createdAt) }}
        <span v-if="postData.isEdited" class="edited-label"> (modificato {{ formatTimeAgo(postData.editedAt) }})</span>
      </span>
    </div>
    </template>

    <RepostListModal 
      :show="isRepostListModalOpen"
      :post-id="postData.id"
      @close="isRepostListModalOpen = false"
    />

    <ConfirmRepostModal
      :show="isConfirmRepostModalOpen"
      :is-loading="isReposting"
      @close="isConfirmRepostModalOpen = false"
      @confirm="executeRepost"
    />

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
  overflow: visible; /* Changed from overflow-x: hidden */
}
.card-text {
  color: #e0e0e0;
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-wrap;
  cursor: pointer;
  word-wrap: break-word;
}
.card-text ::v-deep b, .card-text ::v-deep .spoiler-text, .card-text ::v-deep .mention {
  word-break: break-word;
  overflow-wrap: break-word;
}
.card-text ::v-deep b {
  color: #fff;
  font-weight: bold;
}
.card-text ::v-deep .spoiler-text {
  background-color: #4b5563;
  color: #4b5563;
  user-select: none;
  transition: all 0.3s ease;
  padding: 0 0.25rem;
  border-radius: 4px;
}
.card-text ::v-deep .spoiler-text:hover {
  color: #fff;
  background-color: transparent;
}
.card-text ::v-deep i {
  font-style: italic;
}
.card-text ::v-deep u {
  text-decoration: underline;
}
.card-text ::v-deep s {
  text-decoration: line-through;
}
.card-text ::v-deep mark {
  color: #000;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
}
.card-text ::v-deep .mention {
  color: #818cf8;
  font-weight: bold;
  background-color: rgba(79, 70, 229, 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}
.card-text ::v-deep .mention:hover {
    text-decoration: underline;
}
.poll-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.poll-expired-message { text-align: center; color: #ef4444; font-style: italic; font-size: 0.9rem; margin-bottom: 1rem; }
.poll-end-date { text-align: center; color: #a0a0a0; font-style: italic; font-size: 0.9rem; margin-bottom: 1rem; }
.poll-option {
  position: relative;
  border: 2px solid #363636;
  background-color: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}
.poll-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.poll-option.disabled:hover {
  border-color: #363636;
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

.repost-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #363636;
}
.repost-icon {
  flex-shrink: 0;
}
.repost-author {
  color: #c0c0c0;
  font-weight: bold;
  text-decoration: none;
}
.repost-author:hover {
  text-decoration: underline;
}
.loading-original {
  text-align: center;
  padding: 2rem;
  color: #a0a0a0;
}
</style>