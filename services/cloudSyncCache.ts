import { CloudSyncSnapshot } from '../types';
import { db } from '../utils/db';

const keyFor = (userId: string) => `il_cloud_sync_cache_v1:${userId}`;

export const cloudSyncCache = {
    async read(userId: string): Promise<CloudSyncSnapshot | null> {
        if (!userId) return null;
        return db.get<CloudSyncSnapshot | null>(keyFor(userId), null);
    },

    async write(userId: string, snapshot: CloudSyncSnapshot) {
        if (!userId) return;
        await db.set(keyFor(userId), {
            ...snapshot,
            source: 'cache',
            cachedAt: Date.now(),
        });
    },

    async clear(userId: string) {
        if (!userId) return;
        await db.del(keyFor(userId));
    }
};

