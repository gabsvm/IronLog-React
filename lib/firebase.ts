import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const env = (import.meta.env || {}) as any;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const isValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
const isNativeShell = Capacitor.isNativePlatform();

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    if (isNativeShell) {
      // GainsLab already persists its authoritative workout/program state in its
      // own IndexedDB layer. A second persistent multi-tab Firestore cache inside
      // one Capacitor WebView adds startup/storage work without improving recovery.
      db = getFirestore(app);
    } else {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }

    console.log(`✅ Firebase initialized (${isNativeShell ? 'native memory cache' : 'PWA persistent cache'})`);
  } catch (e) {
    console.error('❌ Firebase initialization error:', e);
  }
} else {
  console.warn('⚠️ Firebase config missing. Cloud features disabled.');
}

export { auth, db };
