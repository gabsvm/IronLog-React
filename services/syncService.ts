import { AppState, CloudSyncSnapshot, DirtySyncSection, SectionSyncMeta } from "../types";
import { getFirebaseFirestoreServices } from "../lib/firebaseLoader";
import { offlineSyncQueue } from "./offlineSyncQueue";
import { dirtySyncState } from "./dirtySyncState";
import { cloudSyncCache } from "./cloudSyncCache";
import { isCloudLogsV2Enabled } from "./cloudLogsV2Flag";
import type { CloudLogsV2Firestore } from "./cloudLogsV2";
import { capBodyLogs, capCardioSessions, capCustomFoods, capNutritionLogs } from "./syncCaps";

// Q21: V2 is loaded on demand so the flag-OFF build keeps it off the entry chunk.
const loadCloudLogsV2 = async () => {
    const [v2, indexes, engine, sections] = await Promise.all([
        import("./cloudLogsV2"),
        import("./cloudLogsIndex"),
        import("./cloudCollectionSync"),
        import("./cloudSectionsV2"),
    ]);
    return { ...v2, ...engine, ...sections, cloudLogsIndex: indexes.cloudLogsIndex, cloudSectionIndex: indexes.cloudSectionIndex };
};

const emitSyncStatus = (detail: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent('ironlog:sync-status', { detail }));
};

const sanitizeForFirestore = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

import { buildSectionSyncMeta, serializeMeso, deserializeMeso } from "./syncHelpers";

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
    // S5: caps keep the NEWEST items by date (bodyLogs/cardio/foods are stored
    // newest-first, so the old slice(-N) kept the oldest). Still written with
    // V2 on, so builds without the flag keep seeing recent data.
    if (shouldInclude('nutritionLogs')) rawMainData.nutritionLogs = capNutritionLogs(state.nutritionLogs);
    if (shouldInclude('cardioSessions')) rawMainData.cardioSessions = capCardioSessions(state.cardioSessions);
    if (shouldInclude('bodyLogs')) rawMainData.bodyLogs = capBodyLogs(state.bodyLogs);
    if (shouldInclude('customFoods')) rawMainData.customFoods = capCustomFoods(state.customFoods);
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

    // Q21: with VITE_CLOUD_LOGS_V2=1 history goes to users/{uid}/logs/* after
    // the main doc commits; data/history is no longer written (never deleted).
    const useLogsV2 = isCloudLogsV2Enabled();

    if (!useLogsV2 && shouldInclude('logs') && state.logs) {
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
    if (useLogsV2) {
        const v2 = await loadCloudLogsV2();
        const firestore = { db, api: firestoreApi } as unknown as CloudLogsV2Firestore;
        const now = Date.now();
        if (shouldInclude('logs') && state.logs) {
            await v2.uploadSessionLogsV2({ userId, logs: state.logs, firestore, indexStore: v2.cloudLogsIndex, now });
        }
        // S5/U6: full (uncapped) per-item collections; a section may span
        // several collections (nutrition = meals + days).
        for (const section of v2.CLOUD_SECTIONS_V2) {
            const items = state[section];
            if (!shouldInclude(section) || !Array.isArray(items)) continue;
            const adapter = v2.SECTION_ADAPTERS[section];
            const split = adapter.split(items);
            for (let i = 0; i < adapter.parts.length; i++) {
                const spec = adapter.parts[i];
                await v2.uploadCollection(spec, { userId, items: split[i], firestore, indexStore: v2.cloudSectionIndex(spec.collection), now });
            }
        }
    }
    await dirtySyncState.clear(sections);
};

export const syncService = {
    uploadUserIdentityNow,
    uploadSessionOnlyNow,
    uploadStateNow,

    /**
     * Q21: the app applied downloaded cloud logs to local state. With V2 on,
     * those sessions become locally known (a later local delete tombstones
     * them); with the flag OFF this is a no-op. Never throws.
     */
    adoptCloudLogs: async (userId: string, logs: AppState['logs'] | undefined) => {
        if (!isCloudLogsV2Enabled() || !userId || !Array.isArray(logs)) return;
        try {
            const { adoptSessionLogsV2, cloudLogsIndex } = await loadCloudLogsV2();
            await adoptSessionLogsV2(userId, logs, cloudLogsIndex);
        } catch (error) {
            console.warn("Cloud logs adoption bookkeeping failed:", error);
        }
    },

    /**
     * S5: same as adoptCloudLogs for the V2 section collections the app just
     * applied from the cloud (only the sections present in `applied`).
     */
    adoptCloudSections: async (
        userId: string,
        applied: Partial<Pick<AppState, 'nutritionLogs' | 'bodyLogs' | 'cardioSessions' | 'customFoods'>>,
    ) => {
        if (!isCloudLogsV2Enabled() || !userId) return;
        try {
            const v2 = await loadCloudLogsV2();
            for (const section of v2.CLOUD_SECTIONS_V2) {
                const items = applied[section];
                if (!Array.isArray(items)) continue;
                const adapter = v2.SECTION_ADAPTERS[section];
                const split = adapter.split(items);
                for (let i = 0; i < adapter.parts.length; i++) {
                    const spec = adapter.parts[i];
                    await v2.adoptItems(spec, userId, split[i], v2.cloudSectionIndex(spec.collection));
                }
            }
        } catch (error) {
            console.warn("Cloud sections adoption bookkeeping failed:", error);
        }
    },

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
            let logsData;
            // S5: with V2 on, the four array sections come from their own
            // collections (complete history) instead of the capped arrays.
            const sectionData: Record<string, unknown> = {
                nutritionLogs: data.nutritionLogs,
                cardioSessions: data.cardioSessions,
                bodyLogs: data.bodyLogs,
                customFoods: data.customFoods,
            };
            if (isCloudLogsV2Enabled()) {
                // Q21: delta pull over the last downloaded snapshot.
                const cached = await cloudSyncCache.read(userId);
                const v2 = await loadCloudLogsV2();
                const firestore = { db, api: firestoreApi } as unknown as CloudLogsV2Firestore;
                const now = Date.now();
                const [logsResult, ...sectionResults] = await Promise.all([
                    v2.downloadSessionLogsV2({
                        userId,
                        firestore,
                        indexStore: v2.cloudLogsIndex,
                        cachedLogs: Array.isArray(cached?.logs) ? cached.logs : undefined,
                        now,
                    }),
                    ...v2.CLOUD_SECTIONS_V2.map(async (section) => {
                        const adapter = v2.SECTION_ADAPTERS[section];
                        const cachedSection = (cached as Record<string, unknown> | null)?.[section];
                        const cachedParts = Array.isArray(cachedSection) ? adapter.split(cachedSection) : null;
                        const parts = await Promise.all(adapter.parts.map((spec, i) => v2.downloadCollection(spec, {
                            userId,
                            firestore,
                            indexStore: v2.cloudSectionIndex(spec.collection),
                            cachedItems: cachedParts ? cachedParts[i] : undefined,
                            now,
                        })));
                        return adapter.join(parts);
                    }),
                ]);
                logsData = logsResult;
                v2.CLOUD_SECTIONS_V2.forEach((section, i) => {
                    sectionData[section] = sectionResults[i];
                });
            } else {
                const logsRef = firestoreApi.doc(db, "users", userId, "data", "history");
                const logsSnap = await firestoreApi.getDoc(logsRef);
                logsData = logsSnap.exists() ? logsSnap.data().logs : [];
            }

            const snapshot: CloudSyncSnapshot = {
                program: data.program,
                activeMeso: safeActiveMeso,
                activeSession: data.activeSession,
                config: data.config,
                exercises: data.exercises,
                rpFeedback: data.rpFeedback,
                userProfile: data.userProfile,
                nutritionLogs: sectionData.nutritionLogs as CloudSyncSnapshot['nutritionLogs'],
                cardioSessions: sectionData.cardioSessions as CloudSyncSnapshot['cardioSessions'],
                nutritionGoal: data.nutritionGoal,
                bodyLogs: sectionData.bodyLogs as CloudSyncSnapshot['bodyLogs'],
                macroGoals: data.macroGoals,
                customFoods: sectionData.customFoods as CloudSyncSnapshot['customFoods'],
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
