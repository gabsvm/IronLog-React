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
// Everything here is pure or takes injected IO (firestore/indexStore), so unit
// tests run without Firebase; syncService wires the real implementations.
import type { Log } from '../types';

export { isCloudLogsV2Enabled } from './cloudLogsV2Flag';

export const CLOUD_LOGS_V2_BATCH_LIMIT = 400;
export const CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS = 90 * 24 * 3600 * 1000;
export const CLOUD_LOGS_V2_HISTORY_FORMAT = 2;
/**
 * Delta pulls re-read this window below the cursor. Stamps are client clocks,
 * so a device whose clock runs behind could write below another device's
 * cursor; the merge is idempotent, so the overlap only costs a few re-reads.
 */
export const CLOUD_LOGS_V2_PULL_OVERLAP_MS = 24 * 3600 * 1000;

/** A cloud session document: a live Log with its stamp, or a tombstone. */
export type SessionDoc =
    | (Log & { updatedAt: number; deleted?: false })
    | { id: number | string; updatedAt: number; deleted: true };

export const isSessionTombstone = (doc: SessionDoc): doc is Extract<SessionDoc, { deleted: true }> =>
    (doc as { deleted?: unknown }).deleted === true;

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

const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
};

/**
 * Content hash for change detection. Excludes `updatedAt` (a stamp-only
 * difference is not an edit) and normalizes key order + undefined holes, so
 * semantically identical logs hash equally on any device. FNV-1a 32-bit.
 */
export const hashLogContent = (log: Log): string => {
    const { updatedAt: _ignored, ...rest } = log as Log & { updatedAt?: unknown };
    const canonical = stableStringify(JSON.parse(JSON.stringify(rest)));
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
        hash ^= canonical.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
};

/**
 * Upload index entry: last known cloud stamp + content hash ('' = tombstoned).
 * `r` marks ids learned from the cloud (download/migration) that this device's
 * local logs have not contained yet: they are never tombstoned, because their
 * absence locally means "not adopted" (e.g. the user declined the cloud merge),
 * not "deleted here". The flag clears once the id shows up locally.
 */
export interface SessionUploadIndexEntry {
    u: number;
    h: string;
    r?: true;
}

export type SessionUploadIndex = Record<string, SessionUploadIndexEntry>;

export const sanitizeSessionDoc = (doc: Record<string, unknown>): Record<string, unknown> =>
    JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;

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

const SESSION_DOC_KEY_SET: ReadonlySet<string> = new Set(SESSION_DOC_KEYS);

/** Sanitize + project to SESSION_DOC_KEYS: the exact bytes written to Firestore. */
export const projectSessionDoc = (doc: Record<string, unknown>): Record<string, unknown> => {
    const clean = sanitizeSessionDoc(doc);
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(clean)) {
        if (SESSION_DOC_KEY_SET.has(key)) out[key] = value;
    }
    return out;
};

export interface SessionUploadPlan {
    upserts: Array<{ id: string; doc: Record<string, unknown> }>;
    tombstones: Array<{ id: string; doc: Record<string, unknown> }>;
    /** Tombstones past retention: hard-delete the doc, drop the index entry. */
    expiredTombstones: string[];
    /** Index state AFTER this plan executes (persist only on success). */
    index: SessionUploadIndex;
}

const tombstoneIdField = (id: string): number | string => {
    if (/^-?\d+$/.test(id)) {
        const asNumber = Number(id);
        if (Number.isSafeInteger(asNumber)) return asNumber;
    }
    return id;
};

/**
 * Pure upload planner: new/changed/resurrected logs become upserts, locally
 * deleted ids become tombstones, expired tombstones become hard-deletes.
 * Anything byte-identical to the index is skipped (incremental).
 */
export const planSessionUpload = (
    localLogs: Log[],
    index: SessionUploadIndex,
    now: number,
): SessionUploadPlan => {
    const next: SessionUploadIndex = { ...index };
    const upserts: SessionUploadPlan['upserts'] = [];
    const tombstones: SessionUploadPlan['tombstones'] = [];
    const expiredTombstones: string[] = [];
    const seen = new Set<string>();

    for (const log of localLogs) {
        if (!log || log.id === undefined || log.id === null) continue;
        const id = String(log.id);
        if (seen.has(id)) continue;
        seen.add(id);
        const entry = index[id];
        const contentHash = hashLogContent(log);
        const computed = sessionUpdatedAt(log);
        const stamped =
            typeof log.updatedAt === 'number' && Number.isFinite(log.updatedAt) ? log.updatedAt : null;

        if (!entry) {
            // Stamp new uploads with the upload time, never just endTime: a
            // session finished offline (or imported with an old date) must
            // still land above other devices' pull cursors.
            const u = Math.max(now, computed);
            const { updatedAt: _drop, ...rest } = log;
            upserts.push({ id, doc: { ...sanitizeSessionDoc(rest as Record<string, unknown>), updatedAt: u } });
            next[id] = { u, h: contentHash };
            continue;
        }
        if (entry.h === '') {
            // Resurrection over our own tombstone: the new write must beat it.
            const u = Math.max(now, entry.u + 1);
            const { updatedAt: _drop, ...rest } = log;
            upserts.push({ id, doc: { ...sanitizeSessionDoc(rest as Record<string, unknown>), updatedAt: u } });
            next[id] = { u, h: contentHash };
            continue;
        }
        // Only a NEWER explicit stamp is a change: logs adopted from the cloud
        // keep their old updatedAt after a local edit, and treating "older"
        // as a change would re-upload them on every sync.
        if ((stamped !== null && stamped > entry.u) || contentHash !== entry.h) {
            const u =
                stamped !== null && stamped > entry.u ? stamped : Math.max(entry.u + 1, now);
            const { updatedAt: _drop, ...rest } = log;
            upserts.push({ id, doc: { ...sanitizeSessionDoc(rest as Record<string, unknown>), updatedAt: u } });
            next[id] = { u, h: contentHash };
        }
        // Else: identical stamp + hash → skip (the incremental win). A
        // remote-only entry seen locally becomes locally known (no upload).
        else if (entry.r) {
            next[id] = { u: entry.u, h: entry.h };
        }
    }

    for (const [id, entry] of Object.entries(index)) {
        if (seen.has(id)) continue;
        // Never adopted locally → absence is not a deletion.
        if (entry.r) continue;
        if (entry.h === '') {
            if (entry.u < now - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS) {
                expiredTombstones.push(id);
                delete next[id];
            }
            continue;
        }
        const u = Math.max(now, entry.u + 1);
        tombstones.push({
            id,
            doc: { id: tombstoneIdField(id), updatedAt: u, deleted: true },
        });
        next[id] = { u, h: '' };
    }

    return { upserts, tombstones, expiredTombstones, index: next };
};

const compareLogRecency = (a: Log, b: Log): number => {
    const timeDiff = (b.startTime ?? 0) - (a.startTime ?? 0);
    if (timeDiff !== 0) return timeDiff;
    if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
    const aId = String(a.id);
    const bId = String(b.id);
    return bId < aId ? -1 : bId > aId ? 1 : 0;
};

/**
 * Union by id of local logs + remote session docs. Highest updatedAt wins;
 * a tombstone beats older edits (and confirms absence); ties keep the local
 * side; expired tombstones are ignored. Output is live logs only, newest
 * first — no session is ever lost to a cross-device conflict, it just waits
 * for a newer write.
 */
export const mergeSessionLogs = (
    localLogs: Log[],
    remoteDocs: SessionDoc[],
    now: number = Date.now(),
): Log[] => {
    const byId = new Map<string, { log: Log; u: number }>();
    for (const log of localLogs) {
        if (!log || log.id === undefined || log.id === null) continue;
        const id = String(log.id);
        if (!byId.has(id)) byId.set(id, { log, u: sessionUpdatedAt(log) });
    }
    for (const doc of remoteDocs) {
        if (!doc || doc.id === undefined || doc.id === null) continue;
        const id = String(doc.id);
        const remoteStamp =
            typeof doc.updatedAt === 'number' && Number.isFinite(doc.updatedAt) ? doc.updatedAt : 0;
        const current = byId.get(id);
        if (isSessionTombstone(doc)) {
            if (remoteStamp < now - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS) continue;
            if (!current || remoteStamp > current.u) byId.delete(id);
            continue;
        }
        if (!current || remoteStamp > current.u) {
            byId.set(id, { log: doc as Log, u: remoteStamp });
        }
    }
    return [...byId.values()].map((entry) => entry.log).sort(compareLogRecency);
};

export const chunked = <T>(items: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
};

/** Structural Firestore surface (the real SDK satisfies it; tests inject fakes). */
export interface CloudLogsV2Firestore {
    db: unknown;
    api: {
        doc(db: unknown, ...path: string[]): unknown;
        collection(db: unknown, ...path: string[]): unknown;
        getDoc(ref: unknown): Promise<{ exists(): boolean; data(): any }>;
        getDocs(target: unknown): Promise<{ docs: Array<{ id: string; data(): any }> }>;
        setDoc(ref: unknown, data: unknown, opts?: unknown): Promise<void>;
        deleteDoc(ref: unknown): Promise<void>;
        writeBatch(db: unknown): {
            set(ref: unknown, data: unknown): void;
            delete(ref: unknown): void;
            commit(): Promise<void>;
        };
        query(target: unknown, ...constraints: unknown[]): unknown;
        where(field: string, op: string, value: unknown): unknown;
    };
}

export interface CloudLogsV2IndexStore {
    getIndex(uid: string): Promise<SessionUploadIndex>;
    setIndex(uid: string, index: SessionUploadIndex): Promise<void>;
    getLastPulledAt(uid: string): Promise<number>;
    setLastPulledAt(uid: string, ts: number): Promise<void>;
    getFormatMarker(uid: string): Promise<number>;
    setFormatMarker(uid: string, format: number): Promise<void>;
}

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
 * union, and only then marks users/{uid} {historyFormat: 2}. Idempotent
 * (setDoc overwrites) and resumable (no marker ⇒ runs again). Legacy
 * data/history is never deleted. Safe under multi-device races: every writer
 * uploads the same bytes for untouched legacy logs.
 */
export const ensureSessionLogsMigrated = async (
    deps: MigrationDeps,
): Promise<{ migrated: boolean; uploaded: number }> => {
    const { userId, localLogs, firestore, indexStore, now } = deps;
    if ((await indexStore.getFormatMarker(userId)) === CLOUD_LOGS_V2_HISTORY_FORMAT) {
        return { migrated: false, uploaded: 0 };
    }
    const { db, api } = firestore;
    const userSnap = await api.getDoc(api.doc(db, 'users', userId));
    if (userSnap.exists() && (userSnap.data() as { historyFormat?: unknown } | undefined)?.historyFormat === CLOUD_LOGS_V2_HISTORY_FORMAT) {
        await indexStore.setFormatMarker(userId, CLOUD_LOGS_V2_HISTORY_FORMAT);
        return { migrated: false, uploaded: 0 };
    }
    const legacySnap = await api.getDoc(api.doc(db, 'users', userId, 'data', 'history'));
    const legacyRaw = legacySnap.exists() ? (legacySnap.data() as { logs?: unknown } | undefined)?.logs : [];
    const legacyLogs = Array.isArray(legacyRaw) ? (legacyRaw as Log[]) : [];
    const existingSnap = await api.getDocs(api.collection(db, 'users', userId, 'logs'));
    const existingDocs = existingSnap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: (d.data() as { id?: unknown } | undefined)?.id ?? d.id })) as SessionDoc[];
    // Precedence local > existing V2 > legacy: each merge keeps its local
    // side on ties and takes the remote side only when strictly newer.
    const union = mergeSessionLogs(
        existingDocs.filter((d) => !isSessionTombstone(d)) as Log[],
        legacyLogs.map((l) => ({ ...l, updatedAt: sessionUpdatedAt(l) })) as SessionDoc[],
        now,
    );
    const withLocal = mergeSessionLogs(
        Array.isArray(localLogs) ? localLogs : [],
        union.map((l) => ({ ...l, updatedAt: sessionUpdatedAt(l) })) as SessionDoc[],
        now,
    );

    // No zero stamps: updatedAt 0 would be invisible to `updatedAt > N` pulls.
    const stampOf = (log: Log): number => sessionUpdatedAt(log) || now;
    for (const batch of chunked(withLocal, CLOUD_LOGS_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const log of batch) {
            const { updatedAt: _drop, ...rest } = log;
            writer.set(
                api.doc(db, 'users', userId, 'logs', sessionDocId(log)),
                projectSessionDoc({ ...(rest as Record<string, unknown>), updatedAt: stampOf(log) }),
            );
        }
        await writer.commit();
    }
    await api.setDoc(api.doc(db, 'users', userId), { historyFormat: CLOUD_LOGS_V2_HISTORY_FORMAT }, { merge: true });

    // Seed the upload index so the first incremental upload is a no-op.
    // Ids not in the local logs are remote-only (`r`): never tombstoned.
    const localIds = new Set((Array.isArray(localLogs) ? localLogs : []).map((l) => sessionDocId(l)));
    const index = await indexStore.getIndex(userId);
    for (const log of withLocal) {
        const id = sessionDocId(log);
        const entry: SessionUploadIndexEntry = { u: stampOf(log), h: hashLogContent(log) };
        if (!localIds.has(id) && (!index[id] || index[id].r)) entry.r = true;
        index[id] = entry;
    }
    await indexStore.setIndex(userId, index);
    await indexStore.setFormatMarker(userId, CLOUD_LOGS_V2_HISTORY_FORMAT);
    return { migrated: true, uploaded: withLocal.length };
};

export interface UploadDeps {
    userId: string;
    logs: Log[];
    firestore: CloudLogsV2Firestore;
    indexStore: CloudLogsV2IndexStore;
    now: number;
}

export interface UploadStats {
    uploaded: number;
    tombstoned: number;
    expired: number;
}

/** Migration (if needed) + incremental upload. The index persists only on full success. */
export const uploadSessionLogsV2 = async (deps: UploadDeps): Promise<UploadStats> => {
    const { userId, logs, firestore, indexStore, now } = deps;
    const { db, api } = firestore;
    const migration = await ensureSessionLogsMigrated({
        userId,
        localLogs: Array.isArray(logs) ? logs : [],
        firestore,
        indexStore,
        now,
    });
    const plan = planSessionUpload(
        Array.isArray(logs) ? logs : [],
        await indexStore.getIndex(userId),
        now,
    );
    const migratedUploads = migration.uploaded;
    for (const batch of chunked([...plan.upserts, ...plan.tombstones], CLOUD_LOGS_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const item of batch) {
            writer.set(api.doc(db, 'users', userId, 'logs', item.id), projectSessionDoc(item.doc));
        }
        await writer.commit();
    }
    for (const batch of chunked(plan.expiredTombstones, CLOUD_LOGS_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const id of batch) writer.delete(api.doc(db, 'users', userId, 'logs', id));
        await writer.commit();
    }
    await indexStore.setIndex(userId, plan.index);
    return {
        uploaded: plan.upserts.length + migratedUploads,
        tombstoned: plan.tombstones.length,
        expired: plan.expiredTombstones.length,
    };
};

export interface DownloadDeps {
    userId: string;
    firestore: CloudLogsV2Firestore;
    indexStore: CloudLogsV2IndexStore;
    /** Last downloaded cloud logs (from the snapshot cache); undefined ⇒ full pull. */
    cachedLogs: Log[] | undefined;
    now: number;
}

/** Delta pull over the cached snapshot (full pull without cache/expiry cleanup included). */
export const downloadSessionLogsV2 = async (deps: DownloadDeps): Promise<Log[]> => {
    const { userId, firestore, indexStore, cachedLogs, now } = deps;
    const { db, api } = firestore;
    await ensureSessionLogsMigrated({ userId, localLogs: [], firestore, indexStore, now });
    const lastPulled = await indexStore.getLastPulledAt(userId);
    const col = api.collection(db, 'users', userId, 'logs');
    let remoteDocs: SessionDoc[];
    if (Array.isArray(cachedLogs) && lastPulled > 0) {
        const since = Math.max(0, lastPulled - CLOUD_LOGS_V2_PULL_OVERLAP_MS);
        const snap = await api.getDocs(api.query(col, api.where('updatedAt', '>', since)));
        remoteDocs = snap.docs.map((d) => {
            const data = (d.data() ?? {}) as Record<string, unknown>;
            return { ...data, id: (data.id ?? d.id) as number | string };
        }) as SessionDoc[];
    } else {
        const snap = await api.getDocs(col);
        remoteDocs = snap.docs.map((d) => {
            const data = (d.data() ?? {}) as Record<string, unknown>;
            return { ...data, id: (data.id ?? d.id) as number | string };
        }) as SessionDoc[];
        // Opportunistic expiry on full pulls (best effort; never fails the download).
        const expired = remoteDocs.filter(
            (d) => isSessionTombstone(d) && d.updatedAt < now - CLOUD_LOGS_V2_TOMBSTONE_RETENTION_MS,
        );
        if (expired.length > 0) {
            try {
                for (const batch of chunked(expired, CLOUD_LOGS_V2_BATCH_LIMIT)) {
                    const writer = api.writeBatch(db);
                    for (const tomb of batch) writer.delete(api.doc(db, 'users', userId, 'logs', String(tomb.id)));
                    await writer.commit();
                }
            } catch {
                // Tombstone GC is hygiene; the merge below already ignores them.
            }
        }
    }

    const merged = mergeSessionLogs(Array.isArray(cachedLogs) ? cachedLogs : [], remoteDocs, now);

    // Seed the upload index with fetched live docs (never downgrade a stamp):
    // content already in the cloud is never re-uploaded. New ids are marked
    // remote-only (`r`) until they appear in the local logs, so a declined
    // cloud merge can never tombstone another device's sessions.
    if (remoteDocs.length > 0) {
        const index = await indexStore.getIndex(userId);
        let changed = false;
        for (const doc of remoteDocs) {
            if (isSessionTombstone(doc)) continue;
            const id = sessionDocId(doc);
            const current = index[id];
            if (!current || doc.updatedAt > current.u) {
                index[id] = { u: doc.updatedAt, h: hashLogContent(doc as Log) };
                if (!current || current.r) index[id].r = true;
                changed = true;
            }
        }
        if (changed) await indexStore.setIndex(userId, index);
    }
    const maxSeen = remoteDocs.reduce(
        (m, d) => (typeof d.updatedAt === 'number' && d.updatedAt > m ? d.updatedAt : m),
        lastPulled,
    );
    await indexStore.setLastPulledAt(userId, maxSeen);
    return merged;
};

/**
 * The app applied cloud logs to its local state (setLogs from a download):
 * those ids are now locally known, so a later local deletion of any of them
 * becomes a tombstone. Ids not in the index are left alone (the next upload
 * plans them normally).
 */
export const adoptSessionLogsV2 = async (
    userId: string,
    adoptedLogs: Array<{ id: number | string }>,
    indexStore: Pick<CloudLogsV2IndexStore, 'getIndex' | 'setIndex'>,
): Promise<void> => {
    if (!userId || !Array.isArray(adoptedLogs) || adoptedLogs.length === 0) return;
    const index = await indexStore.getIndex(userId);
    let changed = false;
    for (const log of adoptedLogs) {
        if (!log || log.id === undefined || log.id === null) continue;
        const entry = index[sessionDocId(log)];
        if (entry?.r) {
            index[sessionDocId(log)] = { u: entry.u, h: entry.h };
            changed = true;
        }
    }
    if (changed) await indexStore.setIndex(userId, index);
};

/** Owner wipe of users/{uid}/logs/* in batches (account deletion, flag ON only). */
export const deleteAllSessionLogsV2 = async (
    userId: string,
    firestore: Pick<CloudLogsV2Firestore, 'db' | 'api'>,
): Promise<number> => {
    const { db, api } = firestore;
    const snap = await api.getDocs(api.collection(db, 'users', userId, 'logs'));
    let deleted = 0;
    for (const batch of chunked(snap.docs, CLOUD_LOGS_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const d of batch) writer.delete(api.doc(db, 'users', userId, 'logs', d.id));
        await writer.commit();
        deleted += batch.length;
    }
    return deleted;
};
