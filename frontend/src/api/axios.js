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

// Response Interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS RESPONSE SUCCESS] Status: ${response.status} from ${response.config.url}`);
    console.log(`[AXIOS RESPONSE BODY]`, sanitizePayload(response.data));
    return response;
  },
  (error) => {
    console.error(`[AXIOS EXCEPTION]`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
      method: error.config?.method,
    });
    console.error(`[AXIOS RESPONSE ERROR BODY]`, sanitizePayload(error.response?.data));
    if (!error.response) {
      console.error(`[AXIOS NETWORK EXCEPTION]`, error);
    }
    return Promise.reject(error);
  }
);

export default API;
