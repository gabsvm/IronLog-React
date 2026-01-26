
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache
} from "firebase/firestore";
import { getFunctions, httpsCallable, Functions } from "firebase/functions";

// --- CONFIGURATION STRATEGY ---
const env = (import.meta.env || {}) as any;

let firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && !firebaseConfig.apiKey.includes("INSERT_KEY"));

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;
let functions: Functions | undefined;

if (isValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    functions = getFunctions(app);
    
    // ENABLE OFFLINE PERSISTENCE
    db = initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
    
    console.log("✅ Firebase initialized with Offline Persistence");
  } catch (e) {
    console.error("❌ Firebase initialization error:", e);
  }
} else {
  console.warn("⚠️ Firebase config missing. Please check Vercel Environment Variables. Cloud features disabled.");
}

export { auth, db, functions, httpsCallable };
