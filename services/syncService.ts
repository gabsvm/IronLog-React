import { AppState } from "../types";
import { getFirebaseFirestoreServices } from "../lib/firebaseLoader";
import { offlineSyncQueue } from "./offlineSyncQueue";

const sanitizeForFirestore = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

const serializeMeso = (meso: any) => {
    if (!meso || !Array.isArray(meso.plan)) return meso;

    const planMap: Record<string, any[]> = {};
    meso.plan.forEach((daySlot: any[], idx: number) => {
        planMap[String(idx)] = daySlot || [];
    });

    return { ...meso, plan: planMap };
};

const deserializeMeso = (meso: any) => {
    if (!meso) return null;
    if (Array.isArray(meso.plan)) return meso;

    if (meso.plan && typeof meso.plan === 'object') {
        const planArray: any[][] = [];
        const keys = Object.keys(meso.plan).map(Number).sort((a, b) => a - b);
        const maxIdx = keys.length > 0 ? keys[keys.length - 1] : -1;

        for (let i = 0; i <= maxIdx; i++) {
            planArray[i] = meso.plan[String(i)] || [];
        }

        return { ...meso, plan: planArray };
    }

    return meso;
};

const uploadUserIdentityNow = async (userId: string, email: string) => {
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!userId || !db) return;
    if ((window as any)._lastSyncedId === userId) return;

    const userRef = firestoreApi.doc(db, "users", userId);
    await firestoreApi.setDoc(userRef, {
        email,
        lastSeen: Date.now(),
        uid: userId
    }, { merge: true });

    (window as any)._lastSyncedId = userId;
};

const uploadSessionOnlyNow = async (userId: string, session: AppState['activeSession'], lastUpdated: number) => {
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!userId || !db) return;

    const userRef = firestoreApi.doc(db, "users", userId);
    await firestoreApi.updateDoc(userRef, sanitizeForFirestore({ activeSession: session ?? null, lastUpdated }));
};

const uploadStateNow = async (userId: string, state: Partial<AppState> & { email?: string | null }) => {
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!userId || !db) return;

    const batch = firestoreApi.writeBatch(db);
    const userRef = firestoreApi.doc(db, "users", userId);
    const safeActiveMeso = serializeMeso(state.activeMeso);

    const rawMainData = {
        program: state.program || [],
        activeMeso: safeActiveMeso || null,
        activeSession: state.activeSession || null,
        config: state.config || {},
        exercises: state.exercises || [],
        rpFeedback: state.rpFeedback || {},
        nutritionLogs: (state.nutritionLogs || []).slice(-60),
        cardioSessions: (state.cardioSessions || []).slice(-60),
        bodyLogs: (state.bodyLogs || []).slice(-100),
        customFoods: (state.customFoods || []).slice(-100),
        nutritionGoal: state.nutritionGoal || null,
        lastUpdated: state.lastUpdated || Date.now(),
        email: state.email || null
    };

    batch.set(userRef, sanitizeForFirestore(rawMainData), { merge: true });

    if (state.logs && state.logs.length > 0) {
        const logsRef = firestoreApi.doc(db, "users", userId, "data", "history");
        let logsData = sanitizeForFirestore({ logs: state.logs });
        const payloadSize = JSON.stringify(logsData).length;

        if (payloadSize > 900000) {
            window.dispatchEvent(new CustomEvent('ironlog:sync-truncated', {
                detail: { total: logsData.logs.length, kept: 200 }
            }));
            console.warn(`Cloud history capped at 200 entries (payload was ${(payloadSize / 1024).toFixed(0)} KB). Local data untouched.`);
            logsData.logs = logsData.logs.slice(0, 200);
        }

        batch.set(logsRef, logsData);
    }

    await batch.commit();
};

export const syncService = {
    uploadUserIdentityNow,
    uploadSessionOnlyNow,
    uploadStateNow,

    flushQueue: async () => {
        const queue = await offlineSyncQueue.list();
        if (queue.length === 0) return;

        const processedIds: string[] = [];

        for (const entry of queue) {
            try {
                if (entry.type === 'UPLOAD_IDENTITY') {
                    await uploadUserIdentityNow(entry.userId, entry.payload.email);
                } else if (entry.type === 'UPLOAD_SESSION_SNAPSHOT') {
                    await uploadSessionOnlyNow(entry.userId, entry.payload.session, entry.payload.lastUpdated);
                } else if (entry.type === 'UPLOAD_STATE_SNAPSHOT') {
                    await uploadStateNow(entry.userId, entry.payload.state);
                }

                processedIds.push(entry.id);
            } catch (error) {
                console.warn("Queued sync replay paused after failure:", error);
                break;
            }
        }

        await offlineSyncQueue.remove(processedIds);
    },

    uploadUserIdentity: async (userId: string, email: string) => {
        try {
            await uploadUserIdentityNow(userId, email);
            console.log(`Identity Synced: ${email}`);
        } catch (error) {
            await offlineSyncQueue.enqueueIdentity(userId, email);
            console.error("Identity Sync Failed:", error);
        }
    },

    uploadSessionOnly: async (userId: string, session: AppState['activeSession'], lastUpdated: number) => {
        try {
            await uploadSessionOnlyNow(userId, session, lastUpdated);
        } catch (error: any) {
            await offlineSyncQueue.enqueueSessionSnapshot(userId, session ?? null, lastUpdated);
            if (error?.code !== 'not-found') console.error("Session Upload Failed:", error);
        }
    },

    uploadState: async (userId: string, state: Partial<AppState> & { email?: string | null }) => {
        try {
            await uploadStateNow(userId, state);
            console.log(`Cloud Sync: Upload Complete (User: ${userId}) at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            await offlineSyncQueue.enqueueStateSnapshot(userId, state);
            console.error("Cloud Sync Upload Failed:", error);
            throw error;
        }
    },

    downloadState: async (userId: string): Promise<Partial<AppState> | null> => {
        const { db, firestoreApi } = await getFirebaseFirestoreServices();
        if (!userId || !db) return null;

        try {
            const userRef = firestoreApi.doc(db, "users", userId);
            const userSnap = await firestoreApi.getDoc(userRef);

            if (!userSnap.exists()) return null;

            const data = userSnap.data();
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
        } catch (error) {
            console.error("Cloud Sync Download Failed:", error);
            return null;
        }
    }
};
