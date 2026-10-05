// Q21: per-session cloud history (V2), behind VITE_CLOUD_LOGS_V2=1 (OFF by default).
//
// Problem: data/history is ONE document (1 MB limit); past ~900 KB the client
// truncates to 200 sessions. V2 stores each session as users/{uid}/logs/{logId}
// so history grows without a cap and syncs incrementally.
//
// Design (last-writer-wins per session id):
// - Each doc is the Log + `updatedAt` (explicit stamp, else endTime). Deletes
//   are tombstones {updatedAt, deleted:true} retained 90 days, then hard-deleted.
// - Upload is incremental: a local id->{updatedAt,contentHash} index decides
//   what changed; identical logs are never re-uploaded. Batches <= 400 ops.
// - New uploads are stamped with the upload time (max(now, endTime)), so
//   offline or back-dated sessions still pass other devices' cursors.
// - Download pulls `updatedAt > lastPulledAt - 24h overlap` and merges over the cached
//   snapshot (full pull when there is no cache). Merge: highest updatedAt
//   wins, tombstones beat older edits, ties go to the local side.
// - Migration (flag ON + network): legacy data/history unions into session
//   docs (idempotent, resumable) and only then users/{uid} gets
//   {historyFormat: 2}. Legacy data/history is NEVER deleted here.
// - Flag OFF: none of this runs; the legacy single-doc path is untouched.
//
// S5: the algorithm now lives in services/cloudCollectionSync.ts (shared with
// the nutrition/body/cardio/food collections); this module keeps the Q21 API
// and the session-specific spec (LOGS_SPEC).
import type { Log } from '../types';
import {
    adoptItems,
    chunked as chunkedImpl,
    CLOUD_V2_BATCH_LIMIT,
    CLOUD_V2_PULL_OVERLAP_MS,
    CLOUD_V2_TOMBSTONE_RETENTION_MS,
    deleteAllInCollection,
    downloadCollection,
    ensureMigrated,
    hashItemContent,
    isTombstone,
    MIGRATED_FORMAT,
    mergeItems,
    planUpload,
    projectDoc,
    sanitizeDoc,
    uploadCollection,
    type CloudV2Firestore,
    type CloudV2IndexStore,
    type CollectionSpec,
    type UploadIndex,
    type UploadIndexEntry,
    type UploadPlan,
    type UploadStats as EngineUploadStats,
} from './cloudCollectionSync';

export { isCloudLogsV2Enabled } from './cloudLogsV2Flag';

export const CLOUD_LOGS_V2_BATCH_LIMIT = CLOUD_V2_BATCH_LIMIT;
export const CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS = CLOUD_V2_TOMBSTONE_RETENTION_MS;
export const CLOUD_LOGS_V2_HISTORY_FORMAT = MIGRATED_FORMAT;
/**
 * Delta pulls re-read this window below the cursor. Stamps are client clocks,
 * so a device whose clock runs behind could write below another device's
 * cursor; the merge is idempotent, so the overlap only costs a few re-reads.
 */
export const CLOUD_LOGS_V2_PULL_OVERLAP_MS = CLOUD_V2_PULL_OVERLAP_MS;

/** A cloud session document: a live Log with its stamp, or a tombstone. */
export type SessionDoc =
    | (Log & { updatedAt: number; deleted?: false })
    | { id: number | string; updatedAt: number; deleted: true };

export const isSessionTombstone = (doc: SessionDoc): doc is Extract<SessionDoc, { deleted: true }> =>
    isTombstone(doc);

export const sessionDocId = (log: { id: number | string }): string => String(log.id);

/** Effective last-write stamp: explicit updatedAt, else endTime, else startTime. */
export const sessionUpdatedAt = (log: {
    updatedAt?: unknown;
    endTime?: unknown;
    startTime?: unknown;
}): number => {
    for (const candidate of [log.updatedAt, log.endTime, log.startTime]) {
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
            return candidate;
        }
    }
    return 0;
};

/**
 * Content hash for change detection. Excludes `updatedAt` (a stamp-only
 * difference is not an edit) and normalizes key order + undefined holes, so
 * semantically identical logs hash equally on any device. FNV-1a 32-bit.
 */
export const hashLogContent = (log: Log): string => hashItemContent(log);

/**
 * Upload index entry: last known cloud stamp + content hash ('' = tombstoned).
 * `r` marks ids learned from the cloud (download/migration) that this device's
 * local logs have not contained yet: they are never tombstoned, because their
 * absence locally means "not adopted" (e.g. the user declined the cloud merge),
 * not "deleted here". The flag clears once the id shows up locally.
 */
export type SessionUploadIndexEntry = UploadIndexEntry;
export type SessionUploadIndex = UploadIndex;
export type SessionUploadPlan = UploadPlan;

export const sanitizeSessionDoc = sanitizeDoc;

/**
 * Keys a users/{uid}/logs/{id} document may carry: the Log fields plus
 * updatedAt/deleted. MUST match sessionDocAllowedKeys() in firestore.rules
 * (a unit test compares both). Unknown keys on old local logs are dropped
 * from the CLOUD copy only, so a legacy field can never make the rules deny
 * a migration batch forever; local data is untouched.
 */
export const SESSION_DOC_KEYS = [
    'id', 'dayIdx', 'name', 'startTime', 'endTime', 'duration',
    'bodyWeightSnapshot', 'skipped', 'mesoId', 'week', 'exercises', 'note',
    'importKey', 'importedFrom', 'discipline', 'programSystem',
    'updatedAt', 'deleted',
] as const;

/** Sanitize + project to SESSION_DOC_KEYS: the exact bytes written to Firestore. */
export const projectSessionDoc = (doc: Record<string, unknown>): Record<string, unknown> =>
    projectDoc(doc, SESSION_DOC_KEYS);

const compareLogRecency = (a: Log, b: Log): number => {
    const timeDiff = (b.startTime ?? 0) - (a.startTime ?? 0);
    if (timeDiff !== 0) return timeDiff;
    if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
    const aId = String(a.id);
    const bId = String(b.id);
    return bId < aId ? -1 : bId > aId ? 1 : 0;
};

/** Session history: users/{uid}/logs, legacy source data/history, marker historyFormat. */
export const LOGS_SPEC: CollectionSpec<Log> = {
    collection: 'logs',
    idField: 'id',
    keys: SESSION_DOC_KEYS,
    stampOf: sessionUpdatedAt,
    compare: compareLogRecency,
    marker: {
        isMigrated: (userData) => userData?.historyFormat === MIGRATED_FORMAT,
        patch: () => ({ historyFormat: MIGRATED_FORMAT }),
    },
    readLegacy: async ({ db, api }, userId) => {
        const legacySnap = await api.getDoc(api.doc(db, 'users', userId, 'data', 'history'));
        const raw = legacySnap.exists() ? (legacySnap.data() as { logs?: unknown } | undefined)?.logs : [];
        return Array.isArray(raw) ? (raw as Log[]) : [];
    },
};

/**
 * Pure upload planner: new/changed/resurrected logs become upserts, locally
 * deleted ids become tombstones, expired tombstones become hard-deletes.
 * Anything byte-identical to the index is skipped (incremental).
 */
export const planSessionUpload = (localLogs: Log[], index: SessionUploadIndex, now: number): SessionUploadPlan =>
    planUpload(LOGS_SPEC, localLogs, index, now);

/**
 * Union by id of local logs + remote session docs. Highest updatedAt wins;
 * a tombstone beats older edits (and confirms absence); ties keep the local
 * side; expired tombstones are ignored. Output is live logs only, newest
 * first — no session is ever lost to a cross-device conflict.
 */
export const mergeSessionLogs = (localLogs: Log[], remoteDocs: SessionDoc[], now: number = Date.now()): Log[] =>
    mergeItems(LOGS_SPEC, localLogs, remoteDocs, now);

export const chunked = chunkedImpl;

export type CloudLogsV2Firestore = CloudV2Firestore;
export type CloudLogsV2IndexStore = CloudV2IndexStore;

export interface MigrationDeps {
    userId: string;
    localLogs: Log[];
    firestore: CloudLogsV2Firestore;
    indexStore: CloudLogsV2IndexStore;
    now: number;
}

/**
 * One-time legacy migration. Unions local logs + legacy data/history +
 * already-migrated session docs (precedence local > V2 > legacy), uploads the
 * union, and only then marks users/{uid} {historyFormat: 2}. Idempotent and
 * resumable; legacy data/history is never deleted.
 */
export const ensureSessionLogsMigrated = (deps: MigrationDeps): Promise<{ migrated: boolean; uploaded: number }> =>
    ensureMigrated(LOGS_SPEC, { ...deps, localItems: deps.localLogs });

export interface UploadDeps {
    userId: string;
    logs: Log[];
    firestore: CloudLogsV2Firestore;
    indexStore: CloudLogsV2IndexStore;
    now: number;
}

export type UploadStats = EngineUploadStats;

/** Migration (if needed) + incremental upload. The index persists only on full success. */
export const uploadSessionLogsV2 = (deps: UploadDeps): Promise<UploadStats> =>
    uploadCollection(LOGS_SPEC, { ...deps, items: deps.logs });

export interface DownloadDeps {
    userId: string;
    firestore: CloudLogsV2Firestore;
    indexStore: CloudLogsV2IndexStore;
    /** Last downloaded cloud logs (from the snapshot cache); undefined ⇒ full pull. */
    cachedLogs: Log[] | undefined;
    now: number;
}

/** Delta pull over the cached snapshot (full pull without cache/expiry cleanup included). */
export const downloadSessionLogsV2 = (deps: DownloadDeps): Promise<Log[]> =>
    downloadCollection(LOGS_SPEC, { ...deps, cachedItems: deps.cachedLogs });

/**
 * The app applied cloud logs to its local state (setLogs from a download):
 * those ids are now locally known, so a later local deletion of any of them
 * becomes a tombstone.
 */
export const adoptSessionLogsV2 = (
    userId: string,
    adoptedLogs: Array<{ id: number | string }>,
    indexStore: Pick<CloudLogsV2IndexStore, 'getIndex' | 'setIndex'>,
): Promise<void> => adoptItems(LOGS_SPEC, userId, adoptedLogs, indexStore);

/** Owner wipe of users/{uid}/logs/* in batches (account deletion, flag ON only). */
export const deleteAllSessionLogsV2 = (
    userId: string,
    firestore: Pick<CloudLogsV2Firestore, 'db' | 'api'>,
): Promise<number> => deleteAllInCollection('logs', userId, firestore);
