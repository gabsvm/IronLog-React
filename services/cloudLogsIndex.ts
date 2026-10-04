// Q21: IndexedDB backing for the V2 upload index + pull cursor + format marker.
import { db } from '../utils/db';
import type { CloudLogsV2IndexStore, SessionUploadIndex } from './cloudLogsV2';

const indexKey = (uid: string) => `il_cloud_logs_v2_index_v1:${uid}`;
const pulledKey = (uid: string) => `il_cloud_logs_v2_pulled_v1:${uid}`;
const markerKey = (uid: string) => `il_cloud_logs_v2_marker_v1:${uid}`;

const isValidIndex = (value: unknown): value is SessionUploadIndex => {
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

export const cloudLogsIndex: CloudLogsV2IndexStore & { clear(uid: string): Promise<void> } = {
    async getIndex(uid: string): Promise<SessionUploadIndex> {
        if (!uid) return {};
        const stored = await db.get<unknown>(indexKey(uid), {});
        return isValidIndex(stored) ? stored : {};
    },

    async setIndex(uid: string, index: SessionUploadIndex): Promise<void> {
        if (!uid) return;
        await db.set(indexKey(uid), index);
    },

    async getLastPulledAt(uid: string): Promise<number> {
        if (!uid) return 0;
        return asNumber(await db.get<unknown>(pulledKey(uid), 0));
    },

    async setLastPulledAt(uid: string, ts: number): Promise<void> {
        if (!uid) return;
        await db.set(pulledKey(uid), ts);
    },

    async getFormatMarker(uid: string): Promise<number> {
        if (!uid) return 0;
        return asNumber(await db.get<unknown>(markerKey(uid), 0));
    },

    async setFormatMarker(uid: string, format: number): Promise<void> {
        if (!uid) return;
        await db.set(markerKey(uid), format);
    },

    async clear(uid: string): Promise<void> {
        if (!uid) return;
        await db.del(indexKey(uid));
        await db.del(pulledKey(uid));
        await db.del(markerKey(uid));
    },
};
