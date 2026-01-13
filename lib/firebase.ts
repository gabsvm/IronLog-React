import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Safe environment access
// We assign to a variable to handle cases where import.meta.env might be undefined
// or strict replacement didn't happen.
const env = (import.meta.env || {}) as any;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Check if config is valid (at least apiKey and projectId are required)
const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
} else {
  console.warn("Firebase configuration missing or incomplete. Cloud features will be disabled.");
}

export { auth, db };