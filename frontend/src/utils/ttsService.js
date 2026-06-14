import { Preferences } from "@capacitor/preferences";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";

/**
 * TTS Service for GreenGo Food Delivery Application
 * Uses native Capacitor TTS on Android APK and falls back to window.speechSynthesis on Web.
 */

// Voice configuration for order statuses
export const ORDER_STATUS_VOICES = {
  Pending: "Your order has been placed successfully.",
  Preparing: "Good news. Your order has been confirmed and is being prepared.",
  CancellationRequested: "Your cancellation request has been submitted. Please wait for admin approval.",
  Cancelled: "Your order has been cancelled."
};

let lastAnnouncement = "";

/**
 * Plays a Text-to-Speech message.
 *
 * @param {string} text - The text message to speak.
 */
export const speakText = async (text) => {
  try {
    // Prevent duplicate announcements of the exact same text within a short timeframe
    if (lastAnnouncement === text) {
      console.log("TTS Service: Already announcing this message. Skipping.");
      return;
    }
    lastAnnouncement = text;
    setTimeout(() => {
      if (lastAnnouncement === text) lastAnnouncement = "";
    }, 4000);

    // 1. Native Platform (Android APK)
    if (Capacitor.isNativePlatform()) {
      console.log("TTS Service: Using Native Capacitor TTS for:", text);
      try {
        await TextToSpeech.stop();
      } catch (e) {
        console.warn("TTS Service: Error stopping native speech:", e);
      }
      
      await TextToSpeech.speak({
        text: text,
        lang: 'en-US',
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      return true;
    }

    // 2. Web Fallback
    if (typeof window !== "undefined" && window.speechSynthesis) {
      console.log("TTS Service: Using Web SpeechSynthesis Fallback for:", text);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Try to use a clean English voice
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith("en"));
      if (engVoice) utterance.voice = engVoice;

      window.speechSynthesis.speak(utterance);
      return true;
    } else {
      console.warn("TTS Service: Speech synthesis is not supported in this environment.");
      return false;
    }
  } catch (err) {
    console.error("TTS Service: Speech synthesis failed:", err);
    return false;
  }
};

/**
 * Handles playing the order confirmation or status change voice message if it has not been played yet.
 * Uses Capacitor Preferences to persist playback status across sessions.
 *
 * @param {string} orderId - The unique ID of the order.
 * @param {string} status - The status of the order.
 */
export const playOrderStatusVoice = async (orderId, status) => {
  if (!orderId || !status) return;

  const validStatuses = ["Pending", "Preparing", "CancellationRequested", "Cancelled"];
  if (!validStatuses.includes(status)) return;

  const message = ORDER_STATUS_VOICES[status];
  if (!message) return;

  try {
    const key = `tts_played_${status}_${orderId}`;
    
    // Check if this status message has already been played for this order
    const { value } = await Preferences.get({ key });
    if (value === "true") {
      console.log(`TTS Service: Status ${status} message already played for order ${orderId}. Skipping.`);
      return;
    }

    // Mark as played BEFORE playing to prevent race conditions
    await Preferences.set({ key, value: "true" });

    console.log(`TTS Service: Initiating status voice alert for ${status} (order: ${orderId}).`);
    await speakText(message);
  } catch (err) {
    console.error("TTS Service: Error in playOrderStatusVoice:", err);
  }
};

// Legacy compatibility exports for index/others
export const playOrderConfirmationVoice = async (orderId, status) => {
  if (status === "Pending" || status === "Preparing") {
    await playOrderStatusVoice(orderId, status);
  }
};

export const playOrderCancellationVoice = async (orderId) => {
  await playOrderStatusVoice(orderId, "CancellationRequested");
};

// Ensure voices are loaded asynchronously in Chrome/Android WebViews
if (typeof window !== "undefined" && window.speechSynthesis) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("TTS Service: Speech synthesis voices updated/loaded.");
    };
  }
}
