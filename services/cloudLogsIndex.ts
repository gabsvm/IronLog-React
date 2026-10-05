// Q21/S5: IndexedDB backing for each V2 collection's upload index, pull cursor
// and format marker (one namespace per collection, keyed by uid).
import { db } from '../utils/db';
import type { CloudV2IndexStore, UploadIndex } from './cloudCollectionSync';

const isValidIndex = (value: unknown): value is UploadIndex => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.values(value as Record<string, unknown>).every(
        (entry) =>
            !!entry &&
            typeof entry === 'object' &&
            typeof (entry as { u?: unknown }).u === 'number' &&
            typeof (entry as { h?: unknown }).h === 'string',
    );
};

const asNumber = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export type ClearableIndexStore = CloudV2IndexStore & { clear(uid: string): Promise<void> };

/** `prefix` namespaces the keys, e.g. 'il_cloud_logs_v2' → 'il_cloud_logs_v2_index_v1:<uid>'. */
export const createCloudIndexStore = (prefix: string): ClearableIndexStore => {
    const indexKey = (uid: string) => `${prefix}_index_v1:${uid}`;
    const pulledKey = (uid: string) => `${prefix}_pulled_v1:${uid}`;
    const markerKey = (uid: string) => `${prefix}_marker_v1:${uid}`;
    return {
        async getIndex(uid) {
            if (!uid) return {};
            const stored = await db.get<unknown>(indexKey(uid), {});
            return isValidIndex(stored) ? stored : {};
        },
        async setIndex(uid, index) {
            if (!uid) return;
            await db.set(indexKey(uid), index);
        },
        async getLastPulledAt(uid) {
            if (!uid) return 0;
            return asNumber(await db.get<unknown>(pulledKey(uid), 0));
        },
        async setLastPulledAt(uid, ts) {
            if (!uid) return;
            await db.set(pulledKey(uid), ts);
        },
        async getFormatMarker(uid) {
            if (!uid) return 0;
            return asNumber(await db.get<unknown>(markerKey(uid), 0));
        },
        async setFormatMarker(uid, format) {
            if (!uid) return;
            await db.set(markerKey(uid), format);
        },
        async clear(uid) {
            if (!uid) return;
            await db.del(indexKey(uid));
            await db.del(pulledKey(uid));
            await db.del(markerKey(uid));
        },
    };
};

/** Session history (Q21): same keys as before the S5 generalization. */
export const cloudLogsIndex = createCloudIndexStore('il_cloud_logs_v2');

const sectionStores = new Map<string, ClearableIndexStore>();

/** S5: one store per section collection ('il_cloud_<collection>_v2_*'). */
export const cloudSectionIndex = (collection: string): ClearableIndexStore => {
    let store = sectionStores.get(collection);
    if (!store) {
        store = createCloudIndexStore(`il_cloud_${collection}_v2`);
        sectionStores.set(collection, store);
    }
    return store;
};
