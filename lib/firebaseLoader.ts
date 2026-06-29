import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

type FirebaseServices = {
    auth?: Auth;
    db?: Firestore;
    authApi: typeof import('firebase/auth');
    firestoreApi: typeof import('firebase/firestore');
};

const env = (import.meta.env || {}) as Record<string, string | undefined>;

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let firebasePromise: Promise<FirebaseServices> | null = null;

export const isFirebaseConfigured = () => hasFirebaseConfig;

export const getFirebaseServices = (): Promise<FirebaseServices> => {
    if (!hasFirebaseConfig) {
        return Promise.resolve({
            auth: undefined,
            db: undefined,
            authApi: {} as typeof import('firebase/auth'),
            firestoreApi: {} as typeof import('firebase/firestore'),
        });
    }

    if (!firebasePromise) {
        firebasePromise = (async () => {
            const [{ initializeApp }, authApi, firestoreApi] = await Promise.all([
                import('firebase/app'),
                import('firebase/auth'),
                import('firebase/firestore'),
            ]);

            const app = initializeApp(firebaseConfig);
            const auth = authApi.getAuth(app);
            const db = firestoreApi.initializeFirestore(app, {
                localCache: firestoreApi.persistentLocalCache({
                    tabManager: firestoreApi.persistentMultipleTabManager(),
                }),
            });

            return { auth, db, authApi, firestoreApi };
        })().catch((error) => {
            console.error('Firebase initialization error:', error);
            firebasePromise = null;
            return {
                auth: undefined,
                db: undefined,
                authApi: {} as typeof import('firebase/auth'),
                firestoreApi: {} as typeof import('firebase/firestore'),
            };
        });
    }

    return firebasePromise;
};
