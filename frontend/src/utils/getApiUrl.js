export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for Vercel/production environment
  if (window.location.hostname.includes("vercel.app") || window.location.protocol === "https:") {
    return "https://bytebite-8n5z.onrender.com";
  }
  // Fallback for local development
  return "http://localhost:5000";
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = getApiUrl();
  return `${baseUrl}/uploads/${imagePath}`;
};
