import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initAppCheckOnce } from './appCheck';

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

// Q1: emulator wiring. Active ONLY when the flag is set AND the runtime is
// DEV or vitest ('test' mode). Production builds never take this branch:
// import.meta.env.DEV is false and MODE is 'production' there, and the flag
// itself is never set in production env files. No emulator host literal lives
// in this module: hosts always come from env vars (see tests/unit/
// emulatorProdGuard.test.ts, which also scans dist/ for leaked hosts).
export const shouldUseFirebaseEmulator = (
    envMap: Record<string, string | undefined>,
    runtime: { isDev: boolean; mode: string },
): boolean =>
    envMap.VITE_FIREBASE_EMULATOR === '1' && (runtime.isDev || runtime.mode === 'test');

const useEmulator = shouldUseFirebaseEmulator(env, {
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
});

const splitHostPort = (value: string | undefined): { host: string; port: number } | null => {
    if (!value) return null;
    const idx = value.lastIndexOf(':');
    if (idx <= 0) return null;
    const port = Number(value.slice(idx + 1));
    if (!Number.isInteger(port) || port <= 0) return null;
    return { host: value.slice(0, idx), port };
};

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
            // Optional App Check (no-op without VITE_FIREBASE_APPCHECK_SITE_KEY).
            await initAppCheckOnce(app, {
                env,
                isDev: import.meta.env.DEV,
                importAppCheck: () => import('firebase/app-check'),
            });
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
            const auth = authApi.getAuth(app);
            if (useEmulator) {
                const endpoint = splitHostPort(env.VITE_FIREBASE_EMULATOR_AUTH);
                if (endpoint) {
                    authApi.connectAuthEmulator(auth, `http://${endpoint.host}:${endpoint.port}`, {
                        disableWarnings: true,
                    });
                } else {
                    console.warn('VITE_FIREBASE_EMULATOR=1 but VITE_FIREBASE_EMULATOR_AUTH is missing/invalid; using live Auth.');
                }
            }
            return { app, auth, authApi };
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

            // Emulator/test runs execute in Node without IndexedDB: memory cache.
            const db = useEmulator
                ? firestoreApi.initializeFirestore(app, {
                    localCache: firestoreApi.memoryLocalCache(),
                })
                : firestoreApi.initializeFirestore(app, {
                    localCache: firestoreApi.persistentLocalCache({
                        tabManager: firestoreApi.persistentMultipleTabManager(),
                    }),
                });

            if (useEmulator) {
                const endpoint = splitHostPort(env.VITE_FIREBASE_EMULATOR_FIRESTORE);
                if (endpoint) {
                    firestoreApi.connectFirestoreEmulator(db, endpoint.host, endpoint.port);
                } else {
                    console.warn('VITE_FIREBASE_EMULATOR=1 but VITE_FIREBASE_EMULATOR_FIRESTORE is missing/invalid; using live Firestore.');
                }
            }

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
