import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Sends a notification to a specific user.
 *
 * @param {string} recipientId The ID of the user to notify.
 * @param {string} type The type of notification (e.g., "poll_end").
 * @param {string} postId The ID of the post related to the notification.
 * @param {string} text The content of the notification message.
 */
async function sendNotification(recipientId, type, postId, text) {
  try {
    await db.collection("notifications").add({
      recipientId,
      type,
      postId,
      text,
      isRead: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Error adding notification:", e);
  }
}

/**
 * Checks for expired polls and sends notifications to voters.
 */
export const onPollEnd = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const now = new Date();
    const expiredPollsSnapshot = await db.collection("posts")
      .where("isPoll", "==", true)
      .where("pollNotified", "==", false)
      .where("pollEndDate", "<=", now)
      .get();

    const notificationsPromises = [];

    expiredPollsSnapshot.forEach((doc) => {
      const postData = doc.data();
      const postId = doc.id;
      const allVoterIds = postData.pollOptions.flatMap(
        (option) => option.votedBy || [],
      );
      const uniqueVoterIds = [...new Set(allVoterIds)];

      uniqueVoterIds.forEach((userId) => {
        notificationsPromises.push(
          sendNotification(
            userId,
            "poll_end",
            postId,
            "Il sondaggio \"" + postData.text.substring(0, 50) + "...\" è terminato.",
          ),
        );
      });

      notificationsPromises.push(doc.ref.update({pollNotified: true}));
    });

    await Promise.all(notificationsPromises);
    return null;
  });
