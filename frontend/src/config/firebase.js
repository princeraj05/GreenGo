import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIHxA4erXI5z_qaI60RpoqFakRtZKL32U",
  authDomain: "bytebite-1d79a.firebaseapp.com",
  projectId: "bytebite-1d79a",
  storageBucket: "bytebite-1d79a.firebasestorage.app",
  messagingSenderId: "601593999050",
  appId: "1:601593999050:web:34d4d35b7d351181034e33",
  measurementId: "G-8QT4TBTV0R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
