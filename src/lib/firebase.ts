import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { initializeFirestore, getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
export const useFirebaseEmulators = import.meta.env.DEV && import.meta.env.PUBLIC_FIREBASE_EMULATORS === "true";

export const firebaseConfig = {
  apiKey: "AIzaSyA1smv40qrIADLsDuAJDbpJiPqONyEGrpE",
  authDomain: "coffee-house-xp.firebaseapp.com",
  projectId: useFirebaseEmulators ? "demo-coffee-house-xp" : "coffee-house-xp",
  storageBucket: "coffee-house-xp.firebasestorage.app",
  messagingSenderId: "851825617817",
  appId: "1:851825617817:web:b8792c124623c6b1ec8108",
};

function connectFirebase(name?: string) {
  const existing = getApps().find((instance) => instance.name === (name ?? "[DEFAULT]"));
  const app = existing ?? initializeApp(firebaseConfig, name);
  const auth = getAuth(app);
  const db = existing
    ? getFirestore(app)
    : initializeFirestore(app, { experimentalForceLongPolling: true });

  if (!existing && useFirebaseEmulators && typeof window !== "undefined") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return { app, auth, db };
}

export const { auth, db } = connectFirebase();
export const { auth: customerAuth, db: customerDb } = connectFirebase("customer");

let guestSignIn: Promise<unknown> | undefined;

export async function ensureOrderSession() {
  await customerAuth.authStateReady();
  if (customerAuth.currentUser) return;
  guestSignIn ??= signInAnonymously(customerAuth).finally(() => {
    guestSignIn = undefined;
  });
  await guestSignIn;
}

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
