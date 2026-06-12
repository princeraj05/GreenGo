import User from "../models/User.js";
import Session from "../models/Session.js";
import SecurityLog from "../models/SecurityLog.js";
import Contact from "../models/Contact.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import fs from "fs";
import path from "path";

/**
 * Auto-deletion scheduled check.
 * Identifies inactive users (> 30 days) and flags them for deletion (initiates 7-day recovery period).
 * Identifies soft-deleted users (> 7 days since deletion) and permanently scrubs all their personal info.
 */
export const runPrivacyCleanupJob = async () => {
  try {
    const now = new Date();
    
    // 1. Soft Delete: Find active users with no activity for 30 days
    const inactivityLimit = new Date();
    inactivityLimit.setDate(inactivityLimit.getDate() - 30);

    const inactiveUsers = await User.find({
      isDeleted: false,
      lastActivity: { $lt: inactivityLimit },
      role: { $ne: "admin" } // Never delete admin accounts automatically
    });

    for (const user of inactiveUsers) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      // Clear phoneHash to prevent unique constraint blocks for future signups using same phone during recovery
      user.phoneHash = undefined; 
      await user.save();

      // Clear sessions
      await Session.deleteMany({ userId: user._id });

      await SecurityLog.create({
        userId: user._id,
        action: "user_soft_delete_inactivity",
        details: `User account flag set to soft-deleted due to 30 days inactivity.`,
        ipAddress: "127.0.0.1",
        userAgent: "Privacy Cleanup Job"
      });
      console.log(`[PRIVACY JOB] User ${user.email || user._id} soft deleted due to 30 days inactivity.`);
    }

    // 2. Permanent Delete: Find soft-deleted users whose recovery period (7 days) has expired
    const recoveryLimit = new Date();
    recoveryLimit.setDate(recoveryLimit.getDate() - 7);

    const expiredUsers = await User.find({
      isDeleted: true,
      deletedAt: { $lt: recoveryLimit }
    });

    for (const user of expiredUsers) {
      const userIdStr = String(user._id);

      // Scrub profile personal data
      user.name = "deleted";
      user.email = `deleted_${userIdStr}@greengo.privacy`;
      user.phone = "";
      user.phoneEncrypted = "";
      user.phoneHash = undefined;
      user.address = "deleted";
      user.addresses = [];
      user.primaryAddressId = null;
      user.password = undefined;
      user.uid = "";
      user.avatar = "";
      user.birthDate = null;
      user.favorites = [];
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.deliveryDetails = undefined;
      user.profileCompletion = {
        passwordSet: false,
        editProfileCompleted: false,
        addressCompleted: false,
        completionPercent: 0,
        completed: false,
        updatedAt: new Date()
      };
      
      // Perform save to clear out everything
      await user.save();

      // Remove sessions
      await Session.deleteMany({ userId: userIdStr });

      // Delete user's notifications
      await Notification.deleteMany({ userId: userIdStr });

      // Delete user's contact message history
      await Contact.deleteMany({ uid: userIdStr });

      // Scrub order records to maintain revenue logs without holding personal data
      await Order.updateMany(
        { userId: userIdStr },
        {
          $set: {
            phone: "deleted",
            address: "deleted"
          }
        }
      );

      // Create system security log
      await SecurityLog.create({
        userId: userIdStr,
        action: "user_permanent_delete",
        details: `User account permanently scrubbed after 7 days recovery window expiration. Financial order records scrubbed of identity metadata.`,
        ipAddress: "127.0.0.1",
        userAgent: "Privacy Cleanup Job"
      });

      console.log(`[PRIVACY JOB] User ${userIdStr} permanently scrubbed.`);
    }

  } catch (err) {
    console.error("[PRIVACY JOB ERROR] Scheduled cleanup failure:", err);
  }
};
