import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

type FirebaseAppServices = {
    app?: FirebaseApp;
    appApi: typeof import('firebase/app');
};

type FirebaseAuthServices = {
    app?: FirebaseApp;
    auth?: Auth;
    authApi: typeof import('firebase/auth');
};

type FirebaseFirestoreServices = {
    app?: FirebaseApp;
    db?: Firestore;
    firestoreApi: typeof import('firebase/firestore');
};

type FirebaseServices = FirebaseAuthServices & FirebaseFirestoreServices;

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

let appPromise: Promise<FirebaseAppServices> | null = null;
let authPromise: Promise<FirebaseAuthServices> | null = null;
let firestorePromise: Promise<FirebaseFirestoreServices> | null = null;

const emptyAppServices = (): FirebaseAppServices => ({
    app: undefined,
    appApi: {} as typeof import('firebase/app'),
});

const emptyAuthServices = (): FirebaseAuthServices => ({
    app: undefined,
    auth: undefined,
    authApi: {} as typeof import('firebase/auth'),
});

const emptyFirestoreServices = (): FirebaseFirestoreServices => ({
    app: undefined,
    db: undefined,
    firestoreApi: {} as typeof import('firebase/firestore'),
});

export const isFirebaseConfigured = () => hasFirebaseConfig;

export const getFirebaseAppServices = (): Promise<FirebaseAppServices> => {
    if (!hasFirebaseConfig) return Promise.resolve(emptyAppServices());

    if (!appPromise) {
        appPromise = (async () => {
            const appApi = await import('firebase/app');
            const app = appApi.getApps().length > 0
                ? appApi.getApps()[0]
                : appApi.initializeApp(firebaseConfig);
            return { app, appApi };
        })().catch((error) => {
            console.error('Firebase app initialization error:', error);
            appPromise = null;
            return emptyAppServices();
        });
    }

    return appPromise;
};

export const getFirebaseAuthServices = (): Promise<FirebaseAuthServices> => {
    if (!hasFirebaseConfig) return Promise.resolve(emptyAuthServices());

    if (!authPromise) {
        authPromise = (async () => {
            const [{ app }, authApi] = await Promise.all([
                getFirebaseAppServices(),
                import('firebase/auth'),
            ]);

            if (!app) return emptyAuthServices();
            return { app, auth: authApi.getAuth(app), authApi };
        })().catch((error) => {
            console.error('Firebase auth initialization error:', error);
            authPromise = null;
            return emptyAuthServices();
        });
    }

    return authPromise;
};

export const getFirebaseFirestoreServices = (): Promise<FirebaseFirestoreServices> => {
    if (!hasFirebaseConfig) return Promise.resolve(emptyFirestoreServices());

    if (!firestorePromise) {
        firestorePromise = (async () => {
            const [{ app }, firestoreApi] = await Promise.all([
                getFirebaseAppServices(),
                import('firebase/firestore'),
            ]);

            if (!app) return emptyFirestoreServices();

            const db = firestoreApi.initializeFirestore(app, {
                localCache: firestoreApi.persistentLocalCache({
                    tabManager: firestoreApi.persistentMultipleTabManager(),
                }),
            });

            return { app, db, firestoreApi };
        })().catch((error) => {
            console.error('Firebase Firestore initialization error:', error);
            firestorePromise = null;
            return emptyFirestoreServices();
        });
    }

    return firestorePromise;
};

export const getFirebaseServices = async (): Promise<FirebaseServices> => {
    const [authServices, firestoreServices] = await Promise.all([
        getFirebaseAuthServices(),
        getFirebaseFirestoreServices(),
    ]);

    return {
        ...authServices,
        ...firestoreServices,
    };
};
