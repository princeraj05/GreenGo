import admin from "../config/firebase.js";
import User from "../models/User.js";

/**
 * Sends a multicast push notification to all FCM tokens registered to a user.
 * Automatically cleans up invalid/stale registration tokens.
 *
 * @param {string} userId - The database ID of the user.
 * @param {string} title - The title of the push notification.
 * @param {string} body - The body message of the push notification.
 * @param {Object} [data] - Optional metadata/payload object (all keys and values must be strings).
 */
export async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`[PUSH NOTIFICATION] No FCM tokens found for user ${userId}. Skipping.`);
      return;
    }

    // Filter out empty or null tokens just in case
    const tokens = user.fcmTokens.filter(t => typeof t === "string" && t.trim() !== "");
    if (tokens.length === 0) return;

    // Convert all data payload properties to string as required by FCM
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    const message = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      data: stringifiedData,
    };

    console.log(`[PUSH NOTIFICATION] Sending push to user ${userId} (${tokens.length} tokens)`);
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Check if any tokens failed because they are unregistered/expired and remove them
    const tokensToRemove = [];
    response.responses.forEach((res, index) => {
      if (!res.success) {
        const error = res.error;
        console.error(`[PUSH NOTIFICATION] Error for token ${tokens[index]}:`, error.code || error.message);
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      console.log(`[PUSH NOTIFICATION] Cleaning up ${tokensToRemove.length} invalid/expired tokens for user ${userId}`);
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: tokensToRemove } }
      });
    }
  } catch (error) {
    console.error(`[PUSH NOTIFICATION] Failed to send push notification to user ${userId}:`, error);
  }
}
