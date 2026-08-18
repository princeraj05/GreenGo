import axios from "axios";
import { getApiUrl } from "../utils/getApiUrl";

const maskToken = (token) => {
  if (!token) return "none";
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
};

const sanitizePayload = (data) => {
  if (!data || typeof data !== "object") return data;
  const sanitizedData = { ...data };
  if (sanitizedData.password) sanitizedData.password = "***";
  if (sanitizedData.idToken) sanitizedData.idToken = maskToken(sanitizedData.idToken);
  if (sanitizedData.token) sanitizedData.token = maskToken(sanitizedData.token);
  return sanitizedData;
};

const API = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // agar auth use kar rahe ho
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    console.log(`[AXIOS REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log(`[AXIOS REQUEST BASE URL] ${config.baseURL}`);
    console.log(`[AXIOS REQUEST METHOD] ${config.method}`);
    console.log(`[AXIOS TOKEN READ] ${maskToken(token)}`);
    console.log(`[AXIOS AUTH HEADER] ${config.headers?.Authorization ? maskToken(String(config.headers.Authorization).replace("Bearer ", "")) : "none"}`);
    console.log(`[AXIOS HEADERS]`, config.headers);
    if (config.data) {
      console.log(`[AXIOS PAYLOAD]`, sanitizePayload(config.data));
    }
    return config;
  },
  (error) => {
    console.error(`[AXIOS REQUEST ERROR]`, error);
    return Promise.reject(error);
  }
);

import { Preferences } from "@capacitor/preferences";

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Response Interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS RESPONSE SUCCESS] Status: ${response.status} from ${response.config.url}`);
    if (response.data && response.data.refreshToken) {
      localStorage.setItem("refresh_token", response.data.refreshToken);
      Preferences.set({ key: "refresh_token", value: response.data.refreshToken }).catch(() => {});
    }
    return response;
  },
  async (error) => {
    console.error(`[AXIOS EXCEPTION]`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
      method: error.config?.method,
    });

    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/refresh-token")) {
      const refreshToken = localStorage.getItem("refresh_token") || (await Preferences.get({ key: "refresh_token" })).value;
      const oldToken = localStorage.getItem("token") || (await Preferences.get({ key: "token" })).value;

      if (refreshToken && oldToken) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(API(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          axios
            .post(`${getApiUrl()}/api/users/refresh-token`, { token: oldToken, refreshToken })
            .then(async ({ data }) => {
              isRefreshing = false;
              if (data.success && data.token) {
                localStorage.setItem("token", data.token);
                await Preferences.set({ key: "token", value: data.token });
                if (data.refreshToken) {
                  localStorage.setItem("refresh_token", data.refreshToken);
                  await Preferences.set({ key: "refresh_token", value: data.refreshToken });
                }
                onRefreshed(data.token);
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                resolve(API(originalRequest));
              } else {
                // Refresh failed
                localStorage.removeItem("token");
                localStorage.removeItem("user_data");
                localStorage.removeItem("auth_state");
                localStorage.removeItem("refresh_token");
                await Preferences.remove({ key: "token" });
                await Preferences.remove({ key: "user_data" });
                await Preferences.remove({ key: "auth_state" });
                await Preferences.remove({ key: "refresh_token" });
                window.location.href = "/login";
                reject(error);
              }
            })
            .catch(async (err) => {
              isRefreshing = false;
              localStorage.removeItem("token");
              localStorage.removeItem("user_data");
              localStorage.removeItem("auth_state");
              localStorage.removeItem("refresh_token");
              await Preferences.remove({ key: "token" });
              await Preferences.remove({ key: "user_data" });
              await Preferences.remove({ key: "auth_state" });
              await Preferences.remove({ key: "refresh_token" });
              window.location.href = "/login";
              reject(err);
            });
        });
      }
    }

    if (!error.response) {
      console.error(`[AXIOS NETWORK EXCEPTION]`, error);
    }
    return Promise.reject(error);
  }
);

export default API;
