import admin from "../config/firebase.js";
import { getMessaging } from "firebase-admin/messaging";
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
    const response = await getMessaging().sendEachForMulticast(message);
    
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

/**
 * Sends a push notification to all users who have registered FCM tokens (Broadcast).
 *
 * @param {string} title - The title of the push notification.
 * @param {string} body - The body message of the push notification.
 * @param {Object} [data] - Optional metadata/payload object.
 */
export async function sendPushToAllUsers(title, body, data = {}) {
  try {
    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).select("_id fcmTokens");
    if (users.length === 0) {
      console.log("[PUSH NOTIFICATION] No users with FCM tokens found for broadcast.");
      return;
    }

    const allTokens = [];
    users.forEach(user => {
      user.fcmTokens.forEach(token => {
        if (typeof token === "string" && token.trim() !== "") {
          allTokens.push(token);
        }
      });
    });

    if (allTokens.length === 0) return;

    // Convert data properties to string
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    console.log(`[PUSH NOTIFICATION] Broadcasting push to ${allTokens.length} tokens`);

    // Firebase multicast allows up to 500 tokens per batch
    const batchSize = 500;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batchTokens = allTokens.slice(i, i + batchSize);
      const message = {
        tokens: batchTokens,
        notification: {
          title,
          body,
        },
        data: stringifiedData,
      };
      await getMessaging().sendEachForMulticast(message);
    }
  } catch (error) {
    console.error("[PUSH NOTIFICATION] Failed to broadcast push notification:", error);
  }
}

/**
 * Sends a push notification to all users with the role 'admin' who have registered FCM tokens.
 *
 * @param {string} title - The title of the push notification.
 * @param {string} body - The body message of the push notification.
 * @param {Object} [data] - Optional metadata/payload object.
 */
export async function sendPushToAdmins(title, body, data = {}) {
  try {
    const admins = await User.find({ role: "admin", fcmTokens: { $exists: true, $not: { $size: 0 } } }).select("_id fcmTokens");
    if (admins.length === 0) {
      console.log("[PUSH NOTIFICATION] No admins with FCM tokens found.");
      return;
    }

    const allTokens = [];
    admins.forEach(adminUser => {
      adminUser.fcmTokens.forEach(token => {
        if (typeof token === "string" && token.trim() !== "") {
          allTokens.push(token);
        }
      });
    });

    if (allTokens.length === 0) return;

    // Convert data properties to string
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    console.log(`[PUSH NOTIFICATION] Sending admin push to ${allTokens.length} tokens`);
    const message = {
      tokens: allTokens,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
    };
    await getMessaging().sendEachForMulticast(message);
  } catch (error) {
    console.error("[PUSH NOTIFICATION] Failed to send push notification to admins:", error);
  }
}
