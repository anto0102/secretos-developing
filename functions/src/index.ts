import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, HttpsError} from "firebase-functions/v2/https";
// import {onUserDeleted, UserEvent} from "firebase-functions/v2/auth"; // Commented out due to module resolution issues
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();
const db = admin.firestore();

/**
 * Funzione helper per assegnare un badge a un utente.
 * @param {string} userId L'ID dell'utente.
 * @param {string} badgeId L'ID del badge da assegnare.
 */
const grantBadge = async (userId: string, badgeId: string) => {
  const userRef = db.collection("users").doc(userId);
  try {
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData) {
        const userBadges = userData.badges || [];
        if (!userBadges.includes(badgeId)) {
          await userRef.update({
            badges: admin.firestore.FieldValue.arrayUnion(badgeId),
          });
          logger.log(`Badge '${badgeId}' assegnato a ${userId}`);
        }
      }
    }
  } catch (error) {
    logger.error(
      `Errore nell'assegnare il badge '${badgeId}' a ${userId}:`,
      error,
    );
  }
};

// --- FUNZIONI PER I BADGE (EVENT-DRIVEN) ---

export const onPostCreate = onDocumentCreated("posts/{postId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    return;
  }
  const postData = snap.data();
  const userId = postData.authorId;

  const userPostsQuery = db.collection("posts")
    .where("authorId", "==", userId);
  const userPostsSnap = await userPostsQuery.get();

  if (userPostsSnap.size === 1) {
    await grantBadge(userId, "pioneer");
  }
});

export const onCommentCreate = onDocumentCreated("comments/{commentId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    return;
  }
  const commentData = snap.data();
  const userId = commentData.authorId;

  const userCommentsQuery = db.collection("comments")
    .where("authorId", "==", userId);
  const userCommentsSnap = await userCommentsQuery.get();

  if (userCommentsSnap.size === 50) {
    await grantBadge(userId, "chatterbox");
  }
});

export const onPostUpdate = onDocumentUpdated("posts/{postId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after || after.score <= before.score) {
    return;
  }

  const userId = after.authorId;

  if (after.score >= 100 && before.score < 100) {
    await grantBadge(userId, "popular");
  }

  if (after.score >= 500 && before.score < 500) {
    await grantBadge(userId, "king");
  }
});

// --- FUNZIONE PER IL FOLLOW ---

export const toggleFollow = onCall(async (request) => {
  const currentUserId = request.auth?.uid;
  const targetUserId = request.data.userId;

  if (!currentUserId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato per eseguire questa operazione.");
  }
  if (!targetUserId) {
    throw new HttpsError("invalid-argument", "L'ID dell'utente target è mancante.");
  }
  if (currentUserId === targetUserId) {
    throw new HttpsError("invalid-argument", "Non puoi seguire te stesso.");
  }

  const currentUserRef = db.collection("users").doc(currentUserId);
  const targetUserRef = db.collection("users").doc(targetUserId);
  const currentUserDoc = await currentUserRef.get();
  const currentUserData = currentUserDoc.data();

  if (!currentUserData) {
    throw new HttpsError("not-found", "Utente corrente non trovato.");
  }

  const isFollowing = currentUserData.following?.includes(targetUserId);
  const batch = db.batch();

  if (isFollowing) {
    batch.update(currentUserRef, {following: admin.firestore.FieldValue.arrayRemove(targetUserId)});
    batch.update(targetUserRef, {followers: admin.firestore.FieldValue.arrayRemove(currentUserId)});
  } else {
    batch.update(currentUserRef, {following: admin.firestore.FieldValue.arrayUnion(targetUserId)});
    batch.update(targetUserRef, {followers: admin.firestore.FieldValue.arrayUnion(currentUserId)});

    const notificationText = `${currentUserData.username} ha iniziato a seguirti.`;
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      recipientId: targetUserId,
      type: "follow",
      postId: currentUserId,
      text: notificationText,
      isRead: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return {success: true, newState: isFollowing ? "unfollowed" : "followed"};
});


// --- FUNZIONE PER LA RETROCOMPATIBILITÀ DEI BADGE ---

export const checkBadgesRetroactively = onCall(async () => {
  logger.log("Inizio controllo retroattivo dei badge per tutti gli utenti.");

  const usersSnapshot = await db.collection("users").get();
  let usersChecked = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userBadges = userDoc.data().badges || [];

    if (!userBadges.includes("pioneer")) {
      const postsSnap = await db.collection("posts").where("authorId", "==", userId).limit(1).get();
      if (postsSnap.size > 0) await grantBadge(userId, "pioneer");
    }

    if (!userBadges.includes("chatterbox")) {
      const commentsSnap = await db.collection("comments").where("authorId", "==", userId).limit(50).get();
      if (commentsSnap.size >= 50) await grantBadge(userId, "chatterbox");
    }

    const userPosts = await db.collection("posts").where("authorId", "==", userId).get();
    let hasPopular = userBadges.includes("popular");
    let hasKing = userBadges.includes("king");

    for (const postDoc of userPosts.docs) {
      const postData = postDoc.data();
      if (!hasPopular && postData.score >= 100) {
        await grantBadge(userId, "popular");
        hasPopular = true;
      }
      if (!hasKing && postData.score >= 500) {
        await grantBadge(userId, "king");
        hasKing = true;
      }
      if (hasPopular && hasKing) break;
    }
    usersChecked++;
  }

  const message = `Controllo retroattivo completato. Utenti analizzati: ${usersChecked}.`;
  logger.log(message);
  return {status: "success", message: message};
});

// --- FUNZIONE PER LA FINE DEI SONDAGGI (CORRETTA E REINSERITA) ---
export const onPollEnd = onSchedule("every 5 minutes", async () => {
  const now = admin.firestore.Timestamp.now();
  const pollsQuery = db.collection("posts")
    .where("isPoll", "==", true)
    .where("pollEndDate", "<=", now)
    .where("pollEndNotified", "==", false);

  const expiredPollsSnapshot = await pollsQuery.get();
  if (expiredPollsSnapshot.empty) {
    logger.log("Nessun sondaggio scaduto da notificare.");
    return;
  }

  const batch = db.batch();

  for (const doc of expiredPollsSnapshot.docs) {
    const post = doc.data();
    const postId = doc.id;
    const allVoterIds = post.pollOptions.flatMap((opt: { votedBy: string[] }) => opt.votedBy || []);
    const uniqueVoterIds = [...new Set(allVoterIds)];

    const text = `Il sondaggio "${post.text.substring(0, 30)}..." è terminato. Vedi i risultati!`;

    uniqueVoterIds.forEach((userId) => {
      const notificationRef = db.collection("notifications").doc();
      batch.set(notificationRef, {
        recipientId: userId,
        type: "poll_end",
        postId,
        text,
        isRead: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    batch.update(doc.ref, {pollEndNotified: true});
  }

  await batch.commit();
  logger.log(`Notifiche inviate per ${expiredPollsSnapshot.size} sondaggi scaduti.`);
});


/*
// --- FUNZIONE PER L'ELIMINAZIONE DELL'ACCOUNT (SINTASSI V2) ---
export const onUserDelete = onUserDeleted(async (event: UserEvent) => {
  const user = event.data;
  const userId = user.uid;
  const batch = db.batch();

  // 1. Elimina il documento dell'utente da Firestore
  const userRef = db.collection("users").doc(userId);
  batch.delete(userRef);

  // 2. Elimina i post dell'utente
  const postsQuery = db.collection("posts").where("authorId", "==", userId);
  const postsSnapshot = await postsQuery.get();
  postsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 3. Elimina i commenti dell'utente
  const commentsQuery = db.collection("comments").where("authorId", "==", userId);
  const commentsSnapshot = await commentsQuery.get();
  commentsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  try {
    await batch.commit();
    logger.log(`Dati per l'utente ${userId} eliminati con successo.`);
  } catch (error) {
    logger.error(`Errore durante l'eliminazione dei dati per l'utente ${userId}:`, error);
  }
});
*/

// --- FUNZIONE PER REPOST ---
export const repostPost = onCall(async (request) => {
  const currentUserId = request.auth?.uid;
  const originalPostId = request.data.originalPostId;

  if (!currentUserId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato per eseguire questa operazione.");
  }
  if (!originalPostId) {
    throw new HttpsError("invalid-argument", "L'ID del post originale è mancante.");
  }

  const postsRef = db.collection("posts");
  const originalPostRef = postsRef.doc(originalPostId);
  const currentUserRef = db.collection("users").doc(currentUserId);

  const [originalPostDoc, currentUserDoc] = await Promise.all([
    originalPostRef.get(),
    currentUserRef.get(),
  ]);

  if (!originalPostDoc.exists) {
    throw new HttpsError("not-found", "Il post originale non esiste più.");
  }
  if (!currentUserDoc.exists) {
    throw new HttpsError("not-found", "Utente non trovato.");
  }

  const originalPostData = originalPostDoc.data();
  const currentUserData = currentUserDoc.data();

  if (!originalPostData || !currentUserData) {
    throw new HttpsError("internal", "Impossibile recuperare i dati necessari.");
  }

  if (originalPostData.repostOf) {
    throw new HttpsError("invalid-argument", "Non puoi repostare un repost.");
  }

  if (originalPostData.authorId === currentUserId) {
    throw new HttpsError("invalid-argument", "Non puoi repostare un tuo stesso post.");
  }

  // Check if user has already reposted
  if (originalPostData.repostedBy?.includes(currentUserId)) {
    throw new HttpsError("already-exists", "Hai già repostato questo post.");
  }

  const newPostData = {
    ...originalPostData,
    authorId: currentUserId,
    author: currentUserData.username,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    repostOf: originalPostId,
    score: 0,
    upvotedBy: [],
    downvotedBy: [],
    commentsCount: 0,
    repostsCount: 0, // A repost doesn't have reposts
    repostedBy: [], // A repost doesn't have reposters
  };

  const batch = db.batch();
  const newPostRef = postsRef.doc();
  batch.set(newPostRef, newPostData);

  // Update the original post
  batch.update(originalPostRef, {
    repostsCount: admin.firestore.FieldValue.increment(1),
    repostedBy: admin.firestore.FieldValue.arrayUnion(currentUserId),
  });

  const notificationText = `${currentUserData.username} ha repostato il tuo post.`;
  const notificationRef = db.collection("notifications").doc();
  batch.set(notificationRef, {
    recipientId: originalPostData.authorId,
    type: "repost",
    postId: newPostRef.id,
    text: notificationText,
    isRead: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {success: true, newPostId: newPostRef.id};
});

// --- FUNZIONI PER BADGE PERSONALIZZATI ---

const MAX_CUSTOM_BADGES = 6;

export const createCustomBadge = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato.");
  }

  const {name, description, imageUrl} = request.data;
  if (!name || !imageUrl) {
    throw new HttpsError("invalid-argument", "Nome e immagine sono obbligatori.");
  }

  const customBadgesRef = db.collection("users").doc(userId).collection("customBadges");
  const snapshot = await customBadgesRef.get();

  if (snapshot.size >= MAX_CUSTOM_BADGES) {
    throw new HttpsError("resource-exhausted", `Puoi avere al massimo ${MAX_CUSTOM_BADGES} badge personalizzati.`);
  }

  const newBadge = {
    name,
    description: description || "",
    imageUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const newBadgeRef = await customBadgesRef.add(newBadge);
  return {success: true, badgeId: newBadgeRef.id};
});

export const updateCustomBadge = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato.");
  }

  const {badgeId, name, description} = request.data;
  if (!badgeId || !name) {
    throw new HttpsError("invalid-argument", "ID badge e nome sono obbligatori.");
  }

  const badgeRef = db.collection("users").doc(userId).collection("customBadges").doc(badgeId);

  // Check ownership by trying to get the doc
  const doc = await badgeRef.get();
  if (!doc.exists) {
    throw new HttpsError("not-found", "Badge non trovato o non hai i permessi per modificarlo.");
  }

  await badgeRef.update({
    name,
    description: description || "",
  });

  return {success: true};
});

export const deleteCustomBadge = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato.");
  }

  const {badgeId} = request.data;
  if (!badgeId) {
    throw new HttpsError("invalid-argument", "ID badge mancante.");
  }

  const badgeRef = db.collection("users").doc(userId).collection("customBadges").doc(badgeId);
  const doc = await badgeRef.get();

  if (!doc.exists) {
    throw new HttpsError("not-found", "Badge non trovato.");
  }

  const imageUrl = doc.data()?.imageUrl;

  await badgeRef.delete();

  // If there's an image URL, try to delete it from Storage
  if (imageUrl) {
    try {
      const decodedUrl = decodeURIComponent(imageUrl.split("?")[0].split("/o/")[1]);
      const fileRef = admin.storage().bucket().file(decodedUrl);
      await fileRef.delete();
      logger.log(`Immagine badge ${badgeId} eliminata da Storage.`);
    } catch (error) {
      logger.error(`Errore durante l'eliminazione dell'immagine badge ${badgeId} da Storage:`, error);
      // Don't throw an error to the client if only image deletion fails
    }
  }

  // Also remove it if it was a primary badge
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  if (userDoc.exists && userDoc.data()?.primaryCustomBadge === badgeId) {
    await userRef.update({primaryCustomBadge: null});
  }

  return {success: true};
});

export const setPrimaryOfficialBadge = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato.");
  }
  const {badgeId} = request.data; // badgeId can be null to unset

  const userRef = db.collection("users").doc(userId);
  await userRef.update({primaryOfficialBadge: badgeId});

  return {success: true};
});

export const setPrimaryCustomBadge = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Devi essere loggato.");
  }
  const {badgeId} = request.data; // badgeId can be null to unset

  const userRef = db.collection("users").doc(userId);
  await userRef.update({primaryCustomBadge: badgeId});

  return {success: true};
});
