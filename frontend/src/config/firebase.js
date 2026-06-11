import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRzVQcULVdtjmCUidgNaYC2f01tkePCEE",
  authDomain: "greengo-40db2.firebaseapp.com",
  projectId: "greengo-40db2",
  storageBucket: "greengo-40db2.firebasestorage.app",
  messagingSenderId: "514910313840",
  appId: "1:514910313840:web:9aca8ff1f55ff78897c3b5",
  measurementId: "G-Z3NCB3NBJ1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
