import { AppState, DirtySyncSection, SyncQueueEntry } from '../types';
import { db } from '../utils/db';
import { requestBackgroundSync } from './backgroundSync';

const SYNC_QUEUE_KEY = 'il_sync_queue_v1';
const SYNC_QUEUE_EVENT = 'ironlog:sync-queue-changed';

type QueueStateSnapshot = Partial<AppState> & { email?: string | null };

const readQueue = async (): Promise<SyncQueueEntry[]> =>
    db.get<SyncQueueEntry[]>(SYNC_QUEUE_KEY, []);

const writeQueue = async (entries: SyncQueueEntry[]) => {
    await db.set(SYNC_QUEUE_KEY, entries);
    window.dispatchEvent(new CustomEvent(SYNC_QUEUE_EVENT, {
        detail: { pending: entries.length }
    }));
};

const dedupeKeyFor = (entry: Pick<SyncQueueEntry, 'type' | 'userId'>) => `${entry.userId}:${entry.type}`;

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const makeEntry = <T extends SyncQueueEntry>(entry: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
    const now = Date.now();
    return {
        ...entry,
        id: `${entry.type}:${entry.userId}:${now}:${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
    } as T;
};

const upsertEntry = (queue: SyncQueueEntry[], next: SyncQueueEntry) => {
    const dedupeKey = dedupeKeyFor(next);
    const index = queue.findIndex(item => dedupeKeyFor(item) === dedupeKey);

    if (index === -1) return [...queue, next];

    const existing = queue[index];
    if (existing.type === 'UPLOAD_STATE_SNAPSHOT' && next.type === 'UPLOAD_STATE_SNAPSHOT') {
        const merged: SyncQueueEntry = {
            ...next,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: Date.now(),
            payload: {
                state: {
                    ...existing.payload.state,
                    ...next.payload.state,
                },
                sections: unique([
                    ...(existing.payload.sections || []),
                    ...(next.payload.sections || []),
                ]) as DirtySyncSection[],
            }
        } as SyncQueueEntry;

        const copy = queue.slice();
        copy[index] = merged;
        return copy;
    }

    const merged: SyncQueueEntry = {
        ...next,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
    };

    const copy = queue.slice();
    copy[index] = merged;
    return copy;
};

const compactQueue = (queue: SyncQueueEntry[]) =>
    queue.reduce<SyncQueueEntry[]>((acc, entry) => upsertEntry(acc, entry), []);

const persistQueue = async (entries: SyncQueueEntry[]) => {
    await writeQueue(entries);
    if (entries.length > 0) {
        void requestBackgroundSync();
    }
};

export const offlineSyncQueue = {
    async enqueueIdentity(userId: string, email: string) {
        const queue = await readQueue();
        await persistQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_IDENTITY',
            userId,
            payload: { email },
        })));
    },

    async enqueueSessionSnapshot(userId: string, session: AppState['activeSession'] | null, lastUpdated: number) {
        const queue = await readQueue();
        await persistQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_SESSION_SNAPSHOT',
            userId,
            payload: { session, lastUpdated },
        })));
    },

    async enqueueStateSnapshot(userId: string, state: QueueStateSnapshot, sections?: DirtySyncSection[]) {
        const queue = await readQueue();
        await persistQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_STATE_SNAPSHOT',
            userId,
            payload: { state, sections },
        })));
    },

    async list() {
        return readQueue();
    },

    async count() {
        const queue = await readQueue();
        return queue.length;
    },

    async remove(ids: string[]) {
        if (ids.length === 0) return;
        const queue = await readQueue();
        await writeQueue(queue.filter(entry => !ids.includes(entry.id)));
    },

    async compact() {
        const queue = await readQueue();
        const compacted = compactQueue(queue);
        if (compacted.length !== queue.length || JSON.stringify(compacted) !== JSON.stringify(queue)) {
            await writeQueue(compacted);
        }
        return compacted;
    },

    async clear() {
        await writeQueue([]);
    },

    eventName: SYNC_QUEUE_EVENT,
};
