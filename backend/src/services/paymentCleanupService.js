import Order from "../models/Order.js";

/**
 * runPaymentCleanupJob: Automatically finds stale online orders in "Pending" status
 * that are older than 30 minutes, and transitions them to "Failed" / "Cancelled" state.
 * Since stock is only decremented upon successful capture, no inventory rollback is required.
 */
export const runPaymentCleanupJob = async () => {
  try {
    console.log("[CRON] Running Payment Cleanup Job...");
    const expirationThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const result = await Order.updateMany(
      {
        paymentMethod: "Online",
        paymentStatus: "Pending",
        createdAt: { $lt: expirationThreshold }
      },
      {
        $set: {
          paymentStatus: "Failed",
          status: "Cancelled",
          cancellationReason: "Payment timeout expired (Unpaid)"
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[CRON] Payment Cleanup Job complete. Marked ${result.modifiedCount} unpaid orders as Failed/Cancelled.`);
    } else {
      console.log("[CRON] Payment Cleanup Job complete. No stale pending orders found.");
    }
  } catch (err) {
    console.error("[CRON] Payment Cleanup Job failed:", err);
  }
};
