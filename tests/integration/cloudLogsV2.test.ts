// Q21: per-session cloud history (V2) against the Auth + Firestore emulators,
// under the REAL firestore.rules. The build flag is forced through a module
// mock (vi.stubEnv does not reach import.meta.env in this repo's vitest).
import { describe, it, expect, vi } from 'vitest';
import { emulatorsRunning } from './setup';
import {
    getFirebaseAuthServices,
    getFirebaseFirestoreServices,
} from '../../lib/firebaseLoader';
import { syncService } from '../../services/syncService';
import {
    adoptSessionLogsV2,
    downloadSessionLogsV2,
    uploadSessionLogsV2,
    type CloudLogsV2Firestore,
    type CloudLogsV2IndexStore,
    type SessionUploadIndex,
} from '../../services/cloudLogsV2';
import type { AppState, Log } from '../../types';

const flag = vi.hoisted(() => ({ on: false }));
vi.mock('../../services/cloudLogsV2Flag', () => ({
    isCloudLogsV2Enabled: () => flag.on,
}));

const makeLog = (id: number, name: string, startTime = 1_700_000_000_000 + id * 1000): Log =>
    ({
        id,
        dayIdx: 0,
        name,
        startTime,
        endTime: startTime + 600_000,
        duration: 600,
        mesoId: 1,
        week: 1,
        exercises: [{ id: 'e1', sets: [{ weight: 100, reps: 5 }] }],
    }) as unknown as Log;

const memoryIndexStore = (): CloudLogsV2IndexStore => {
    const index = new Map<string, SessionUploadIndex>();
    const pulled = new Map<string, number>();
    const marker = new Map<string, number>();
    return {
        getIndex: async (uid) => ({ ...(index.get(uid) ?? {}) }),
        setIndex: async (uid, value) => void index.set(uid, { ...value }),
        getLastPulledAt: async (uid) => pulled.get(uid) ?? 0,
        setLastPulledAt: async (uid, ts) => void pulled.set(uid, ts),
        getFormatMarker: async (uid) => marker.get(uid) ?? 0,
        setFormatMarker: async (uid, value) => void marker.set(uid, value),
    };
};

const register = async (tag: string) => {
    const { auth, authApi } = await getFirebaseAuthServices();
    const { db, firestoreApi } = await getFirebaseFirestoreServices();
    if (!auth || !db) throw new Error('firebase not initialized (emulator wiring broken?)');
    const email = `q21-${tag}-${Date.now()}@example.com`;
    const cred = await authApi.createUserWithEmailAndPassword(auth, email, 'q21-password');
    const firestore = { db, api: firestoreApi } as unknown as CloudLogsV2Firestore;
    return { uid: cred.user.uid, email, db, firestoreApi, firestore };
};

const stateWith = (email: string, logs: Log[]) =>
    ({ email, lastUpdated: Date.now(), logs }) as unknown as Partial<AppState> & { email?: string | null };

describe.skipIf(!emulatorsRunning)('Q21: cloud logs V2 (emulators, real rules)', () => {
    it('flag ON migrates legacy data/history into logs/, marks historyFormat 2, keeps legacy', async () => {
        const { uid, email, db, firestoreApi } = await register('migrate');

        // A legacy client (flag OFF) wrote the single-document history.
        flag.on = false;
        await syncService.uploadState(uid, stateWith(email, [makeLog(1, 'legacy-1'), makeLog(2, 'legacy-2')]), ['logs']);

        // The new build only has #2 locally plus a new session #3.
        flag.on = true;
        try {
            await syncService.uploadState(uid, stateWith(email, [makeLog(2, 'legacy-2'), makeLog(3, 'new-3')]), ['logs']);

            const docs = await firestoreApi.getDocs(firestoreApi.collection(db, 'users', uid, 'logs'));
            const byId = new Map(docs.docs.map((d) => [d.id, d.data()]));
            expect([...byId.keys()].sort()).toEqual(['1', '2', '3']);
            expect(byId.get('1')).toMatchObject({ name: 'legacy-1' });
            expect(byId.get('3')).toMatchObject({ name: 'new-3' });
            // No tombstone for the legacy-only #1 (never seen locally).
            expect(byId.get('1')).not.toHaveProperty('deleted');

            const user = await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid));
            expect(user.data()).toMatchObject({ historyFormat: 2 });
            const legacy = await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid, 'data', 'history'));
            expect(legacy.exists()).toBe(true);
            expect((legacy.data() as { logs: Log[] }).logs).toHaveLength(2);

            // syncService download with the flag ON reads the per-session docs.
            const snap = await syncService.downloadState(uid);
            expect(snap?.source).toBe('network');
            expect(snap?.logs?.map((l) => l.id).sort()).toEqual([1, 2, 3]);
        } finally {
            flag.on = false;
        }
    });

    it('flag OFF keeps the legacy single-document path (golden)', async () => {
        const { uid, email, db, firestoreApi } = await register('golden');
        flag.on = false;
        await syncService.uploadState(uid, stateWith(email, [makeLog(9, 'only')]), ['logs']);
        const legacy = await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid, 'data', 'history'));
        expect((legacy.data() as { logs: Log[] }).logs.map((l) => l.id)).toEqual([9]);
        const docs = await firestoreApi.getDocs(firestoreApi.collection(db, 'users', uid, 'logs'));
        expect(docs.size).toBe(0);
        const user = await firestoreApi.getDoc(firestoreApi.doc(db, 'users', uid));
        expect(user.data()).not.toHaveProperty('historyFormat');
    });

    it('two devices converge through real Firestore; a declined merge loses nothing', async () => {
        const { uid, firestore } = await register('devices');
        const deviceA = memoryIndexStore();
        const deviceB = memoryIndexStore();
        let now = Date.now();

        const aLogs = [makeLog(1, 'A1'), makeLog(2, 'A2')];
        await uploadSessionLogsV2({ userId: uid, logs: aLogs, firestore, indexStore: deviceA, now });

        // B has its own session and declines the cloud merge at first.
        now += 1000;
        const bOwn = [makeLog(7, 'B7')];
        const pulledB = await downloadSessionLogsV2({ userId: uid, firestore, indexStore: deviceB, cachedLogs: undefined, now });
        expect(pulledB.map((l) => l.id).sort()).toEqual([1, 2]);
        now += 1000;
        const declined = await uploadSessionLogsV2({ userId: uid, logs: bOwn, firestore, indexStore: deviceB, now });
        expect(declined.tombstoned).toBe(0);

        // Later B accepts: adopts A's sessions, edits #1, deletes #2.
        await adoptSessionLogsV2(uid, pulledB, deviceB);
        now += 1000;
        const bLocal = [{ ...pulledB.find((l) => l.id === 1)!, name: 'B-edit' }, ...bOwn];
        const statsB = await uploadSessionLogsV2({ userId: uid, logs: bLocal, firestore, indexStore: deviceB, now });
        expect(statsB).toEqual({ uploaded: 1, tombstoned: 1, expired: 0 });

        // A pulls (full, then delta) and converges to {1: B-edit, 7}.
        now += 1000;
        const onA = await downloadSessionLogsV2({ userId: uid, firestore, indexStore: deviceA, cachedLogs: aLogs, now });
        expect(onA.map((l) => l.id).sort()).toEqual([1, 7]);
        expect(onA.find((l) => l.id === 1)?.name).toBe('B-edit');

        now += 1000;
        await uploadSessionLogsV2({ userId: uid, logs: [...bLocal, makeLog(8, 'B8')], firestore, indexStore: deviceB, now });
        now += 1000;
        const onA2 = await downloadSessionLogsV2({ userId: uid, firestore, indexStore: deviceA, cachedLogs: onA, now });
        expect(onA2.map((l) => l.id).sort()).toEqual([1, 7, 8]);

        // Incremental: re-uploading unchanged logs writes nothing.
        now += 1000;
        const again = await uploadSessionLogsV2({ userId: uid, logs: [...bLocal, makeLog(8, 'B8')], firestore, indexStore: deviceB, now });
        expect(again).toEqual({ uploaded: 0, tombstoned: 0, expired: 0 });
    });
});
