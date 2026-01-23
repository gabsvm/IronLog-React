
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache, 
  indexedDbLocalCache 
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

// FALLBACK: Direct Paste (Testing/Dev Mode)
if (!firebaseConfig.apiKey) {
    console.log("⚠️ Using provided Firebase Config (Testing Mode)");
    firebaseConfig = {
        apiKey: "AIzaSyAfrO4IpIzXuNd-dcpVHFdSJjmNx9wHpIE",
        authDomain: "ironlog-409eb.firebaseapp.com",
        projectId: "ironlog-409eb",
        storageBucket: "ironlog-409eb.firebasestorage.app",
        messagingSenderId: "926261848983",
        appId: "1:926261848983:web:a7cd25334f6f3dc99172d2"
    };
}

const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && !firebaseConfig.apiKey.includes("INSERT_KEY"));

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // ENABLE OFFLINE PERSISTENCE
    // This allows the app to work offline and sync changes later automatically.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: undefined // Default auto tab manager
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
