import { Preferences } from "@capacitor/preferences";

/**
 * TTS Service for GreenGo Food Delivery Application
 * Handles speech synthesis using the device's native SpeechSynthesis (Web Speech API).
 * Works seamlessly across Web, Android, and iOS through the Capacitor web view.
 */

// Voice configuration for order statuses
export const ORDER_STATUS_VOICES = {
  Confirmed: "GreenGo chunne ke liye dhanyavaad! Aapka order safaltapoorvak confirm ho gaya hai. Restaurant aapke order ki taiyari kar raha hai. Aap app me order tracking karke apne order ki live sthiti dekh sakte hain."
};

/**
 * Plays a Text-to-Speech message for a specific order if Hindi is available,
 * otherwise falls back to the default device language.
 *
 * @param {string} text - The text message to speak.
 */
export const speakText = (text) => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        console.warn("TTS Service: Web Speech API is not supported in this environment.");
        return resolve(false);
      }

      // Cancel any ongoing speech before starting a new one
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Fetch available voices on the device
      const voices = window.speechSynthesis.getVoices();

      // Find a Hindi voice (language code 'hi' or 'hi-IN')
      const hindiVoice = voices.find(
        (voice) => voice.lang.startsWith("hi") || voice.lang.includes("hi-IN")
      );

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang;
        console.log(`TTS Service: Using Hindi voice: ${hindiVoice.name}`);
      } else {
        console.log("TTS Service: Hindi voice not found. Falling back to default device language.");
        // We let the browser/OS choose the default language voice by not setting utterance.voice
      }

      // Configure speech parameters for a natural announcement tone
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;

      utterance.onend = () => {
        console.log("TTS Service: Playback completed successfully.");
        resolve(true);
      };

      utterance.onerror = (event) => {
        console.error("TTS Service: Playback error occurred:", event.error);
        // Log the error but resolve to prevent blocking order flow
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS Service: Initialization or playback failed:", err);
      resolve(false);
    }
  });
};

/**
 * Handles playing the order confirmation voice message if it has not been played yet.
 * Uses Capacitor Preferences to persist playback status across sessions, navigation changes, and app restarts.
 *
 * @param {string} orderId - The unique ID of the order.
 * @param {string} status - The status of the order.
 */
export const playOrderConfirmationVoice = async (orderId, status) => {
  if (!orderId || (status !== "Preparing" && status !== "Pending")) {
    return;
  }

  try {
    const key = `tts_played_confirmed_${orderId}`;
    
    // Check if the confirmation message has already been played for this order
    const { value } = await Preferences.get({ key });
    if (value === "true") {
      console.log(`TTS Service: Message already played for order ${orderId}. Skipping duplicate playback.`);
      return;
    }

    // Mark as played BEFORE playing to prevent race conditions during rapid component re-renders
    await Preferences.set({ key, value: "true" });

    // Speak the confirmation message
    const message = ORDER_STATUS_VOICES.Confirmed;
    console.log(`TTS Service: Initiating voice announcement for confirmed order ${orderId}.`);
    await speakText(message);
  } catch (err) {
    // Log the error without affecting the application or order flow
    console.error("TTS Service: Failed during duplicate check or execution:", err);
  }
};

// Ensure voices are loaded asynchronously in Chrome/Android WebViews
if (typeof window !== "undefined" && window.speechSynthesis) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("TTS Service: Speech synthesis voices updated/loaded.");
    };
  }
}
