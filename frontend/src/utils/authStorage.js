import { Preferences } from "@capacitor/preferences";

/**
 * Save user session data securely in Preferences and fallback/sync with localStorage.
 * @param {string} token - JWT token.
 * @param {object} userData - User profile details.
 */
export const saveSession = async (token, userData) => {
  try {
    await Preferences.set({ key: "token", value: token });
    await Preferences.set({ key: "user_data", value: JSON.stringify(userData) });
    await Preferences.set({ key: "auth_state", value: "logged_in" });
  } catch (err) {
    console.error("Failed to save to Capacitor Preferences:", err);
  }
  // Synchronous sync for existing parts of application
  localStorage.setItem("token", token);
  localStorage.setItem("user_data", JSON.stringify(userData));
  localStorage.setItem("auth_state", "logged_in");
};

/**
 * Clear user session from Preferences and localStorage.
 */
export const clearSession = async () => {
  try {
    await Preferences.remove({ key: "token" });
    await Preferences.remove({ key: "user_data" });
    await Preferences.remove({ key: "auth_state" });
  } catch (err) {
    console.error("Failed to clear Capacitor Preferences:", err);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user_data");
  localStorage.removeItem("auth_state");
};

/**
 * Restore user session from Preferences back into localStorage.
 * Returns the token and userData if active, null otherwise.
 */
export const restoreSession = async () => {
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

  // Fallback to checking localStorage if Preferences is empty/fails
  const token = localStorage.getItem("token");
  const userDataStr = localStorage.getItem("user_data");
  const authState = localStorage.getItem("auth_state");
  if (token && authState === "logged_in") {
    return { token, userData: userDataStr ? JSON.parse(userDataStr) : null };
  }
  return null;
};
