<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { db, auth } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, increment, deleteDoc, getDoc as getFirestoreDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { type Comment } from '../types';
import { Loader, Sparkles, Flame } from 'lucide-vue-next';
import CommentItem from '../components/CommentItem.vue';
import CommentForm from '../components/CommentForm.vue';
import { createNotification } from '../firebase/notifications';

const props = defineProps<{ postId: string, commentId?: string }>();

const comments = ref<Comment[]>([]);
const isLoading = ref(true);
const errorMsg = ref('');
const currentUser = ref<{ username: string, avatarUrl: string } | null>(null);
const postAuthorDetails = ref<{ id: string, isAnonymous: boolean, gender?: string, birthdate?: string } | null>(null);
const replyingTo = ref<Comment | null>(null);
const activeFilter = ref<'new' | 'viral'>('new');
const highlightedCommentId = ref<string | null>(null);

const fetchCurrentUser = async () => {
  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getFirestoreDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      currentUser.value = { username: data.username, avatarUrl: data.avatarUrl };
    }
  }
};

const calculateAge = (birthdate: string): number | null => {
  if (!birthdate) return null;
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const fetchComments = async (id: string, filter: 'new' | 'viral' = 'new') => {
    isLoading.value = true;
    errorMsg.value = '';
    comments.value = [];
    try {
        const postDocRef = doc(db, "posts", id);
        const postDocSnap = await getFirestoreDoc(postDocRef);
        if (postDocSnap.exists()) {
            const postData = postDocSnap.data();
            postAuthorDetails.value = {
                id: postData.authorId,
                isAnonymous: postData.isAnonymous,
                gender: postData.anonymousAuthorGender,
                birthdate: postData.anonymousAuthorBirthdate
            };
        } else {
            errorMsg.value = "Post non trovato.";
            return;
        }

        const commentsRef = collection(db, "comments");
        const orderByField = filter === 'viral' ? 'score' : 'createdAt';
        const q = query(commentsRef, where("postId", "==", id), orderBy(orderByField, "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        const authorIds = new Set(querySnapshot.docs.map(doc => doc.data().authorId));
        const userDocs = await Promise.all([...authorIds].map(uid => getFirestoreDoc(doc(db, "users", uid))));
        const userMap = new Map<string, any>();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) userMap.set(userDoc.id, userDoc.data());
        });

        querySnapshot.docs.forEach(d => {
            const commentData = { ...d.data(), id: d.id, replies: [] } as Comment;
            const userData = userMap.get(commentData.authorId);
            commentData.authorUsername = userData?.username || 'Utente Sconosciuto';
            commentData.authorAvatarUrl = userData?.avatarUrl || '';

            if (postAuthorDetails.value?.isAnonymous && postAuthorDetails.value?.id === commentData.authorId) {
                const age = postAuthorDetails.value.birthdate ? `di ${calculateAge(postAuthorDetails.value.birthdate)} anni` : '';
                let gender = '';
                if (postAuthorDetails.value.gender === 'male') gender = 'Uomo';
                else if (postAuthorDetails.value.gender === 'female') gender = 'Donna';
                else gender = 'Persona';
                commentData.authorUsername = `${gender} ${age}`.trim();
            }

            commentMap.set(commentData.id, commentData);
        });

        commentMap.forEach(commentData => {
            if (commentData.parentId) {
                const parentComment = commentMap.get(commentData.parentId);
                if (parentComment) {
                    parentComment.replies!.push(commentData);
                }
            } else {
                fetchedComments.push(commentData);
            }
        });

        comments.value = fetchedComments;
        
        if (props.commentId) {
            highlightedCommentId.value = props.commentId;
            await nextTick();
            const el = document.getElementById(`comment-${props.commentId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.classList.add('highlighted');
                setTimeout(() => {
                  el.classList.remove('highlighted');
                }, 3000);
            }
        }

    } catch (e) {
        errorMsg.value = "Errore nel caricamento dei commenti.";
        console.error(e);
    } finally {
        isLoading.value = false;
    }
};

const submitComment = async (text: string) => {
    if (!text.trim()) return;
    const user = auth.currentUser;
    if (!user || !currentUser.value) {
        errorMsg.value = "Devi essere loggato per commentare.";
        return;
    }
    try {
        const commentData = {
            postId: props.postId,
            authorId: user.uid,
            text,
            createdAt: new Date(),
            score: 0,
            upvotedBy: [],
            downvotedBy: [],
            parentId: replyingTo.value?.id || null
        };
        const newCommentRef = await addDoc(collection(db, "comments"), commentData);

        const postRef = doc(db, "posts", props.postId);
        const postSnap = await getFirestoreDoc(postRef);
        if(postSnap.exists()){
            const postData = postSnap.data();
            const postAuthorId = postData.authorId;
            
            const notificationAuthorName = currentUser.value.username; // Usa sempre il nome utente reale per le notifiche
            const notifiedUsers = new Set<string>(); // Per non notificare lo stesso utente più volte

            // Notifica per commento/risposta
            if (replyingTo.value) {
                if (replyingTo.value.authorId !== user.uid) {
                  const notificationText = `${notificationAuthorName} ha risposto al tuo commento.`;
                  await createNotification(replyingTo.value.authorId, 'reply', props.postId, notificationText, newCommentRef.id);
                  notifiedUsers.add(replyingTo.value.authorId);
                }
            } else if (postAuthorId !== user.uid) {
                const notificationText = `${notificationAuthorName} ha commentato il tuo post.`;
                await createNotification(postAuthorId, 'comment', props.postId, notificationText, newCommentRef.id);
                notifiedUsers.add(postAuthorId);
            }

            // Notifiche per mention
            const mentionRegex = /@(\w+)/g;
            const mentionedUsernames = [...new Set(text.match(mentionRegex)?.map(m => m.substring(1)))];
            if (mentionedUsernames.length > 0) {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "in", mentionedUsernames));
                const usersSnapshot = await getDocs(q);
                
                usersSnapshot.forEach(userDoc => {
                    const mentionedUserId = userDoc.id;
                    if (mentionedUserId !== user.uid && !notifiedUsers.has(mentionedUserId)) {
                        createNotification(
                            mentionedUserId,
                            'mention',
                            props.postId,
                            `${notificationAuthorName} ti ha menzionato in un commento.`,
                            newCommentRef.id
                        );
                        notifiedUsers.add(mentionedUserId);
                    }
                });
            }
        }

        await updateDoc(postRef, { commentsCount: increment(1) });
        await fetchComments(props.postId, activeFilter.value);
        replyingTo.value = null;
    } catch (e) {
        errorMsg.value = "Errore nell'invio del commento.";
        console.error(e);
    }
};

const findAndUpdateComment = (commentsArray: Comment[], commentId: string, newScore: number, upvotedBy: string[], downvotedBy: string[]) => {
  for (const comment of commentsArray) {
    if (comment.id === commentId) {
      comment.score = newScore;
      comment.upvotedBy = upvotedBy;
      comment.downvotedBy = downvotedBy;
      return;
    }
    if (comment.replies) {
      findAndUpdateComment(comment.replies, commentId, newScore, upvotedBy, downvotedBy);
    }
  }
};

const voteComment = async (payload: { commentId: string, voteType: 'up' | 'down' }) => {
    if (!auth.currentUser) return;
    const commentRef = doc(db, "comments", payload.commentId);
    const userId = auth.currentUser.uid;
    
    const commentDoc = await getFirestoreDoc(commentRef);
    if (!commentDoc.exists()) return;
    const commentData = commentDoc.data();
    
    let newScore = commentData.score;
    let newUpvotedBy = [...commentData.upvotedBy || []];
    let newDownvotedBy = [...commentData.downvotedBy || []];
    
    const isUpvoted = newUpvotedBy.includes(userId);
    const isDownvoted = newDownvotedBy.includes(userId);

    if (payload.voteType === 'up') {
        if (isUpvoted) {
            newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
            newScore--;
        } else {
            newUpvotedBy.push(userId);
            if (isDownvoted) {
                newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                newScore += 2;
            } else {
                newScore++;
            }
        }
    } else { // 'down'
        if (isDownvoted) {
            newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
            newScore++;
        } else {
            newDownvotedBy.push(userId);
            if (isUpvoted) {
                newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                newScore -= 2;
            } else {
                newScore--;
            }
        }
    }
    
    await updateDoc(commentRef, { upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy, score: newScore });
    
    findAndUpdateComment(comments.value, payload.commentId, newScore, newUpvotedBy, newDownvotedBy);
};

const deleteComment = async (commentId: string) => {
  if (!confirm("Sei sicuro di voler eliminare questo commento e tutte le sue risposte?")) return;
  try {
    const commentRef = doc(db, "comments", commentId);
    await deleteDoc(commentRef);
    const postRef = doc(db, "posts", props.postId);
    await updateDoc(postRef, { commentsCount: increment(-1) });

    await fetchComments(props.postId, activeFilter.value);
  } catch (error) {
    console.error("Errore durante l'eliminazione del commento:", error);
  }
};

const handleReplyRequest = (comment: Comment) => {
    replyingTo.value = comment;
};

const cancelReply = () => {
    replyingTo.value = null;
};

onMounted(() => {
    fetchCurrentUser();
    fetchComments(props.postId);
});

watch(activeFilter, (newFilter) => {
  fetchComments(props.postId, newFilter);
});

watch(() => props.postId, (newId) => {
    fetchComments(newId, activeFilter.value);
});
</script>

<template>
  <div class="comments-section">
    <div class="filter-tabs">
        <button :class="{ active: activeFilter === 'new' }" @click="activeFilter = 'new'">
            <Sparkles :size="18" />
            <span>Nuovi</span>
        </button>
        <button :class="{ active: activeFilter === 'viral' }" @click="activeFilter = 'viral'">
            <Flame :size="18" />
            <span>Virali</span>
        </button>
    </div>
    
    <div v-if="isLoading" class="loading-state">Caricamento commenti...</div>
    <div v-else-if="errorMsg" class="error-state">{{ errorMsg }}</div>
    <div v-else>
      <div v-if="comments.length === 0" class="empty-state">
        <p>Ancora nessun commento. Sii il primo a commentare!</p>
      </div>
      <div v-else class="comments-list">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :id="`comment-${comment.id}`"
          :post-id="props.postId"
          :post-is-anonymous="postAuthorDetails?.isAnonymous || false"
          :post-author-id="postAuthorDetails?.id || ''"
          @vote-comment="voteComment"
          @delete-comment="deleteComment"
          @reply-request="handleReplyRequest"
        />
      </div>
    </div>
    
    <div v-if="currentUser" class="comment-form-wrapper">
      <CommentForm 
        placeholder="Scrivi un commento..." 
        :replyingTo="replyingTo" 
        @submit-comment="submitComment"
        @cancel-reply="cancelReply"
      />
    </div>
    <div v-else class="login-prompt">
      <p>Devi essere loggato per scrivere un commento. <router-link to="/login">Accedi qui</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.comments-section {
  background-color: #2a2a2a;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid #363636;
}
.loading-state, .error-state, .empty-state, .login-prompt {
  text-align: center;
  padding: 2rem;
  color: #a0a0a0;
}
.comments-list {
  display: flex;
  flex-direction: column;
}
.comment-form-wrapper {
  position: fixed;
  bottom: 0;
  left: 250px;
  right: 0;
  background-color: #1a1a1a;
  border-top: 1px solid #363636;
  padding: 0.75rem 1.5rem;
  z-index: 100;
}
@media (max-width: 768px) {
  .comment-form-wrapper { left: 0; }
}
.login-prompt {
  padding: 1rem;
}
.login-prompt a {
  color: #4f46e5;
  text-decoration: underline;
  font-weight: bold;
}
.filter-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.filter-tabs button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid #363636;
  background-color: #2a2a2a;
  color: #a0a0a0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease-in-out;
}
.filter-tabs button:hover {
  background-color: #363636;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.filter-tabs button.active {
  color: #fff;
  background: linear-gradient(45deg, #4f46e5, #818cf8);
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
}
.highlighted {
  background-color: #4f46e5 !important;
  transition: background-color 0.5s ease;
}
</style>