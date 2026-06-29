
import { AppState } from "../types";
import { getFirebaseServices } from "../lib/firebaseLoader";

/**
 * Firestore no soporta valores `undefined`.
 * Esta función elimina las claves con undefined o las convierte en null.
 */
const sanitizeForFirestore = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

/**
 * FIX: Firestore no soporta Arrays anidados (Array de Arrays) directamente.
 * El campo `activeMeso.plan` es `string[][]`.
 * Lo convertimos a un Objeto/Map ({ "0": [...], "1": [...] }) para guardarlo.
 */
const serializeMeso = (meso: any) => {
    if (!meso || !Array.isArray(meso.plan)) return meso;

    const planMap: Record<string, any[]> = {};
    meso.plan.forEach((daySlot: any[], idx: number) => {
        planMap[String(idx)] = daySlot || [];
    });

    return { ...meso, plan: planMap };
};

/**
 * Convierte el Map de Firestore de vuelta a Array de Arrays para que la App lo entienda.
 */
const deserializeMeso = (meso: any) => {
    if (!meso) return null;

    // Si ya es un array (datos antiguos o locales), lo devolvemos tal cual
    if (Array.isArray(meso.plan)) return meso;

    // Si es un objeto (Map), lo convertimos a array
    if (meso.plan && typeof meso.plan === 'object') {
        const planArray: any[][] = [];
        const keys = Object.keys(meso.plan).map(Number).sort((a, b) => a - b);

        // Encontrar el índice máximo para reconstruir el array correctamente
        const maxIdx = keys.length > 0 ? keys[keys.length - 1] : -1;

        for (let i = 0; i <= maxIdx; i++) {
            planArray[i] = meso.plan[String(i)] || [];
        }

        return { ...meso, plan: planArray };
    }

    return meso;
};

export const syncService = {
    /**
     * ID SYNC: Saves ONLY email and metadata.
     * Used for FREE users so Admin can find them.
     */
    uploadUserIdentity: async (userId: string, email: string) => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!userId || !db) return;
        // Avoid redundant writes if already synced this session
        if ((window as any)._lastSyncedId === userId) return;

        try {
            const userRef = firestoreApi.doc(db, "users", userId);
            await firestoreApi.setDoc(userRef, {
                email: email,
                lastSeen: Date.now(),
                uid: userId
            }, { merge: true });

            (window as any)._lastSyncedId = userId;
            console.log(`👤 Identity Synced: ${email}`);
        } catch (error) {
            console.error("❌ Identity Sync Failed:", error);
        }
    },

    /**
     * LIGHTWEIGHT SESSION WRITE — only uploads activeSession + timestamp.
     * Called by a fast debounce (3s) during workouts so keystrokes don't trigger
     * a full-state rewrite (~50-200KB). Uses updateDoc (field merge) instead of
     * writeBatch setDoc to avoid touching unrelated fields.
     */
    uploadSessionOnly: async (userId: string, session: AppState['activeSession'], lastUpdated: number) => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!userId || !db) return;
        try {
            const userRef = firestoreApi.doc(db, "users", userId);
            await firestoreApi.updateDoc(userRef, sanitizeForFirestore({ activeSession: session ?? null, lastUpdated }));
        } catch (error: any) {
            // updateDoc fails if the document doesn't exist yet (new user before first full upload).
            // Silently ignore — the next uploadState will create it.
            if (error?.code !== 'not-found') console.error("❌ Session Upload Failed:", error);
        }
    },

    /**
     * SUBIDA (PUSH): Envía el estado local a Firebase.
     */
    uploadState: async (userId: string, state: Partial<AppState>) => {
        const { db, auth, firestoreApi } = await getFirebaseServices();
        if (!userId || !db) return;

        try {
            const batch = firestoreApi.writeBatch(db);
            const userRef = firestoreApi.doc(db, "users", userId);

            // 1. Preparar Meso Activo (Serializar Arrays Anidados para evitar error de Firestore)
            const safeActiveMeso = serializeMeso(state.activeMeso);

            const rawMainData = {
                program: state.program || [],
                activeMeso: safeActiveMeso || null,
                activeSession: state.activeSession || null,
                config: state.config || {},
                exercises: state.exercises || [],
                rpFeedback: state.rpFeedback || {},
                // Limit to last 60 entries to avoid Firebase 1MB limit for main document
                nutritionLogs: (state.nutritionLogs || []).slice(-60),
                cardioSessions: (state.cardioSessions || []).slice(-60),
                bodyLogs: (state.bodyLogs || []).slice(-100),
                customFoods: (state.customFoods || []).slice(-100),
                nutritionGoal: state.nutritionGoal || null,
                lastUpdated: state.lastUpdated || Date.now(),
                // NEW: Save email to allow Admin Lookup
                email: auth?.currentUser?.email || null
            };

            // 2. Sanitización (undefined -> null)
            const mainData = sanitizeForFirestore(rawMainData);

            batch.set(userRef, mainData, { merge: true });

            // 3. Logs (History) in sub-collection
            if (state.logs && state.logs.length > 0) {
                const logsRef = firestoreApi.doc(db, "users", userId, "data", "history");
                let logsData = sanitizeForFirestore({ logs: state.logs });

                // Firestore document limit is 1MB. Safety check at 900KB.
                const payloadSize = JSON.stringify(logsData).length;
                if (payloadSize > 900000) {
                    // Emit a custom event so the UI can notify the user if desired.
                    // Full log history is preserved in IndexedDB; only the cloud copy is capped.
                    window.dispatchEvent(new CustomEvent('ironlog:sync-truncated', {
                        detail: { total: logsData.logs.length, kept: 200 }
                    }));
                    console.warn(`⚠️ Cloud history capped at 200 entries (payload was ${(payloadSize / 1024).toFixed(0)} KB). Local data untouched.`);
                    logsData.logs = logsData.logs.slice(0, 200); // newest logs are at index 0
                }

                batch.set(logsRef, logsData);
            }

            await batch.commit();
            console.log(`☁️ Cloud Sync: Upload Complete (User: ${userId}) at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error("❌ Cloud Sync Upload Failed:", error);
            throw error;
        }
    },

    /**
     * DESCARGA (PULL): Obtiene datos de Firebase.
     */
    downloadState: async (userId: string): Promise<Partial<AppState> | null> => {
        const { db, firestoreApi } = await getFirebaseServices();
        if (!userId || !db) return null;

        try {
            const userRef = firestoreApi.doc(db, "users", userId);
            const userSnap = await firestoreApi.getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();

                // Deserializar Meso Activo (Map -> Array[][])
                const safeActiveMeso = deserializeMeso(data.activeMeso);

                const logsRef = firestoreApi.doc(db, "users", userId, "data", "history");
                const logsSnap = await firestoreApi.getDoc(logsRef);
                const logsData = logsSnap.exists() ? logsSnap.data().logs : [];

                return {
                    program: data.program,
                    activeMeso: safeActiveMeso,
                    activeSession: data.activeSession,
                    config: data.config,
                    exercises: data.exercises,
                    rpFeedback: data.rpFeedback,
                    userProfile: data.userProfile,
                    nutritionLogs: data.nutritionLogs,
                    cardioSessions: data.cardioSessions,
                    nutritionGoal: data.nutritionGoal,
                    bodyLogs: data.bodyLogs,
                    macroGoals: data.macroGoals,
                    customFoods: data.customFoods,
                    logs: logsData,
                    lastUpdated: data.lastUpdated || Date.now(),
                };
            }
            return null;
        } catch (error) {
            console.error("❌ Cloud Sync Download Failed:", error);
            return null;
        }
    }
};
