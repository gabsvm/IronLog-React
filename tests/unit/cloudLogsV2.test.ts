// Q21: per-session cloud history — pure merge/plan logic + injectable IO with an
// in-memory Firestore fake (no emulator needed here; emulator coverage lives in
// tests/integration/cloudLogsV2.test.ts).
import { describe, it, expect } from 'vitest';
import type { Log } from '../../types';
import {
    adoptSessionLogsV2,
    CLOUD_LOGS_V2_BATCH_LIMIT,
    CLOUD_LOGS_V2_HISTORY_FORMAT,
    CLOUD_LOGS_V2_PULL_OVERLAP_MS,
    CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS,
    chunked,
    deleteAllSessionLogsV2,
    downloadSessionLogsV2,
    ensureSessionLogsMigrated,
    hashLogContent,
    isCloudLogsV2Enabled,
    mergeSessionLogs,
    planSessionUpload,
    projectSessionDoc,
    sanitizeSessionDoc,
    SESSION_DOC_KEYS,
    sessionDocId,
    sessionUpdatedAt,
    uploadSessionLogsV2,
    type CloudLogsV2Firestore,
    type CloudLogsV2IndexStore,
    type SessionDoc,
    type SessionUploadIndex,
} from '../../services/cloudLogsV2';

const NOW = 1_800_000_000_000;
const DAY = 24 * 3600 * 1000;

const makeLog = (overrides: Partial<Log> & { id: number }): Log => ({
    dayIdx: 0,
    name: `Session ${overrides.id}`,
    startTime: NOW - 10 * DAY,
    endTime: NOW - 10 * DAY + 3600_000,
    duration: 3600,
    mesoId: 1,
    week: 1,
    exercises: [],
    ...overrides,
});

describe('Q21: sessionUpdatedAt / sessionDocId / sanitize', () => {
    it('prefers explicit updatedAt, then endTime, then startTime, then 0', () => {
        expect(sessionUpdatedAt({ updatedAt: 5, endTime: 4, startTime: 3 })).toBe(5);
        expect(sessionUpdatedAt({ endTime: 4, startTime: 3 })).toBe(4);
        expect(sessionUpdatedAt({ startTime: 3 })).toBe(3);
        expect(sessionUpdatedAt({})).toBe(0);
    });

    it('ignores non-numeric, NaN, and non-positive stamps', () => {
        expect(sessionUpdatedAt({ updatedAt: 'x', endTime: 7 })).toBe(7);
        expect(sessionUpdatedAt({ updatedAt: NaN, endTime: -2, startTime: 9 })).toBe(9);
        expect(sessionUpdatedAt({ updatedAt: 0, endTime: -1 })).toBe(0);
    });

    it('stringifies numeric and string ids', () => {
        expect(sessionDocId({ id: 123 })).toBe('123');
        expect(sessionDocId({ id: 'log-9' })).toBe('log-9');
    });

    it('sanitize strips undefined the way Firestore requires', () => {
        expect(sanitizeSessionDoc({ a: 1, b: undefined, c: { d: undefined, e: [undefined] } })).toEqual({
            a: 1,
            c: { e: [null] },
        });
    });
});

describe('Q21: hashLogContent', () => {
    it('is stable across key order and ignores updatedAt', () => {
        const a = makeLog({ id: 1, updatedAt: 100 });
        const b: Log = {
            exercises: [],
            week: 1,
            mesoId: 1,
            duration: 3600,
            endTime: a.endTime,
            startTime: a.startTime,
            name: a.name,
            dayIdx: 0,
            id: 1,
            updatedAt: 999,
        };
        expect(hashLogContent(a)).toBe(hashLogContent(b));
    });

    it('changes on any content edit and ignores undefined holes', () => {
        const a = makeLog({ id: 1 });
        const edited = makeLog({ id: 1, name: 'Renamed' });
        expect(hashLogContent(edited)).not.toBe(hashLogContent(a));
        const withHole = { ...a, note: undefined } as Log;
        const withoutHole = { ...a } as Log;
        delete (withoutHole as Partial<Log>).note;
        expect(hashLogContent(withHole)).toBe(hashLogContent(withoutHole));
    });
});

describe('Q21: planSessionUpload', () => {
    it('uploads everything new stamped with the upload time and seeds the index', () => {
        const logs = [makeLog({ id: 1 }), makeLog({ id: 2 })];
        const plan = planSessionUpload(logs, {}, NOW);
        expect(plan.upserts).toHaveLength(2);
        expect(plan.tombstones).toHaveLength(0);
        expect(plan.expiredTombstones).toHaveLength(0);
        // endTime is 10 days old: the stamp must be the upload time instead.
        expect(plan.upserts[0].doc.updatedAt).toBe(NOW);
        expect(plan.index['1']).toEqual({ u: NOW, h: hashLogContent(logs[0]) });
    });

    it('re-planning identical logs uploads nothing (incremental)', () => {
        const logs = [makeLog({ id: 1 }), makeLog({ id: 2 })];
        const first = planSessionUpload(logs, {}, NOW);
        const second = planSessionUpload(logs, first.index, NOW + 1000);
        expect(second.upserts).toHaveLength(0);
        expect(second.tombstones).toHaveLength(0);
        expect(second.expiredTombstones).toHaveLength(0);
    });

    it('re-uploads edited content with a strictly greater stamp', () => {
        const before = makeLog({ id: 1 });
        const first = planSessionUpload([before], {}, NOW);
        const edited = makeLog({ id: 1, name: 'Edited name' });
        const second = planSessionUpload([edited], first.index, NOW + 5000);
        expect(second.upserts).toHaveLength(1);
        const newStamp = second.upserts[0].doc.updatedAt as number;
        expect(newStamp).toBeGreaterThan(first.index['1'].u);
        expect(second.index['1']).toEqual({ u: newStamp, h: hashLogContent(edited) });
    });

    it('honors an explicit newer updatedAt stamp', () => {
        const before = makeLog({ id: 1 });
        const first = planSessionUpload([before], {}, NOW);
        const stamped = makeLog({ id: 1, updatedAt: first.index['1'].u + 100 });
        const second = planSessionUpload([stamped], first.index, NOW);
        expect(second.upserts).toHaveLength(1);
        expect(second.upserts[0].doc.updatedAt).toBe(first.index['1'].u + 100);
    });

    it('tombstones locally deleted ids and keeps the tombstone stable', () => {
        const first = planSessionUpload([makeLog({ id: 1 }), makeLog({ id: 2 })], {}, NOW);
        const deleted = planSessionUpload([makeLog({ id: 1 })], first.index, NOW + 1000);
        expect(deleted.upserts).toHaveLength(0);
        expect(deleted.tombstones).toHaveLength(1);
        expect(deleted.tombstones[0].id).toBe('2');
        expect(deleted.tombstones[0].doc).toMatchObject({ deleted: true });
        expect(deleted.index['2'].h).toBe('');
        expect(deleted.index['2'].u).toBeGreaterThan(first.index['2'].u);
        // Re-planning: tombstone already recorded → silence.
        const again = planSessionUpload([makeLog({ id: 1 })], deleted.index, NOW + 2000);
        expect(again.upserts).toHaveLength(0);
        expect(again.tombstones).toHaveLength(0);
    });

    it('resurrects a locally restored log over its tombstone', () => {
        const first = planSessionUpload([makeLog({ id: 1 })], {}, NOW);
        const deleted = planSessionUpload([], first.index, NOW + 1000);
        expect(deleted.tombstones).toHaveLength(1);
        const back = planSessionUpload([makeLog({ id: 1 })], deleted.index, NOW + 2000);
        expect(back.upserts).toHaveLength(1);
        expect((back.upserts[0].doc.updatedAt as number)).toBeGreaterThan(deleted.index['1'].u);
        expect(back.index['1'].h).toBe(hashLogContent(makeLog({ id: 1 })));
    });

    it('hard-deletes tombstones past the 90-day retention', () => {
        const old = NOW - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS - 1000;
        const index: SessionUploadIndex = { '9': { u: old, h: '' }, '8': { u: NOW - 1000, h: '' } };
        const plan = planSessionUpload([], index, NOW);
        expect(plan.expiredTombstones).toEqual(['9']);
        expect(plan.tombstones).toHaveLength(0);
        expect(plan.index['9']).toBeUndefined();
        expect(plan.index['8']).toEqual(index['8']);
    });

    it('collapses duplicate local ids (first wins) and skips invalid logs', () => {
        const logs = [
            makeLog({ id: 1, name: 'First' }),
            makeLog({ id: 1, name: 'Second' }),
            null,
            { name: 'noid' },
        ] as unknown as Log[];
        const plan = planSessionUpload(logs, {}, NOW);
        expect(plan.upserts).toHaveLength(1);
        expect(plan.upserts[0].doc.name).toBe('First');
    });

    it('stamps zero-time logs with now so delta pulls can see them', () => {
        const weird = makeLog({ id: 1, startTime: 0, endTime: 0 });
        const plan = planSessionUpload([weird], {}, NOW);
        expect(plan.upserts[0].doc.updatedAt).toBe(NOW);
    });
});

describe('Q21: mergeSessionLogs', () => {
    it('unions disjoint sets newest-first', () => {
        const local = [makeLog({ id: 1, startTime: 100 })];
        const remote: SessionDoc[] = [{ ...makeLog({ id: 2, startTime: 200 }), updatedAt: 200 }];
        const merged = mergeSessionLogs(local, remote, NOW);
        expect(merged.map((l) => l.id)).toEqual([2, 1]);
    });

    it.each([
        ['remote newer wins', 100, 200, 'remote'],
        ['local newer wins', 300, 200, 'local'],
        ['tie keeps local', 200, 200, 'local'],
    ])('%s', (_name, localEnd, remoteStamp, winner) => {
        const local = [makeLog({ id: 1, name: 'local', endTime: localEnd, startTime: localEnd - 10 })];
        const remote: SessionDoc[] = [
            { ...makeLog({ id: 1, name: 'remote', endTime: 50, startTime: 40 }), updatedAt: remoteStamp },
        ];
        const merged = mergeSessionLogs(local, remote, NOW);
        expect(merged).toHaveLength(1);
        expect(merged[0].name).toBe(winner);
    });

    it('a newer tombstone deletes; an older tombstone loses to a local edit', () => {
        const local = [makeLog({ id: 1, endTime: NOW - 100 })];
        const newerTomb: SessionDoc[] = [{ id: 1, updatedAt: NOW - 50, deleted: true }];
        expect(mergeSessionLogs(local, newerTomb, NOW)).toHaveLength(0);
        const olderTomb: SessionDoc[] = [{ id: 1, updatedAt: NOW - 200, deleted: true }];
        const kept = mergeSessionLogs(local, olderTomb, NOW);
        expect(kept).toHaveLength(1);
        expect(kept[0].id).toBe(1);
    });

    it('ignores expired tombstones', () => {
        const ancient = NOW - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS - 1000;
        const tomb: SessionDoc[] = [{ id: 7, updatedAt: ancient, deleted: true }];
        expect(mergeSessionLogs([], tomb, NOW)).toHaveLength(0);
        const local = [makeLog({ id: 7, endTime: 100 })];
        expect(mergeSessionLogs(local, tomb, NOW)).toHaveLength(1);
    });

    it('matches numeric and string forms of the same id', () => {
        const local = [{ ...makeLog({ id: 5 }), id: '5' } as unknown as Log];
        const remote: SessionDoc[] = [{ ...makeLog({ id: 5, name: 'remote' }), updatedAt: NOW }];
        const merged = mergeSessionLogs(local, remote, NOW);
        expect(merged).toHaveLength(1);
        expect(merged[0].name).toBe('remote');
    });

    it('skips malformed entries on both sides', () => {
        const merged = mergeSessionLogs(
            [null, { name: 'x' }] as unknown as Log[],
            [null, { updatedAt: 5 }] as unknown as SessionDoc[],
            NOW,
        );
        expect(merged).toHaveLength(0);
    });
});

describe('Q21: chunked', () => {
    it('splits at the batch limit', () => {
        const items = Array.from({ length: CLOUD_LOGS_V2_BATCH_LIMIT + 1 }, (_, i) => i);
        const parts = chunked(items, CLOUD_LOGS_V2_BATCH_LIMIT);
        expect(parts).toHaveLength(2);
        expect(parts[0]).toHaveLength(CLOUD_LOGS_V2_BATCH_LIMIT);
        expect(parts[1]).toHaveLength(1);
    });
});

describe('Q21: isCloudLogsV2Enabled', () => {
    it('is OFF unless the flag is exactly "1"', () => {
        expect(isCloudLogsV2Enabled({})).toBe(false);
        expect(isCloudLogsV2Enabled({ VITE_CLOUD_LOGS_V2: '1' })).toBe(true);
        expect(isCloudLogsV2Enabled({ VITE_CLOUD_LOGS_V2: '0' })).toBe(false);
        expect(isCloudLogsV2Enabled({ VITE_CLOUD_LOGS_V2: 'yes' })).toBe(false);
        expect(isCloudLogsV2Enabled({ VITE_CLOUD_LOGS_V2: undefined })).toBe(false);
    });

    it('defaults to the live import.meta.env (OFF in this suite)', () => {
        expect(isCloudLogsV2Enabled()).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// In-memory Firestore fake: maps per collection, atomic-fail batch commits,
// op counting, and the single query shape V2 uses (updatedAt > N).
// ---------------------------------------------------------------------------

interface FakeRef {
    kind: 'doc' | 'collection' | 'query';
    path: string[];
    constraint?: { field: string; op: string; value: unknown };
}

const createFakeFirestore = () => {
    const users = new Map<string, Record<string, unknown>>();
    const history = new Map<string, Record<string, unknown>>();
    const logs = new Map<string, Map<string, Record<string, unknown>>>();
    const state = {
        commits: 0,
        opsPerCommit: [] as number[],
        reads: 0,
        queries: [] as Array<{ field: string; op: string; value: unknown }>,
        failNextCommits: 0,
        failNextSets: 0,
        failNextReads: 0,
    };

    const docKey = (path: string[]): string => path.join('/');
    const readDoc = (path: string[]): Record<string, unknown> | null => {
        if (path[0] === 'users' && path.length === 2) return users.get(path[1]) ?? null;
        if (path[0] === 'users' && path[2] === 'data' && path[3] === 'history') {
            return history.get(path[1]) ?? null;
        }
        if (path[0] === 'users' && path[2] === 'logs' && path.length === 4) {
            return logs.get(path[1])?.get(path[3]) ?? null;
        }
        throw new Error(`fake: unsupported path ${docKey(path)}`);
    };
    const writeDoc = (path: string[], data: Record<string, unknown>, merge: boolean): void => {
        if (path[0] === 'users' && path.length === 2) {
            users.set(path[1], merge ? { ...(users.get(path[1]) ?? {}), ...data } : { ...data });
            return;
        }
        if (path[0] === 'users' && path[2] === 'data' && path[3] === 'history') {
            if (merge) throw new Error('fake: history merge not implemented');
            history.set(path[1], { ...data });
            return;
        }
        if (path[0] === 'users' && path[2] === 'logs' && path.length === 4) {
            let col = logs.get(path[1]);
            if (!col) {
                col = new Map();
                logs.set(path[1], col);
            }
            col.set(path[3], { ...data });
            return;
        }
        throw new Error(`fake: unsupported path ${docKey(path)}`);
    };
    const deleteDocAt = (path: string[]): void => {
        if (path[0] === 'users' && path[2] === 'logs' && path.length === 4) {
            logs.get(path[1])?.delete(path[3]);
            return;
        }
        throw new Error(`fake: unsupported delete ${docKey(path)}`);
    };

    const api = {
        doc: (_db: unknown, ...path: string[]): FakeRef => ({ kind: 'doc', path }),
        collection: (_db: unknown, ...path: string[]): FakeRef => ({ kind: 'collection', path }),
        query: (target: FakeRef, ...constraints: Array<{ field: string; op: string; value: unknown }>): FakeRef => ({
            kind: 'query',
            path: target.path,
            constraint: constraints[0],
        }),
        where: (field: string, op: string, value: unknown) => ({ field, op, value }),
        getDoc: async (ref: FakeRef) => {
            if (state.failNextReads > 0) {
                state.failNextReads -= 1;
                throw new Error('fake: injected read failure');
            }
            state.reads += 1;
            const data = readDoc(ref.path);
            return { exists: () => data !== null, data: () => (data ? { ...data } : undefined) };
        },
        getDocs: async (target: FakeRef) => {
            if (state.failNextReads > 0) {
                state.failNextReads -= 1;
                throw new Error('fake: injected read failure');
            }
            state.reads += 1;
            if (target.path[0] !== 'users' || target.path[2] !== 'logs') {
                throw new Error(`fake: unsupported collection ${docKey(target.path)}`);
            }
            let entries = [...(logs.get(target.path[1])?.entries() ?? [])];
            if (target.kind === 'query') {
                const c = target.constraint!;
                state.queries.push({ field: c.field, op: c.op, value: c.value });
                if (c.field !== 'updatedAt' || c.op !== '>') {
                    throw new Error(`fake: unsupported query ${c.field} ${c.op}`);
                }
                entries = entries.filter(([, d]) => (d.updatedAt as number) > (c.value as number));
            }
            return {
                docs: entries.map(([id, data]) => ({ id, data: () => ({ ...data }) })),
            };
        },
        setDoc: async (ref: FakeRef, data: unknown, opts?: unknown): Promise<void> => {
            if (state.failNextSets > 0) {
                state.failNextSets -= 1;
                throw new Error('fake: injected setDoc failure');
            }
            writeDoc(ref.path, { ...(data as Record<string, unknown>) }, !!(opts as { merge?: boolean } | undefined)?.merge);
        },
        deleteDoc: async (ref: FakeRef): Promise<void> => {
            deleteDocAt(ref.path);
        },
        writeBatch: (_db: unknown) => {
            const ops: Array<() => void> = [];
            return {
                set: (ref: FakeRef, data: unknown) => {
                    ops.push(() => writeDoc(ref.path, { ...(data as Record<string, unknown>) }, false));
                },
                delete: (ref: FakeRef) => {
                    ops.push(() => deleteDocAt(ref.path));
                },
                commit: async (): Promise<void> => {
                    if (state.failNextCommits > 0) {
                        state.failNextCommits -= 1;
                        throw new Error('fake: injected commit failure');
                    }
                    state.commits += 1;
                    state.opsPerCommit.push(ops.length);
                    for (const op of ops) op();
                },
            };
        },
    };
    const firestore = { db: {}, api } as unknown as CloudLogsV2Firestore;
    return { firestore, users, history, logs, state };
};

const createMemoryIndexStore = (): CloudLogsV2IndexStore & { snapshot: () => unknown } => {
    const index = new Map<string, SessionUploadIndex>();
    const pulled = new Map<string, number>();
    const marker = new Map<string, number>();
    return {
        getIndex: async (uid: string) => ({ ...(index.get(uid) ?? {}) }),
        setIndex: async (uid: string, value: SessionUploadIndex) => {
            index.set(uid, { ...value });
        },
        getLastPulledAt: async (uid: string) => pulled.get(uid) ?? 0,
        setLastPulledAt: async (uid: string, ts: number) => {
            pulled.set(uid, ts);
        },
        getFormatMarker: async (uid: string) => marker.get(uid) ?? 0,
        setFormatMarker: async (uid: string, format: number) => {
            marker.set(uid, format);
        },
        snapshot: () => ({
            index: [...index.entries()],
            pulled: [...pulled.entries()],
            marker: [...marker.entries()],
        }),
    };
};

describe('Q21: uploadSessionLogsV2 (fake Firestore)', () => {
    it('migrates legacy history once, then uploads incrementally', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { email: 'u@x.com' });
        const legacy = [makeLog({ id: 1 }), makeLog({ id: 2 })];
        fake.history.set('u1', { logs: legacy });

        const stats = await uploadSessionLogsV2({
            userId: 'u1',
            logs: legacy,
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(stats.uploaded).toBe(2);
        expect(fake.users.get('u1')).toMatchObject({ historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        // Legacy doc untouched (never deleted, never rewritten).
        expect(fake.history.get('u1')).toEqual({ logs: legacy });
        expect(fake.logs.get('u1')?.size).toBe(2);

        const commitsAfterFirst = fake.state.commits;
        const again = await uploadSessionLogsV2({
            userId: 'u1',
            logs: legacy,
            firestore: fake.firestore,
            indexStore: store,
            now: NOW + 1000,
        });
        expect(again).toEqual({ uploaded: 0, tombstoned: 0, expired: 0 });
        expect(fake.state.commits).toBe(commitsAfterFirst);
    });

    it('writes in batches of at most 400 ops', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        await store.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
        const logs = Array.from({ length: 851 }, (_, i) => makeLog({ id: 1000 + i }));
        const stats = await uploadSessionLogsV2({
            userId: 'u1',
            logs,
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(stats.uploaded).toBe(851);
        expect(fake.state.opsPerCommit).toEqual([400, 400, 51]);
        expect(fake.logs.get('u1')?.size).toBe(851);
    });

    it('a failed batch leaves the index untouched so the retry re-uploads', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        await store.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
        fake.state.failNextCommits = 1;
        const logs = [makeLog({ id: 1 })];
        await expect(
            uploadSessionLogsV2({ userId: 'u1', logs, firestore: fake.firestore, indexStore: store, now: NOW }),
        ).rejects.toThrow('fake: injected commit failure');
        expect(await store.getIndex('u1')).toEqual({});
        const retry = await uploadSessionLogsV2({
            userId: 'u1',
            logs,
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(retry.uploaded).toBe(1);
        expect(fake.logs.get('u1')?.get('1')).toMatchObject({ id: 1 });
    });

    it('tombstones deletions and hard-deletes expired tombstones', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        await store.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
        await uploadSessionLogsV2({
            userId: 'u1',
            logs: [makeLog({ id: 1 }), makeLog({ id: 2 })],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        const deleted = await uploadSessionLogsV2({
            userId: 'u1',
            logs: [makeLog({ id: 1 })],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW + 1000,
        });
        expect(deleted).toEqual({ uploaded: 0, tombstoned: 1, expired: 0 });
        expect(fake.logs.get('u1')?.get('2')).toMatchObject({ deleted: true });

        const expired = await uploadSessionLogsV2({
            userId: 'u1',
            logs: [makeLog({ id: 1 })],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW + CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS + 2000,
        });
        expect(expired).toEqual({ uploaded: 0, tombstoned: 0, expired: 1 });
        expect(fake.logs.get('u1')?.has('2')).toBe(false);
    });
});

describe('Q21: ensureSessionLogsMigrated', () => {
    it('marks fresh accounts without legacy history and uploads nothing', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { email: 'fresh@x.com' });
        const result = await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(result).toEqual({ migrated: true, uploaded: 0 });
        expect(fake.users.get('u1')).toMatchObject({ historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        expect(fake.state.commits).toBe(0);
        expect(await store.getFormatMarker('u1')).toBe(CLOUD_LOGS_V2_HISTORY_FORMAT);
    });

    it('second run is a no-op (local marker short-circuits all reads)', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', {});
        fake.history.set('u1', { logs: [makeLog({ id: 1 })] });
        await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        const readsAfterFirst = fake.state.reads;
        const commitsAfterFirst = fake.state.commits;
        const second = await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(second).toEqual({ migrated: false, uploaded: 0 });
        expect(fake.state.reads).toBe(readsAfterFirst);
        expect(fake.state.commits).toBe(commitsAfterFirst);
    });

    it('adopts a remote historyFormat marker without re-uploading', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        fake.history.set('u1', { logs: [makeLog({ id: 1 })] });
        const result = await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(result).toEqual({ migrated: false, uploaded: 0 });
        expect(fake.state.commits).toBe(0);
        expect(await store.getFormatMarker('u1')).toBe(CLOUD_LOGS_V2_HISTORY_FORMAT);
    });

    it('a failed mark retries cleanly (idempotent re-upload, then marked)', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', {});
        fake.history.set('u1', { logs: [makeLog({ id: 1 })] });
        fake.state.failNextSets = 1;
        await expect(
            ensureSessionLogsMigrated({
                userId: 'u1',
                localLogs: [],
                firestore: fake.firestore,
                indexStore: store,
                now: NOW,
            }),
        ).rejects.toThrow('fake: injected setDoc failure');
        expect(await store.getFormatMarker('u1')).toBe(0);
        const retry = await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(retry).toEqual({ migrated: true, uploaded: 1 });
        expect(fake.logs.get('u1')?.size).toBe(1);
        expect(await store.getFormatMarker('u1')).toBe(CLOUD_LOGS_V2_HISTORY_FORMAT);
    });

    it('never clobbers newer session docs with stale legacy bytes (race)', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', {});
        const legacy = makeLog({ id: 1, name: 'legacy', endTime: 1000 });
        fake.history.set('u1', { logs: [legacy] });
        const newer = { ...makeLog({ id: 1, name: 'v2-edit' }), updatedAt: 5000 };
        fake.logs.set('u1', new Map([['1', { ...newer }]]));
        const result = await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect(result).toEqual({ migrated: true, uploaded: 1 });
        expect(fake.logs.get('u1')?.get('1')).toMatchObject({ name: 'v2-edit', updatedAt: 5000 });
    });

    it('gives zero-time legacy logs a visible stamp', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', {});
        fake.history.set('u1', { logs: [makeLog({ id: 1, startTime: 0, endTime: 0 })] });
        await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        expect((fake.logs.get('u1')?.get('1') as { updatedAt: number }).updatedAt).toBe(NOW);
    });
});

describe('Q21: downloadSessionLogsV2 (fake Firestore)', () => {
    const seedMigrated = async (fake: ReturnType<typeof createFakeFirestore>, store: CloudLogsV2IndexStore) => {
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        await store.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
    };

    it('full-pulls without cache and seeds cursor + index', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        await seedMigrated(fake, store);
        fake.logs.set(
            'u1',
            new Map([
                ['1', { ...makeLog({ id: 1, startTime: 100 }), updatedAt: 1000 }],
                ['2', { ...makeLog({ id: 2, startTime: 200 }), updatedAt: 2000 }],
            ]),
        );
        const logs = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: store,
            cachedLogs: undefined,
            now: NOW,
        });
        expect(logs.map((l) => l.id)).toEqual([2, 1]);
        expect(fake.state.queries).toHaveLength(0);
        expect(await store.getLastPulledAt('u1')).toBe(2000);
        const index = await store.getIndex('u1');
        expect(Object.keys(index).sort()).toEqual(['1', '2']);
    });

    it('delta-pulls over the cache and applies tombstones', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        await seedMigrated(fake, store);
        const cached = [
            { ...makeLog({ id: 1, startTime: 100 }), updatedAt: NOW - 3000 },
            { ...makeLog({ id: 2, startTime: 200 }), updatedAt: NOW - 2000 },
        ];
        await store.setLastPulledAt('u1', NOW - 2000);
        fake.logs.set(
            'u1',
            new Map([
                ['1', { ...makeLog({ id: 1, startTime: 100 }), updatedAt: NOW - 3000 }],
                ['2', { id: 2, updatedAt: NOW - 1000, deleted: true }],
                ['3', { ...makeLog({ id: 3, startTime: 300 }), updatedAt: NOW - 1000 }],
            ]),
        );
        const logs = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: store,
            cachedLogs: cached,
            now: NOW,
        });
        expect(fake.state.queries).toEqual([
            { field: 'updatedAt', op: '>', value: NOW - 2000 - CLOUD_LOGS_V2_PULL_OVERLAP_MS },
        ]);
        expect(logs.map((l) => l.id)).toEqual([3, 1]);
        expect(await store.getLastPulledAt('u1')).toBe(NOW - 1000);
    });

    it('a full pull hard-deletes expired tombstones (best effort)', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        await seedMigrated(fake, store);
        const ancient = NOW - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS - 1000;
        fake.logs.set(
            'u1',
            new Map([
                ['9', { id: 9, updatedAt: ancient, deleted: true }],
                ['8', { id: 8, updatedAt: NOW - 1000, deleted: true }],
                ['1', { ...makeLog({ id: 1 }), updatedAt: 1000 }],
            ]),
        );
        const logs = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: store,
            cachedLogs: undefined,
            now: NOW,
        });
        expect(logs.map((l) => l.id)).toEqual([1]);
        expect(fake.logs.get('u1')?.has('9')).toBe(false);
        expect(fake.logs.get('u1')?.has('8')).toBe(true);
    });

    it('a failed delta pull rejects and never advances the cursor', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        await seedMigrated(fake, store);
        await store.setLastPulledAt('u1', 1000);
        fake.state.failNextReads = 1;
        await expect(
            downloadSessionLogsV2({
                userId: 'u1',
                firestore: fake.firestore,
                indexStore: store,
                cachedLogs: [{ ...makeLog({ id: 1 }), updatedAt: 1000 }],
                now: NOW,
            }),
        ).rejects.toThrow('fake: injected read failure');
        expect(await store.getLastPulledAt('u1')).toBe(1000);
    });

    it('a failed tombstone cleanup never fails the download', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        await seedMigrated(fake, store);
        fake.state.failNextCommits = 1;
        const ancient = NOW - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS - 1000;
        fake.logs.set('u1', new Map([['9', { id: 9, updatedAt: ancient, deleted: true }]]));
        const logs = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: store,
            cachedLogs: undefined,
            now: NOW,
        });
        expect(logs).toHaveLength(0);
        expect(await store.getLastPulledAt('u1')).toBe(ancient);
        // Cleanup failed: the expired tombstone is still there for next time.
        expect(fake.logs.get('u1')?.has('9')).toBe(true);
    });
});

describe('Q21: two simulated devices converge (fake Firestore)', () => {
    it('edits on A reach B and deletes on B reach A; nothing is lost', async () => {
        const fake = createFakeFirestore();
        const storeA = createMemoryIndexStore();
        const storeB = createMemoryIndexStore();
        fake.users.set('u1', {});
        const seed = [makeLog({ id: 1, name: 'A1' }), makeLog({ id: 2, name: 'A2' })];

        // Device A uploads first (migrates the empty legacy).
        await uploadSessionLogsV2({
            userId: 'u1',
            logs: seed,
            firestore: fake.firestore,
            indexStore: storeA,
            now: NOW,
        });
        // Device B pulls everything, edits #1, deletes #2, adds #3.
        const onB = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: storeB,
            cachedLogs: undefined,
            now: NOW + 1000,
        });
        expect(onB).toHaveLength(2);
        // The app applies the pulled logs to local state (setLogs).
        await adoptSessionLogsV2('u1', onB, storeB);
        const editedB = [
            { ...onB.find((l) => l.id === 1)!, name: 'B-edit' },
            makeLog({ id: 3, name: 'B-new', startTime: NOW, endTime: NOW + 100 }),
        ];
        const statsB = await uploadSessionLogsV2({
            userId: 'u1',
            logs: editedB,
            firestore: fake.firestore,
            indexStore: storeB,
            now: NOW + 2000,
        });
        expect(statsB).toEqual({ uploaded: 2, tombstoned: 1, expired: 0 });

        // Device A never pulled, so its first download is a full pull that
        // converges (uploads intentionally do NOT seed the pull cursor:
        // a skewed clock could otherwise hide a concurrent write).
        const queriesBeforeA = fake.state.queries.length;
        const onA = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: storeA,
            cachedLogs: seed,
            now: NOW + 3000,
        });
        expect(fake.state.queries.length).toBe(queriesBeforeA);
        expect(onA.map((l) => l.id).sort()).toEqual([1, 3]);
        expect(onA.find((l) => l.id === 1)?.name).toBe('B-edit');

        // From here on A delta-pulls: one more B-side write arrives by query.
        const cursorA = await storeA.getLastPulledAt('u1');
        expect(cursorA).toBeGreaterThan(0);
        await uploadSessionLogsV2({
            userId: 'u1',
            logs: [...editedB, makeLog({ id: 4, name: 'B-newer', startTime: NOW + 3500, endTime: NOW + 3600 })],
            firestore: fake.firestore,
            indexStore: storeB,
            now: NOW + 4000,
        });
        const onA2 = await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: storeA,
            cachedLogs: onA,
            now: NOW + 5000,
        });
        expect(fake.state.queries[fake.state.queries.length - 1]).toEqual({
            field: 'updatedAt',
            op: '>',
            value: cursorA - CLOUD_LOGS_V2_PULL_OVERLAP_MS,
        });
        expect(onA2.map((l) => l.id).sort()).toEqual([1, 3, 4]);
    });
});

describe('Q21: stale adopted stamps do not cause upload churn (regression)', () => {
    it('an edited log carrying an older cloud updatedAt uploads once, then never again', () => {
        const first = planSessionUpload([makeLog({ id: 1 })], {}, NOW);
        const adopted = { ...makeLog({ id: 1 }), updatedAt: first.index['1'].u };
        const edited = { ...adopted, name: 'edited' };
        const second = planSessionUpload([edited], first.index, NOW + 1000);
        expect(second.upserts).toHaveLength(1);
        const third = planSessionUpload([edited], second.index, NOW + 2000);
        expect(third.upserts).toHaveLength(0);
    });
});

describe('Q21: back-dated sessions still reach delta pulls (regression)', () => {
    it('a session finished offline long ago is seen by a device whose cursor is newer', async () => {
        const fake = createFakeFirestore();
        const storeA = createMemoryIndexStore();
        const storeB = createMemoryIndexStore();
        fake.users.set('u1', { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT });
        await storeA.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
        await storeB.setFormatMarker('u1', CLOUD_LOGS_V2_HISTORY_FORMAT);
        const recent = makeLog({ id: 1, startTime: NOW - 3600_000, endTime: NOW });
        await uploadSessionLogsV2({ userId: 'u1', logs: [recent], firestore: fake.firestore, indexStore: storeB, now: NOW });
        const first = await downloadSessionLogsV2({ userId: 'u1', firestore: fake.firestore, indexStore: storeA, cachedLogs: undefined, now: NOW + 1000 });
        // B uploads a session whose endTime is 3 days old (offline / CSV import).
        const old = makeLog({ id: 2, startTime: NOW - 3 * DAY, endTime: NOW - 3 * DAY + 3600_000 });
        await uploadSessionLogsV2({ userId: 'u1', logs: [recent, old], firestore: fake.firestore, indexStore: storeB, now: NOW + 2000 });
        const delta = await downloadSessionLogsV2({ userId: 'u1', firestore: fake.firestore, indexStore: storeA, cachedLogs: first, now: NOW + 3000 });
        expect(delta.map((l) => l.id).sort()).toEqual([1, 2]);
    });
});

describe('Q21: remote-only index entries are never tombstoned', () => {
    it('planSessionUpload skips absent r-entries and clears r once seen locally', () => {
        const index: SessionUploadIndex = {
            '1': { u: 1000, h: hashLogContent(makeLog({ id: 1 })), r: true },
            '2': { u: 2000, h: hashLogContent(makeLog({ id: 2 })), r: true },
        };
        const plan = planSessionUpload([makeLog({ id: 1 })], index, NOW);
        expect(plan.upserts).toHaveLength(0);
        expect(plan.tombstones).toHaveLength(0);
        expect(plan.index['1']).toEqual({ u: 1000, h: index['1'].h });
        expect(plan.index['2']).toEqual(index['2']);
        // Once locally known, a later local deletion IS a tombstone.
        const later = planSessionUpload([], plan.index, NOW + 1);
        expect(later.tombstones.map((t) => t.id)).toEqual(['1']);
    });

    it('a declined cloud merge never deletes the other device sessions', async () => {
        const fake = createFakeFirestore();
        const storeA = createMemoryIndexStore();
        const storeB = createMemoryIndexStore();
        fake.users.set('u1', {});
        await uploadSessionLogsV2({
            userId: 'u1',
            logs: [makeLog({ id: 1, name: 'A1' })],
            firestore: fake.firestore,
            indexStore: storeA,
            now: NOW,
        });
        // B has its own local history, downloads A's session but the user
        // declines the merge: B keeps uploading only its own logs.
        const bLocal = [makeLog({ id: 7, name: 'B7' })];
        await downloadSessionLogsV2({
            userId: 'u1',
            firestore: fake.firestore,
            indexStore: storeB,
            cachedLogs: undefined,
            now: NOW + 1000,
        });
        const stats = await uploadSessionLogsV2({
            userId: 'u1',
            logs: bLocal,
            firestore: fake.firestore,
            indexStore: storeB,
            now: NOW + 2000,
        });
        expect(stats.tombstoned).toBe(0);
        expect(fake.logs.get('u1')?.get('1')).toMatchObject({ name: 'A1' });
        expect(fake.logs.get('u1')?.get('1')).not.toHaveProperty('deleted');
        expect(fake.logs.get('u1')?.get('7')).toMatchObject({ name: 'B7' });
    });

    it('migration marks legacy-only sessions remote-only', async () => {
        const fake = createFakeFirestore();
        const store = createMemoryIndexStore();
        fake.users.set('u1', {});
        fake.history.set('u1', { logs: [makeLog({ id: 1 }), makeLog({ id: 2 })] });
        await ensureSessionLogsMigrated({
            userId: 'u1',
            localLogs: [makeLog({ id: 2 })],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW,
        });
        const index = await store.getIndex('u1');
        expect(index['1'].r).toBe(true);
        expect(index['2'].r).toBeUndefined();
        const stats = await uploadSessionLogsV2({
            userId: 'u1',
            logs: [makeLog({ id: 2 })],
            firestore: fake.firestore,
            indexStore: store,
            now: NOW + 1000,
        });
        expect(stats).toEqual({ uploaded: 0, tombstoned: 0, expired: 0 });
    });
});

describe('Q21: deleteAllSessionLogsV2', () => {
    it('wipes every session doc in capped batches; empty is a no-op', async () => {
        const fake = createFakeFirestore();
        const col = new Map<string, Record<string, unknown>>();
        for (let i = 0; i < 450; i++) col.set(String(i), { id: i, updatedAt: 1 });
        fake.logs.set('u1', col);
        const deleted = await deleteAllSessionLogsV2('u1', fake.firestore);
        expect(deleted).toBe(450);
        expect(fake.state.opsPerCommit).toEqual([400, 50]);
        expect(fake.logs.get('u1')?.size).toBe(0);

        const commitsBefore = fake.state.commits;
        expect(await deleteAllSessionLogsV2('u1', fake.firestore)).toBe(0);
        expect(fake.state.commits).toBe(commitsBefore);
    });
});

describe('Q21: client projection matches firestore.rules', () => {
    it('SESSION_DOC_KEYS equals sessionDocAllowedKeys() in firestore.rules', async () => {
        const { readFileSync } = await import('node:fs');
        const { resolve } = await import('node:path');
        const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
        const body = rules.match(/function sessionDocAllowedKeys\(\) \{\s*return \[([\s\S]*?)\];/);
        expect(body).not.toBeNull();
        const ruleKeys = [...body![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
        expect(ruleKeys).toEqual([...SESSION_DOC_KEYS].sort());
    });

    it('projectSessionDoc drops unknown legacy keys and undefined holes', () => {
        const doc = projectSessionDoc({ id: 1, name: 'x', legacyField: 42, note: undefined, updatedAt: 5 });
        expect(doc).toEqual({ id: 1, name: 'x', updatedAt: 5 });
    });
});
