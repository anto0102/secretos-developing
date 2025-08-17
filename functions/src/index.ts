import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall} from "firebase-functions/v2/https";
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

// --- NUOVA FUNZIONE PER LA RETROCOMPATIBILITÀ ---

/**
 * Funzione chiamabile per analizzare tutti gli utenti e assegnare i badge
 * in base ai loro dati storici.
 */
export const checkBadgesRetroactively = onCall(async (request) => {
  logger.log("Inizio controllo retroattivo dei badge per tutti gli utenti.");

  const usersSnapshot = await db.collection("users").get();
  let usersChecked = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userBadges = userDoc.data().badges || [];

    // 1. Controlla badge Pioniere (>= 1 post)
    if (!userBadges.includes("pioneer")) {
      const postsSnap = await db.collection("posts")
        .where("authorId", "==", userId).limit(1).get();
      if (postsSnap.size > 0) {
        await grantBadge(userId, "pioneer");
      }
    }

    // 2. Controlla badge Chiacchierone (>= 50 commenti)
    if (!userBadges.includes("chatterbox")) {
      const commentsSnap = await db.collection("comments")
        .where("authorId", "==", userId).limit(50).get();
      if (commentsSnap.size >= 50) {
        await grantBadge(userId, "chatterbox");
      }
    }

    // 3. Controlla badge Popolare e Re del Segreto
    const userPosts = await db.collection("posts")
      .where("authorId", "==", userId).get();

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


export const onPollEnd = onSchedule("every 5 minutes", async () => {
  const now = new Date();
  const pollsQuery = db.collection("posts")
    .where("isPoll", "==", true)
    .where("pollNotified", "==", false)
    .where("pollEndDate", "<=", now);

  const expiredPollsSnapshot = await pollsQuery.get();

  if (expiredPollsSnapshot.empty) {
    logger.log("Nessun sondaggio scaduto trovato.");
    return;
  }

  const promises = expiredPollsSnapshot.docs.map(async (doc) => {
    const post = doc.data();
    const postId = doc.id;
    const allVoterIds = post.pollOptions.flatMap(
      (opt: { votedBy: string[] }) => opt.votedBy || [],
    );
    const uniqueVoterIds = [...new Set(allVoterIds)];

    const notificationPromises = uniqueVoterIds.map((userId) => {
      const text = `Il sondaggio "${post.text.substring(0, 30)}..." è terminato.`;
      return db.collection("notifications").add({
        recipientId: userId,
        type: "poll_end",
        postId,
        text,
        isRead: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await Promise.all(notificationPromises);
    return doc.ref.update({pollNotified: true});
  });

  await Promise.all(promises);
  logger.log(`Processati ${expiredPollsSnapshot.size} sondaggi scaduti.`);
});
