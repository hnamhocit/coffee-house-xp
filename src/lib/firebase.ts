import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA1smv40qrIADLsDuAJDbpJiPqONyEGrpE",
  authDomain: "coffee-house-xp.firebaseapp.com",
  projectId: "coffee-house-xp",
  storageBucket: "coffee-house-xp.firebasestorage.app",
  messagingSenderId: "851825617817",
  appId: "1:851825617817:web:b8792c124623c6b1ec8108",
};

// Initialize Firebase (safely preventing duplicate app initialization in SSR/HMR)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to avoid adblocker/Brave Shields stream blocks
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Google Auth Provider (Google-only sign-in)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    throw error;
  }
};
