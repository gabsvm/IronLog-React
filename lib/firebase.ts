
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache
} from "firebase/firestore";
import { getFunctions, httpsCallable, Functions } from "firebase/functions";

// --- DIRECT CONFIGURATION (Repo is Private) ---
const firebaseConfig = {
  apiKey: "AIzaSyAfrO4IpIzXuNd-dcpVHFdSJjmNx9wHpIE",
  authDomain: "ironlog-409eb.firebaseapp.com",
  projectId: "ironlog-409eb",
  storageBucket: "ironlog-409eb.firebasestorage.app",
  messagingSenderId: "926261848983",
  appId: "1:926261848983:web:a7cd25334f6f3dc99172d2",
  measurementId: "G-4P6FV3WQ41"
};

const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

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
    
    console.log("✅ Firebase initialized with Offline Persistence (Direct Config)");
  } catch (e) {
    console.error("❌ Firebase initialization error:", e);
  }
} else {
  console.warn("⚠️ Firebase config invalid.");
}

export { auth, db, functions, httpsCallable };
