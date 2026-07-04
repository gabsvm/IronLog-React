import { AppState, SyncQueueEntry } from '../types';
import { db } from '../utils/db';

const SYNC_QUEUE_KEY = 'il_sync_queue_v1';

type QueueStateSnapshot = Partial<AppState> & { email?: string | null };

const readQueue = async (): Promise<SyncQueueEntry[]> =>
    db.get<SyncQueueEntry[]>(SYNC_QUEUE_KEY, []);

const writeQueue = async (entries: SyncQueueEntry[]) => {
    await db.set(SYNC_QUEUE_KEY, entries);
};

const dedupeKeyFor = (entry: Pick<SyncQueueEntry, 'type' | 'userId'>) => `${entry.userId}:${entry.type}`;

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

export const offlineSyncQueue = {
    async enqueueIdentity(userId: string, email: string) {
        const queue = await readQueue();
        await writeQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_IDENTITY',
            userId,
            payload: { email },
        })));
    },

    async enqueueSessionSnapshot(userId: string, session: AppState['activeSession'] | null, lastUpdated: number) {
        const queue = await readQueue();
        await writeQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_SESSION_SNAPSHOT',
            userId,
            payload: { session, lastUpdated },
        })));
    },

    async enqueueStateSnapshot(userId: string, state: QueueStateSnapshot) {
        const queue = await readQueue();
        await writeQueue(upsertEntry(queue, makeEntry({
            type: 'UPLOAD_STATE_SNAPSHOT',
            userId,
            payload: { state },
        })));
    },

    async list() {
        return readQueue();
    },

    async remove(ids: string[]) {
        if (ids.length === 0) return;
        const queue = await readQueue();
        await writeQueue(queue.filter(entry => !ids.includes(entry.id)));
    },

    async clear() {
        await writeQueue([]);
    },
};
