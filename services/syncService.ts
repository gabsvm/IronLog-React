import { AppState, CloudSyncSnapshot, DirtySyncSection, SectionSyncMeta } from "../types";
import { getFirebaseFirestoreServices } from "../lib/firebaseLoader";
import { offlineSyncQueue } from "./offlineSyncQueue";
import { dirtySyncState } from "./dirtySyncState";
import { cloudSyncCache } from "./cloudSyncCache";

const emitSyncStatus = (detail: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent('ironlog:sync-status', { detail }));
};

const sanitizeForFirestore = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

const buildSectionSyncMeta = (sections: DirtySyncSection[] | undefined, lastUpdated: number): SectionSyncMeta => {
    if (!sections || sections.length === 0) return {};
    return sections.reduce<SectionSyncMeta>((acc, section) => {
        acc[section] = lastUpdated;
        return acc;
    }, {});
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

const uploadStateNow = async (userId: string, state: Partial<AppState> & { email?: string | null }, sections?: DirtySyncSection[]) => {
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!userId || !db) return;

    const batch = firestoreApi.writeBatch(db);
    const userRef = firestoreApi.doc(db, "users", userId);
    const includeAll = !sections || sections.length === 0;
    const shouldInclude = (section: DirtySyncSection) => includeAll || sections.includes(section);
    const lastUpdated = state.lastUpdated || Date.now();
    const rawMainData: Record<string, unknown> = {
        lastUpdated,
        email: state.email || null
    };

    if (shouldInclude('program')) rawMainData.program = state.program || [];
    if (shouldInclude('activeMeso')) rawMainData.activeMeso = serializeMeso(state.activeMeso) || null;
    if (state.activeSession !== undefined) rawMainData.activeSession = state.activeSession || null;
    if (shouldInclude('config')) rawMainData.config = state.config || {};
    if (shouldInclude('exercises')) rawMainData.exercises = state.exercises || [];
    if (shouldInclude('rpFeedback')) rawMainData.rpFeedback = state.rpFeedback || {};
    if (shouldInclude('nutritionLogs')) rawMainData.nutritionLogs = (state.nutritionLogs || []).slice(-60);
    if (shouldInclude('cardioSessions')) rawMainData.cardioSessions = (state.cardioSessions || []).slice(-60);
    if (shouldInclude('bodyLogs')) rawMainData.bodyLogs = (state.bodyLogs || []).slice(-100);
    if (shouldInclude('customFoods')) rawMainData.customFoods = (state.customFoods || []).slice(-100);
    if (shouldInclude('personalTemplates')) rawMainData.personalTemplates = state.personalTemplates || [];
    if (shouldInclude('nutritionGoal')) rawMainData.nutritionGoal = state.nutritionGoal || null;
    if (shouldInclude('macroGoals')) rawMainData.macroGoals = state.macroGoals || null;
    if (shouldInclude('userProfile')) rawMainData.userProfile = state.userProfile || null;
    rawMainData.sectionSyncMeta = includeAll
        ? buildSectionSyncMeta([
            'program', 'activeMeso', 'exercises', 'logs', 'config', 'rpFeedback',
            'userProfile', 'nutritionLogs', 'cardioSessions', 'nutritionGoal',
            'bodyLogs', 'macroGoals', 'customFoods', 'personalTemplates'
        ], lastUpdated)
        : buildSectionSyncMeta(sections, lastUpdated);

    batch.set(userRef, sanitizeForFirestore(rawMainData), { merge: true });

    if (shouldInclude('logs') && state.logs) {
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
    await dirtySyncState.clear(sections);
};

export const syncService = {
    uploadUserIdentityNow,
    uploadSessionOnlyNow,
    uploadStateNow,

    flushQueue: async () => {
        const queue = await offlineSyncQueue.compact();
        if (queue.length === 0) return;

        emitSyncStatus({ phase: 'flush-start', pending: queue.length });
        const processedIds: string[] = [];

        for (const entry of queue) {
            try {
                if (entry.type === 'UPLOAD_IDENTITY') {
                    await uploadUserIdentityNow(entry.userId, entry.payload.email);
                } else if (entry.type === 'UPLOAD_SESSION_SNAPSHOT') {
                    await uploadSessionOnlyNow(entry.userId, entry.payload.session, entry.payload.lastUpdated);
                } else if (entry.type === 'UPLOAD_STATE_SNAPSHOT') {
                    await uploadStateNow(entry.userId, entry.payload.state, entry.payload.sections);
                }

                processedIds.push(entry.id);
            } catch (error) {
                emitSyncStatus({ phase: 'flush-paused', pending: queue.length - processedIds.length, error: String(error) });
                console.warn("Queued sync replay paused after failure:", error);
                break;
            }
        }

        await offlineSyncQueue.remove(processedIds);
        emitSyncStatus({ phase: 'flush-complete', processed: processedIds.length, pending: Math.max(0, queue.length - processedIds.length) });
    },

    uploadUserIdentity: async (userId: string, email: string) => {
        try {
            emitSyncStatus({ phase: 'upload-start', scope: 'identity' });
            await uploadUserIdentityNow(userId, email);
            emitSyncStatus({ phase: 'upload-success', scope: 'identity', lastSyncedAt: Date.now() });
            console.log(`Identity Synced: ${email}`);
        } catch (error) {
            await offlineSyncQueue.enqueueIdentity(userId, email);
            emitSyncStatus({ phase: 'upload-queued', scope: 'identity', error: String(error) });
            console.error("Identity Sync Failed:", error);
        }
    },

    uploadSessionOnly: async (userId: string, session: AppState['activeSession'], lastUpdated: number) => {
        try {
            emitSyncStatus({ phase: 'upload-start', scope: 'session' });
            await uploadSessionOnlyNow(userId, session, lastUpdated);
            emitSyncStatus({ phase: 'upload-success', scope: 'session', lastSyncedAt: Date.now() });
        } catch (error: any) {
            await offlineSyncQueue.enqueueSessionSnapshot(userId, session ?? null, lastUpdated);
            emitSyncStatus({ phase: 'upload-queued', scope: 'session', error: String(error) });
            if (error?.code !== 'not-found') console.error("Session Upload Failed:", error);
        }
    },

    uploadState: async (userId: string, state: Partial<AppState> & { email?: string | null }, sections?: DirtySyncSection[]) => {
        try {
            emitSyncStatus({ phase: 'upload-start', scope: 'state' });
            await uploadStateNow(userId, state, sections);
            emitSyncStatus({ phase: 'upload-success', scope: 'state', lastSyncedAt: Date.now() });
            console.log(`Cloud Sync: Upload Complete (User: ${userId}) at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            await offlineSyncQueue.enqueueStateSnapshot(userId, state, sections);
            emitSyncStatus({ phase: 'upload-queued', scope: 'state', error: String(error) });
            console.error("Cloud Sync Upload Failed:", error);
            throw error;
        }
    },

    downloadState: async (userId: string): Promise<CloudSyncSnapshot | null> => {
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

            const snapshot: CloudSyncSnapshot = {
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
                personalTemplates: data.personalTemplates,
                logs: logsData,
                lastUpdated: data.lastUpdated || Date.now(),
                syncMeta: data.sectionSyncMeta || {},
                source: 'network',
                cachedAt: Date.now(),
            };

            await cloudSyncCache.write(userId, snapshot);
            return snapshot;
        } catch (error) {
            console.error("Cloud Sync Download Failed:", error);
            const cached = await cloudSyncCache.read(userId);
            return cached ? { ...cached, source: 'cache' } : null;
        }
    }
};
