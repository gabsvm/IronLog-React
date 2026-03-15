
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

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

const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // ENABLE ROBUST OFFLINE PERSISTENCE
    // We use persistentLocalCache with multi-tab support to ensure
    // data is readable/writable even when network is down.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    
    console.log("✅ Firebase initialized with Offline Persistence");
  } catch (e) {
    console.error("❌ Firebase initialization error:", e);
  }
} else {
  console.warn("⚠️ Firebase config missing. Cloud features disabled.");
}

export { auth, db };
