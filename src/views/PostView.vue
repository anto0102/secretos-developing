<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { type Post } from '../types';
import PostDetail from '../components/PostDetail.vue';
import CommentForm from '../components/CommentForm.vue';
import CommentItem from '../components/CommentItem.vue';
import FilterTabs from '../components/FilterTabs.vue';

const props = defineProps<{ postId: string }>();
const router = useRouter();
const post = ref<Post | null>(null);
const comments = ref<any[]>([]);
const isLoadingPost = ref(true);
const isLoadingComments = ref(true);
const activeFilter = ref<'viral' | 'new'>('viral');
const replyingToComment = ref<{ parentId: string, authorUsername: string } | null>(null);

// Refs per l'header sticky
const isHeaderSticky = ref(false);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver;

let unsubscribeComments: () => void;

const countCommentsRecursively = (commentList: any[]): number => { return commentList.reduce((acc, comment) => { return acc + 1 + (comment.replies ? countCommentsRecursively(comment.replies) : 0); }, 0); };
const totalCommentsCount = computed(() => countCommentsRecursively(comments.value));
const findCommentInTree = (tree: any[], commentId: string): any => { for (const comment of tree) { if (comment.id === commentId) return comment; if (comment.replies?.length) { const found = findCommentInTree(comment.replies, commentId); if (found) return found; } } return null; };
const deleteCommentFromTree = (tree: any[], commentId: string): boolean => { const index = tree.findIndex(c => c.id === commentId); if (index !== -1) { tree.splice(index, 1); return true; } for (const comment of tree) { if (comment.replies?.length) { if (deleteCommentFromTree(comment.replies, commentId)) return true; } } return false; };

onMounted(async () => {
    const postRef = doc(db, "posts", props.postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        post.value = { id: postSnap.id, ...postSnap.data() } as Post;
    } else {
        router.push('/');
    }
    isLoadingPost.value = false;

    // Imposta l'Intersection Observer per l'header sticky
    nextTick(() => {
        if (sentinelRef.value) {
            // L'observer si attiva quando l'elemento "sentinella" entra o esce dalla vista
            observer = new IntersectionObserver(([entry]) => {
                // Se non sta intersecando (cioè è fuori schermo), allora l'header è sticky
                isHeaderSticky.value = !entry.isIntersecting;
            }, { 
                rootMargin: "-1px 0px 0px 0px", // Si attiva 1px prima che l'header tocchi il bordo
                threshold: [1] 
            });
            observer.observe(sentinelRef.value);
        }
    });
});

watch(activeFilter, () => { if (unsubscribeComments) unsubscribeComments(); isLoadingComments.value = true; const orderByField = activeFilter.value === 'viral' ? 'score' : 'createdAt'; const q = query(collection(db, "comments"), where("postId", "==", props.postId), orderBy(orderByField, "desc")); unsubscribeComments = onSnapshot(q, async (snapshot) => { const allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); const userIds = [...new Set(allComments.map(c => c.authorId).filter(Boolean))]; const usersMap = new Map(); if (userIds.length > 0) { const userDocs = await Promise.all(userIds.map(uid => getDoc(doc(db, "users", uid as string)))); userDocs.forEach(userDoc => { if (userDoc.exists()) usersMap.set(userDoc.id, userDoc.data()); }); } const commentsWithAuthors = allComments.map(comment => ({ ...comment, authorUsername: usersMap.get(comment.authorId)?.username || 'Anonimo', authorAvatarUrl: usersMap.get(comment.authorId)?.avatarUrl || '', replies: [] })); const commentMap = new Map(commentsWithAuthors.map(c => [c.id, c])); const topLevelComments: any[] = []; commentsWithAuthors.forEach(comment => { if (comment.parentId && commentMap.has(comment.parentId)) { commentMap.get(comment.parentId).replies.push(comment); } else { topLevelComments.push(comment); } }); comments.value = topLevelComments; isLoadingComments.value = false; }); }, { immediate: true });
onUnmounted(() => { if (unsubscribeComments) unsubscribeComments(); if (observer) observer.disconnect(); });
const setReplyContext = (parentComment: any) => { replyingToComment.value = { parentId: parentComment.id, authorUsername: parentComment.authorUsername }; };
const cancelReply = () => { replyingToComment.value = null; };
const handleSubmitComment = async (commentText: string) => { const user = auth.currentUser; if (!user) return alert("Devi essere loggato!"); const newCommentData: any = { postId: props.postId, authorId: user.uid, text: commentText, createdAt: serverTimestamp(), score: 0, upvotedBy: [], downvotedBy: [] }; if (replyingToComment.value) { newCommentData.parentId = replyingToComment.value.parentId; } await addDoc(collection(db, "comments"), newCommentData); await updateDoc(doc(db, "posts", props.postId), { commentsCount: increment(1) }); cancelReply(); };
const handleVoteComment = async (payload: {commentId: string, voteType: 'up' | 'down'}) => { const user = auth.currentUser; if (!user) return alert("Devi votare!"); const { commentId, voteType } = payload; const commentToUpdate = findCommentInTree(comments.value, commentId); if (!commentToUpdate) return; const isUpvoted = commentToUpdate.upvotedBy.includes(user.uid); const isDownvoted = commentToUpdate.downvotedBy.includes(user.uid); if (voteType === 'up') { commentToUpdate.score += isUpvoted ? -1 : (isDownvoted ? 2 : 1); commentToUpdate.upvotedBy = isUpvoted ? commentToUpdate.upvotedBy.filter((id: string) => id !== user.uid) : [...commentToUpdate.upvotedBy, user.uid]; if (!isUpvoted && isDownvoted) commentToUpdate.downvotedBy = commentToUpdate.downvotedBy.filter((id: string) => id !== user.uid); } else { commentToUpdate.score += isDownvoted ? 1 : (isUpvoted ? -2 : -1); commentToUpdate.downvotedBy = isDownvoted ? commentToUpdate.downvotedBy.filter((id: string) => id !== user.uid) : [...commentToUpdate.downvotedBy, user.uid]; if (!isDownvoted && isUpvoted) commentToUpdate.upvotedBy = commentToUpdate.upvotedBy.filter((id: string) => id !== user.uid); } await updateDoc(doc(db, "comments", commentId), { score: commentToUpdate.score, upvotedBy: commentToUpdate.upvotedBy, downvotedBy: commentToUpdate.downvotedBy }); };
const handleDeleteComment = async (commentId: string) => { if (!confirm("Sei sicuro?")) return; deleteCommentFromTree(comments.value, commentId); await deleteDoc(doc(db, "comments", commentId)); await updateDoc(doc(db, "posts", props.postId), { commentsCount: increment(-1) }); };
</script>

<template>
  <div class="post-page-layout">
    <div class="header-content">
      <div class="back-button-container">
        <button @click="router.push('/')" class="back-button">
          <ArrowLeft :size="20" /><span>Torna alla Home</span>
        </button>
      </div>
      <div v-if="isLoadingPost" class="loading">Caricamento...</div>
      <PostDetail v-else-if="post" :post="post" />
    </div>

    <div v-if="post" class="comments-scroll-area">
      <div class="comments-container">
        <div ref="sentinelRef" class="sentinel"></div>
        <div class="comments-header" :class="{ 'is-sticky': isHeaderSticky }">
          <h3>Commenti ({{ totalCommentsCount }})</h3>
          <FilterTabs :active-filter="activeFilter" @set-filter="(filter) => activeFilter = filter" />
        </div>
        <div v-if="isLoadingComments" class="loading">...</div>
        <div v-else-if="comments.length > 0" class="comments-list">
          <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" @vote-comment="handleVoteComment" @delete-comment="handleDeleteComment" @reply-request="setReplyContext" />
        </div>
        <div v-else class="no-comments">Nessun commento ancora.</div>
      </div>
    </div>

    <div v-else-if="!isLoadingPost" class="error-message">Post non trovato.</div>
    <div v-else class="loading-placeholder"></div>
    <CommentForm v-if="post" placeholder="Aggiungi un commento..." :replying-to="replyingToComment" @submit-comment="handleSubmitComment" @cancel-reply="cancelReply" />
  </div>
</template>

<style scoped>
.post-page-layout { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
.header-content { flex-shrink: 0; padding: 1.5rem 1.5rem 0 1.5rem; }
.comments-scroll-area { flex-grow: 1; overflow-y: auto; padding: 0 1.5rem; padding-bottom: 150px; }
.back-button-container { padding: 0 1.5rem; margin-bottom: 1rem; }
.back-button { background: none; border: none; color: #a0a0a0; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: bold; padding: 0.5rem; border-radius: 999px; transition: background-color 0.2s, color 0.2s; }
.back-button:hover { background-color: #2a2a2a; color: #fff; }
.loading, .no-comments, .error-message { text-align: center; color: #a0a0a0; padding: 2rem; }
.loading-placeholder { flex-grow: 1; }
.comments-container { background-color: #2a2a2a; border-radius: 12px; margin-top: 2rem; border: 1px solid #363636; position: relative; }

/* --- STILI PERFEZIONATI --- */
.sentinel { position: absolute; top: 0; height: 1px; width: 100%; z-index: -1; }

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: #2a2a2a;
  z-index: 10;
  padding: 1.5rem;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease-in-out;
}

.comments-header.is-sticky {
  padding: 0.75rem 1.5rem; /* Più sottile */
  background-color: rgba(42, 42, 42, 0.8); /* Più trasparente */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #363636;
  /* La magia: gli angoli si arrotondano quando diventa sticky */
  border-radius: 12px;
  /* Lo spostiamo leggermente per un effetto fluttuante */
  transform: translateY(0.5rem);
}

.comments-header h3 { font-size: 1.25rem; color: #fff; margin: 0; }
.comments-list { display: flex; flex-direction: column; padding: 0 1.5rem 1.5rem 1.5rem; }
</style>