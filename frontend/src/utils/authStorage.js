import { Preferences } from "@capacitor/preferences";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { getApiUrl } from "./getApiUrl";

/**
 * Save user session data securely in Preferences and fallback/sync with localStorage.
 * @param {string} token - JWT token.
 * @param {object} userData - User profile details.
 */
export const saveSession = async (token, userData) => {
  // Synchronous write for instant UI and route guard updates
  localStorage.setItem("token", token);
  localStorage.setItem("user_data", JSON.stringify(userData));
  localStorage.setItem("auth_state", "logged_in");

  try {
    await Preferences.set({ key: "token", value: token });
    await Preferences.set({ key: "user_data", value: JSON.stringify(userData) });
    await Preferences.set({ key: "auth_state", value: "logged_in" });
  } catch (err) {
    console.error("Failed to save to Capacitor Preferences:", err);
  }
};

/**
 * Clear user session from Preferences and localStorage.
 */
export const clearSession = async () => {
  const fcmToken = localStorage.getItem("fcm_token");
  const token = localStorage.getItem("token");
  if (fcmToken && token) {
    try {
      await fetch(`${getApiUrl()}/api/users/fcm-token`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token: fcmToken })
      });
    } catch (err) {
      console.error("Failed to remove FCM token on server:", err);
    }
  }

  // Clear localStorage synchronously
  localStorage.removeItem("token");
  localStorage.removeItem("user_data");
  localStorage.removeItem("auth_state");

  try {
    await Preferences.remove({ key: "token" });
    await Preferences.remove({ key: "user_data" });
    await Preferences.remove({ key: "auth_state" });
  } catch (err) {
    console.error("Failed to clear Capacitor Preferences:", err);
  }

  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.error("Failed to sign out from Firebase:", err);
  }
};

/**
 * Restore user session from Preferences back into localStorage.
 * Returns the token and userData if active, null otherwise.
 */
export const restoreSession = async () => {
  // Check localStorage first (synchronous, instant)
  const localToken = localStorage.getItem("token");
  const localUserDataStr = localStorage.getItem("user_data");
  const localAuthState = localStorage.getItem("auth_state");
  if (localToken && localAuthState === "logged_in") {
    return { token: localToken, userData: localUserDataStr ? JSON.parse(localUserDataStr) : null };
  }

  // Fallback to checking Capacitor Preferences if localStorage is empty
  try {
    const { value: token } = await Preferences.get({ key: "token" });
    const { value: userDataStr } = await Preferences.get({ key: "user_data" });
    const { value: authState } = await Preferences.get({ key: "auth_state" });

    if (token && authState === "logged_in") {
      localStorage.setItem("token", token);
      if (userDataStr) {
        localStorage.setItem("user_data", userDataStr);
      }
      localStorage.setItem("auth_state", "logged_in");
      return { token, userData: userDataStr ? JSON.parse(userDataStr) : null };
    }
  } catch (err) {
    console.error("Failed to restore session from Preferences:", err);
  }

  return null;
};
