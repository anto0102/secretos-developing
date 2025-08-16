<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted } from 'vue';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, deleteDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'vue-router'; 
import { ArrowLeft } from 'lucide-vue-next';
import { type Post } from '../types';

// Importa i nuovi componenti
import PostDetail from '../components/PostDetail.vue';
import CommentForm from '../components/CommentForm.vue';
import CommentItem from '../components/CommentItem.vue';

const props = defineProps<{ postId: string }>();

const router = useRouter();
const post = ref<Post | null>(null);
const comments = ref<any[]>([]);
const isLoadingPost = ref(true);
const isLoadingComments = ref(true);

let unsubscribeComments: () => void;

onMounted(async () => {
    // 1. Carichiamo il post
    const postRef = doc(db, "posts", props.postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
        post.value = { id: postSnap.id, ...postSnap.data() } as Post;
    } else {
        console.error("Post non trovato!");
        router.push('/');
    }
    isLoadingPost.value = false;

    // 2. Ascoltiamo i commenti in tempo reale e recuperiamo i dati degli utenti
    const commentsCollectionRef = collection(db, "comments");
    const q = query(
        commentsCollectionRef,
        where("postId", "==", props.postId),
        orderBy("createdAt", "asc")
    );

    unsubscribeComments = onSnapshot(q, async (snapshot) => {
        isLoadingComments.value = true; // Impostiamo a true ogni volta che c'è un aggiornamento

        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Verifica se ci sono commenti prima di procedere
        if (commentsData.length === 0) {
            comments.value = [];
            isLoadingComments.value = false;
            return;
        }

        const userIds = commentsData.map(comment => comment.authorId);
        
        // Risolvi il problema del caricamento recuperando i dati degli utenti in modo efficiente
        const uniqueUserIds = [...new Set(userIds)];
        const userPromises = uniqueUserIds.map(uid => getDoc(doc(db, "users", uid)));
        const userDocs = await Promise.all(userPromises);

        const usersMap = new Map();
        userDocs.forEach(userDoc => {
            if (userDoc.exists()) {
                usersMap.set(userDoc.id, userDoc.data());
            }
        });

        comments.value = commentsData.map(comment => {
            const user = usersMap.get(comment.authorId);
            return {
                ...comment,
                authorUsername: user?.username || 'Anonimo',
                authorAvatarUrl: user?.avatarUrl || '',
                upvotedBy: comment.upvotedBy || [],
                downvotedBy: comment.downvotedBy || [],
                score: comment.score || 0
            };
        });
        
        isLoadingComments.value = false; // Impostiamo a false solo dopo che tutti i dati sono stati elaborati
    });
});

onUnmounted(() => {
    if (unsubscribeComments) unsubscribeComments();
});

const handleVotePost = async (voteType: 'up' | 'down') => {
    if (!auth.currentUser) {
        alert("Devi aver effettuato l'accesso per votare!");
        return;
    }
    const postRef = doc(db, "posts", props.postId);
    const userId = auth.currentUser.uid;

    if (voteType === 'up') {
        if (post.value?.upvotedBy?.includes(userId)) {
            await updateDoc(postRef, { upvotedBy: arrayRemove(userId), score: increment(-1) });
        } else if (post.value?.downvotedBy?.includes(userId)) {
            await updateDoc(postRef, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId), score: increment(2) });
        } else {
            await updateDoc(postRef, { upvotedBy: arrayUnion(userId), score: increment(1) });
        }
    } else if (voteType === 'down') {
        if (post.value?.downvotedBy?.includes(userId)) {
            await updateDoc(postRef, { downvotedBy: arrayRemove(userId), score: increment(1) });
        } else if (post.value?.upvotedBy?.includes(userId)) {
            await updateDoc(postRef, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId), score: increment(-2) });
        } else {
            await updateDoc(postRef, { downvotedBy: arrayUnion(userId), score: increment(-1) });
        }
    }
};

const handleDeletePost = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo post? L'azione è irreversibile.")) return;
    try {
        const postRef = doc(db, "posts", props.postId);
        await deleteDoc(postRef);
        router.push('/');
    } catch (error) {
        console.error("Errore durante l'eliminazione del post:", error);
        alert("Si è verificato un errore durante l'eliminazione del post.");
    }
};

const handleSubmitComment = async (commentText: string) => {
    if (commentText.trim() === '') return;
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere loggato per commentare!");
        return;
    }

    try {
        await addDoc(collection(db, "comments"), {
            postId: props.postId,
            authorId: user.uid,
            text: commentText,
            createdAt: serverTimestamp(),
            score: 0,
            upvotedBy: [],
            downvotedBy: []
        });

        const postRef = doc(db, "posts", props.postId);
        await updateDoc(postRef, { commentsCount: increment(1) });
    } catch (error) {
        console.error("Errore nell'invio del commento:", error);
    }
};

const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    if (!auth.currentUser) {
        alert("Devi aver effettuato l'accesso per votare!");
        return;
    }
    const commentRef = doc(db, "comments", commentId);
    const userId = auth.currentUser.uid;
    const commentToUpdate = comments.value.find(c => c.id === commentId);

    if (!commentToUpdate) return;

    const isUpvoted = commentToUpdate.upvotedBy?.includes(userId);
    const isDownvoted = commentToUpdate.downvotedBy?.includes(userId);

    if (voteType === 'up') {
        if (isUpvoted) {
            await updateDoc(commentRef, { upvotedBy: arrayRemove(userId), score: increment(-1) });
        } else if (isDownvoted) {
            await updateDoc(commentRef, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId), score: increment(2) });
        } else {
            await updateDoc(commentRef, { upvotedBy: arrayUnion(userId), score: increment(1) });
        }
    } else if (voteType === 'down') {
        if (isDownvoted) {
            await updateDoc(commentRef, { downvotedBy: arrayRemove(userId), score: increment(1) });
        } else if (isUpvoted) {
            await updateDoc(commentRef, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId), score: increment(-2) });
        } else {
            await updateDoc(commentRef, { downvotedBy: arrayUnion(userId), score: increment(-1) });
        }
    }
};
</script>

<template>
  <div class="post-page-container">
    <div class="back-button-container">
        <button @click="router.push('/')" class="back-button">
            <ArrowLeft :size="20" />
            <span>Torna alla Home</span>
        </button>
    </div>

    <div v-if="isLoadingPost" class="loading">Caricamento post...</div>
    <div v-else-if="post">
      <PostDetail :post="post" @vote="handleVotePost" @delete-post="handleDeletePost" />

      <div class="comments-container">
        <CommentForm @submit-comment="handleSubmitComment" />

        <div class="comments-list-section">
          <h3>Commenti ({{ comments.length }})</h3>
          <div v-if="isLoadingComments" class="loading">Caricamento commenti...</div>
          <div v-else-if="comments.length === 0" class="no-comments">
              Nessun commento ancora. Sii il primo a commentare!
          </div>
          <div v-else class="comments-list">
            <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" @vote-comment="(voteType) => handleVoteComment(comment.id, voteType)" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="error-message">Post non trovato.</div>
  </div>
</template>

<style scoped>
.post-page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}
.back-button-container {
    padding: 0 1.5rem;
    margin-bottom: 1rem;
}
.back-button {
    background-color: transparent;
    color: #a0a0a0;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}
.back-button:hover {
    background-color: #2a2a2a;
    color: #fff;
}
.loading, .error-message, .no-comments {
  text-align: center;
  color: #a0a0a0;
  padding: 2rem;
}
.comments-container {
  background-color: #2a2a2a;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #363636;
}
.comments-form-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #363636;
}
.comments-list-section {
  margin-top: 1.5rem;
}
.comments-list-section h3 {
  font-size: 1.25rem;
  color: #fff;
  margin-top: 0;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>