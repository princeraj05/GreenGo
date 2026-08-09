import { Preferences } from "@capacitor/preferences";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

/**
 * TTS Service for GreenGo Food Delivery Application
 * Uses native Capacitor TTS on Android APK and falls back to window.speechSynthesis on Web.
 */

// Voice configuration for order statuses
export const ORDER_STATUS_VOICES = {
  Pending: "Your order has been placed successfully.",
  RestaurantAccepted: "Your order has been accepted by the restaurant.",
  Preparing: "Good news. Your order has been confirmed and is being prepared.",
  CancellationRequested: "Your cancellation request has been submitted. Please wait for admin approval.",
  Cancelled: "Your order has been cancelled."
};

let lastAnnouncement = "";

/**
 * Stop any current speech.
 */
export const stopSpeaking = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.stop();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    console.log("TTS Service: Speech stopped.");
  } catch (err) {
    console.error("TTS Service: Failed to stop speaking:", err);
  }
};

/**
 * Plays a Text-to-Speech message.
 *
 * @param {string} text - The text message to speak.
 */
export const speakText = async (text) => {
  try {
    // If the screen is locked, minimized, or tab is hidden, do not speak
    if (typeof document !== "undefined" && document.hidden) {
      console.log("TTS Service: App is in background. Skipping speech.");
      return false;
    }

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
 * @param {string} updatedAt - The last update timestamp of the order.
 */
export const playOrderStatusVoice = async (orderId, status, updatedAt) => {
  if (!orderId || !status) return;

  const validStatuses = ["Pending", "RestaurantAccepted", "Preparing", "CancellationRequested", "Cancelled"];
  if (!validStatuses.includes(status)) return;

  // Only announce if the order was updated recently (within last 2 minutes) to prevent playing old/stale orders
  if (updatedAt) {
    const timeDiff = Date.now() - new Date(updatedAt).getTime();
    if (timeDiff > 120000) { // 2 minutes
      console.log(`TTS Service: Skipping voice for order ${orderId} because it was updated too long ago (${Math.round(timeDiff / 1000)}s ago).`);
      return;
    }
  }

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
export const playOrderConfirmationVoice = async (orderId, status, updatedAt) => {
  if (status === "Pending" || status === "Preparing" || status === "RestaurantAccepted") {
    await playOrderStatusVoice(orderId, status, updatedAt);
  }
};

export const playOrderCancellationVoice = async (orderId) => {
  await playOrderStatusVoice(orderId, "CancellationRequested", new Date());
};

// Automatically stop speech when screen is locked, minimized, or tab is hidden
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("TTS Service: Document hidden, stopping speech.");
      stopSpeaking();
    }
  });
}

if (Capacitor.isNativePlatform()) {
  try {
    CapApp.addListener('appStateChange', (state) => {
      if (!state.isActive) {
        console.log("TTS Service: Capacitor App became inactive, stopping speech.");
        stopSpeaking();
      }
    });
  } catch (err) {
    console.warn("TTS Service: Failed to register native app state change listener:", err);
  }
}

// Ensure voices are loaded asynchronously in Chrome/Android WebViews
if (typeof window !== "undefined" && window.speechSynthesis) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("TTS Service: Speech synthesis voices updated/loaded.");
    };
  }
}
