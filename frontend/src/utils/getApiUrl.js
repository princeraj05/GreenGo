export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for Vercel/production environment or Capacitor native app
  if (
    window.location.hostname.includes("vercel.app") || 
    window.location.protocol === "https:" ||
    window.Capacitor ||
    (window.location.hostname === "localhost" && window.location.port === "")
  ) {
    return "https://api.green-go.in";
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
