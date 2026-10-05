// S5: generic per-document cloud sync engine (V2), extracted from the Q21
// session-history implementation so the same proven rules apply to every
// collection: users/{uid}/logs (Q21) and, behind the same flag,
// nutritionLogs / bodyLogs / cardioSessions / customFoods.
//
// Design (last-writer-wins per item id) — see services/cloudLogsV2.ts for the
// full rationale and the three defects fixed while closing Q21:
// - Each doc is the item + `updatedAt`; deletes are tombstones
//   {<idField>, updatedAt, deleted: true} kept 90 days, then hard-deleted.
// - Incremental upload via a local id→{u, h, r?} index (hash ignores updatedAt);
//   new items stamped max(now, fallback) so they pass other devices' cursors;
//   only a NEWER explicit stamp counts as a change; remote-only (`r`) entries
//   are never tombstoned. Batches ≤ 400 ops; the index persists only on success.
// - Download: full pull without cache, else `updatedAt > cursor − 24 h`;
//   merge = highest stamp wins, tombstones beat older edits, ties keep local.
// - Migration: local ∪ existing V2 docs ∪ legacy source, uploaded, THEN the
//   per-collection marker is written (idempotent, resumable, legacy kept).
// Pure or injected IO only: unit tests run without Firebase.

export const CLOUD_V2_BATCH_LIMIT = 400;
export const CLOUD_V2_TOMBSTONE_RETENTION_MS = 90 * 24 * 3600 * 1000;
export const CLOUD_V2_PULL_OVERLAP_MS = 24 * 3600 * 1000;

/** Structural Firestore surface (the real SDK satisfies it; tests inject fakes). */
export interface CloudV2Firestore {
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

/** Index entry: last known cloud stamp, content hash ('' = tombstoned), remote-only flag. */
export interface UploadIndexEntry {
    u: number;
    h: string;
    r?: true;
}

export type UploadIndex = Record<string, UploadIndexEntry>;

export interface CloudV2IndexStore {
    getIndex(uid: string): Promise<UploadIndex>;
    setIndex(uid: string, index: UploadIndex): Promise<void>;
    getLastPulledAt(uid: string): Promise<number>;
    setLastPulledAt(uid: string, ts: number): Promise<void>;
    getFormatMarker(uid: string): Promise<number>;
    setFormatMarker(uid: string, format: number): Promise<void>;
}

/** What makes one collection different from another. */
export interface CollectionSpec<T extends object> {
    /** Subcollection under users/{uid}. */
    collection: string;
    /** Field that carries the item id inside the document ('id', or 'date' for nutrition days). */
    idField: string;
    /** Keys a cloud doc may carry (MUST match firestore.rules); unknown keys are dropped. */
    keys: readonly string[];
    /** Effective last-write stamp of an item (explicit updatedAt first, then a fallback). */
    stampOf(item: T): number;
    /** Output order of merged items (the app's own convention). */
    compare(a: T, b: T): number;
    /** Format marker stored on users/{uid} once the collection is migrated. */
    marker: {
        isMigrated(userData: Record<string, unknown> | undefined): boolean;
        patch(): Record<string, unknown>;
    };
    /** Legacy (pre-V2) copy of the collection, for the one-time migration. */
    readLegacy(firestore: CloudV2Firestore, userId: string, userData: Record<string, unknown> | undefined): Promise<T[]>;
}

export const MIGRATED_FORMAT = 2;

export const itemId = (item: unknown, idField: string): string | null => {
    if (!item || typeof item !== 'object') return null;
    const raw = (item as Record<string, unknown>)[idField];
    if (raw === undefined || raw === null || raw === '') return null;
    return String(raw);
};

/** Firestore doc ids cannot contain '/'; ids are encoded in paths only. */
export const docPathId = (id: string): string => encodeURIComponent(id);

export const isTombstone = (doc: unknown): boolean =>
    !!doc && typeof doc === 'object' && (doc as { deleted?: unknown }).deleted === true;

const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
};

/** Content hash (FNV-1a 32-bit) ignoring `updatedAt`, key order and undefined holes. */
export const hashItemContent = (item: object): string => {
    const { updatedAt: _ignored, ...rest } = item as Record<string, unknown>;
    const canonical = stableStringify(JSON.parse(JSON.stringify(rest)));
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
        hash ^= canonical.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
};

export const sanitizeDoc = (doc: Record<string, unknown>): Record<string, unknown> =>
    JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;

/** Sanitize + project to the spec's keys: the exact bytes written to Firestore. */
export const projectDoc = (doc: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> => {
    const allowed = new Set(keys);
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sanitizeDoc(doc))) {
        if (allowed.has(key)) out[key] = value;
    }
    return out;
};

export const tombstoneIdValue = (id: string): number | string => {
    if (/^-?\d+$/.test(id)) {
        const asNumber = Number(id);
        if (Number.isSafeInteger(asNumber)) return asNumber;
    }
    return id;
};

export const chunked = <T>(items: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
};

const withoutStamp = (item: object): Record<string, unknown> => {
    const { updatedAt: _drop, ...rest } = item as Record<string, unknown>;
    return sanitizeDoc(rest);
};

export interface UploadPlan {
    upserts: Array<{ id: string; doc: Record<string, unknown> }>;
    tombstones: Array<{ id: string; doc: Record<string, unknown> }>;
    /** Tombstones past retention: hard-delete the doc, drop the index entry. */
    expiredTombstones: string[];
    /** Index state AFTER this plan executes (persist only on success). */
    index: UploadIndex;
}

/** Pure upload planner (new/changed/resurrected → upserts, local deletes → tombstones). */
export const planUpload = <T extends object>(
    spec: Pick<CollectionSpec<T>, 'idField' | 'stampOf'>,
    localItems: T[],
    index: UploadIndex,
    now: number,
): UploadPlan => {
    const next: UploadIndex = { ...index };
    const upserts: UploadPlan['upserts'] = [];
    const tombstones: UploadPlan['tombstones'] = [];
    const expiredTombstones: string[] = [];
    const seen = new Set<string>();

    for (const item of localItems) {
        const id = itemId(item, spec.idField);
        if (id === null) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        const entry = index[id];
        const contentHash = hashItemContent(item);
        const computed = spec.stampOf(item);
        const rawStamp = (item as { updatedAt?: unknown }).updatedAt;
        const stamped = typeof rawStamp === 'number' && Number.isFinite(rawStamp) ? rawStamp : null;

        if (!entry) {
            // New items carry the upload time, never just their own date: an
            // item created offline (or back-dated) must still pass other
            // devices' pull cursors.
            const u = Math.max(now, computed);
            upserts.push({ id, doc: { ...withoutStamp(item), updatedAt: u } });
            next[id] = { u, h: contentHash };
            continue;
        }
        if (entry.h === '') {
            // Resurrection over our own tombstone: the new write must beat it.
            const u = Math.max(now, entry.u + 1);
            upserts.push({ id, doc: { ...withoutStamp(item), updatedAt: u } });
            next[id] = { u, h: contentHash };
            continue;
        }
        // Only a NEWER explicit stamp is a change: items adopted from the cloud
        // keep their old updatedAt after a local edit.
        if ((stamped !== null && stamped > entry.u) || contentHash !== entry.h) {
            const u = stamped !== null && stamped > entry.u ? stamped : Math.max(entry.u + 1, now);
            upserts.push({ id, doc: { ...withoutStamp(item), updatedAt: u } });
            next[id] = { u, h: contentHash };
        } else if (entry.r) {
            // Identical: a remote-only entry seen locally becomes locally known.
            next[id] = { u: entry.u, h: entry.h };
        }
    }

    for (const [id, entry] of Object.entries(index)) {
        if (seen.has(id)) continue;
        // Never adopted locally → absence is not a deletion.
        if (entry.r) continue;
        if (entry.h === '') {
            if (entry.u < now - CLOUD_V2_TOMBSTONE_RETENTION_MS) {
                expiredTombstones.push(id);
                delete next[id];
            }
            continue;
        }
        const u = Math.max(now, entry.u + 1);
        tombstones.push({ id, doc: { [spec.idField]: tombstoneIdValue(id), updatedAt: u, deleted: true } });
        next[id] = { u, h: '' };
    }

    return { upserts, tombstones, expiredTombstones, index: next };
};

/**
 * Union by id of local items + remote docs. Highest updatedAt wins; a
 * tombstone beats older edits; ties keep the local side; expired tombstones
 * are ignored. Output: live items only, in the spec's order.
 */
export const mergeItems = <T extends object>(
    spec: Pick<CollectionSpec<T>, 'idField' | 'stampOf' | 'compare'>,
    localItems: T[],
    remoteDocs: object[],
    now: number = Date.now(),
): T[] => {
    const byId = new Map<string, { item: T; u: number }>();
    for (const item of localItems) {
        const id = itemId(item, spec.idField);
        if (id === null) continue;
        if (!byId.has(id)) byId.set(id, { item, u: spec.stampOf(item) });
    }
    for (const doc of remoteDocs) {
        const id = itemId(doc, spec.idField);
        if (id === null) continue;
        const rawStamp = (doc as { updatedAt?: unknown }).updatedAt;
        const remoteStamp = typeof rawStamp === 'number' && Number.isFinite(rawStamp) ? rawStamp : 0;
        const current = byId.get(id);
        if (isTombstone(doc)) {
            if (remoteStamp < now - CLOUD_V2_TOMBSTONE_RETENTION_MS) continue;
            if (!current || remoteStamp > current.u) byId.delete(id);
            continue;
        }
        if (!current || remoteStamp > current.u) byId.set(id, { item: doc as T, u: remoteStamp });
    }
    return [...byId.values()].map((entry) => entry.item).sort(spec.compare);
};

const readDocs = (spec: { idField: string }, docs: Array<{ id: string; data(): any }>): Array<Record<string, unknown>> =>
    docs.map((d) => {
        const data = (d.data() ?? {}) as Record<string, unknown>;
        const id = data[spec.idField];
        return id === undefined || id === null ? { ...data, [spec.idField]: decodeURIComponent(d.id) } : data;
    });

const withStamp = <T extends object>(spec: CollectionSpec<T>, item: T): T =>
    ({ ...item, updatedAt: spec.stampOf(item) }) as T;

export interface MigrateDeps<T extends object> {
    userId: string;
    localItems: T[];
    firestore: CloudV2Firestore;
    indexStore: CloudV2IndexStore;
    now: number;
}

/** One-time legacy migration (local > existing V2 > legacy), then the marker. */
export const ensureMigrated = async <T extends object>(
    spec: CollectionSpec<T>,
    deps: MigrateDeps<T>,
): Promise<{ migrated: boolean; uploaded: number }> => {
    const { userId, localItems, firestore, indexStore, now } = deps;
    if ((await indexStore.getFormatMarker(userId)) === MIGRATED_FORMAT) {
        return { migrated: false, uploaded: 0 };
    }
    const { db, api } = firestore;
    const userSnap = await api.getDoc(api.doc(db, 'users', userId));
    const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown> | undefined) : undefined;
    if (spec.marker.isMigrated(userData)) {
        await indexStore.setFormatMarker(userId, MIGRATED_FORMAT);
        return { migrated: false, uploaded: 0 };
    }
    const legacy = await spec.readLegacy(firestore, userId, userData);
    const existingSnap = await api.getDocs(api.collection(db, 'users', userId, spec.collection));
    const existing = readDocs(spec, existingSnap.docs);
    const union = mergeItems(
        spec,
        existing.filter((d) => !isTombstone(d)) as unknown as T[],
        legacy.map((item) => withStamp(spec, item)),
        now,
    );
    const local = Array.isArray(localItems) ? localItems : [];
    const withLocal = mergeItems(spec, local, union.map((item) => withStamp(spec, item)), now);

    // No zero stamps: updatedAt 0 would be invisible to `updatedAt > N` pulls.
    const stampOf = (item: T): number => spec.stampOf(item) || now;
    for (const batch of chunked(withLocal, CLOUD_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const item of batch) {
            const id = itemId(item, spec.idField)!;
            writer.set(
                api.doc(db, 'users', userId, spec.collection, docPathId(id)),
                projectDoc({ ...withoutStamp(item), updatedAt: stampOf(item) }, spec.keys),
            );
        }
        await writer.commit();
    }
    await api.setDoc(api.doc(db, 'users', userId), spec.marker.patch(), { merge: true });

    // Seed the index so the first incremental upload is a no-op; ids not in
    // the local items are remote-only (`r`) and never tombstoned.
    const localIds = new Set(local.map((item) => itemId(item, spec.idField)).filter((id): id is string => id !== null));
    const index = await indexStore.getIndex(userId);
    for (const item of withLocal) {
        const id = itemId(item, spec.idField)!;
        const entry: UploadIndexEntry = { u: stampOf(item), h: hashItemContent(item) };
        if (!localIds.has(id) && (!index[id] || index[id].r)) entry.r = true;
        index[id] = entry;
    }
    await indexStore.setIndex(userId, index);
    await indexStore.setFormatMarker(userId, MIGRATED_FORMAT);
    return { migrated: true, uploaded: withLocal.length };
};

export interface UploadStats {
    uploaded: number;
    tombstoned: number;
    expired: number;
}

/** Migration (if needed) + incremental upload. */
export const uploadCollection = async <T extends object>(
    spec: CollectionSpec<T>,
    deps: { userId: string; items: T[]; firestore: CloudV2Firestore; indexStore: CloudV2IndexStore; now: number },
): Promise<UploadStats> => {
    const { userId, firestore, indexStore, now } = deps;
    const items = Array.isArray(deps.items) ? deps.items : [];
    const { db, api } = firestore;
    const migration = await ensureMigrated(spec, { userId, localItems: items, firestore, indexStore, now });
    const plan = planUpload(spec, items, await indexStore.getIndex(userId), now);
    for (const batch of chunked([...plan.upserts, ...plan.tombstones], CLOUD_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const item of batch) {
            writer.set(api.doc(db, 'users', userId, spec.collection, docPathId(item.id)), projectDoc(item.doc, spec.keys));
        }
        await writer.commit();
    }
    for (const batch of chunked(plan.expiredTombstones, CLOUD_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const id of batch) writer.delete(api.doc(db, 'users', userId, spec.collection, docPathId(id)));
        await writer.commit();
    }
    await indexStore.setIndex(userId, plan.index);
    return {
        uploaded: plan.upserts.length + migration.uploaded,
        tombstoned: plan.tombstones.length,
        expired: plan.expiredTombstones.length,
    };
};

/** Delta pull over the cached snapshot (full pull without cache, with tombstone GC). */
export const downloadCollection = async <T extends object>(
    spec: CollectionSpec<T>,
    deps: { userId: string; firestore: CloudV2Firestore; indexStore: CloudV2IndexStore; cachedItems: T[] | undefined; now: number },
): Promise<T[]> => {
    const { userId, firestore, indexStore, cachedItems, now } = deps;
    const { db, api } = firestore;
    await ensureMigrated(spec, { userId, localItems: [], firestore, indexStore, now });
    const lastPulled = await indexStore.getLastPulledAt(userId);
    const col = api.collection(db, 'users', userId, spec.collection);
    let remoteDocs: Array<Record<string, unknown>>;
    if (Array.isArray(cachedItems) && lastPulled > 0) {
        const since = Math.max(0, lastPulled - CLOUD_V2_PULL_OVERLAP_MS);
        const snap = await api.getDocs(api.query(col, api.where('updatedAt', '>', since)));
        remoteDocs = readDocs(spec, snap.docs);
    } else {
        const snap = await api.getDocs(col);
        remoteDocs = readDocs(spec, snap.docs);
        // Opportunistic expiry on full pulls (best effort; never fails the download).
        const expired = remoteDocs.filter(
            (d) => isTombstone(d) && (d.updatedAt as number) < now - CLOUD_V2_TOMBSTONE_RETENTION_MS,
        );
        if (expired.length > 0) {
            try {
                for (const batch of chunked(expired, CLOUD_V2_BATCH_LIMIT)) {
                    const writer = api.writeBatch(db);
                    for (const tomb of batch) {
                        writer.delete(api.doc(db, 'users', userId, spec.collection, docPathId(itemId(tomb, spec.idField)!)));
                    }
                    await writer.commit();
                }
            } catch {
                // Tombstone GC is hygiene; the merge below already ignores them.
            }
        }
    }

    const merged = mergeItems(spec, Array.isArray(cachedItems) ? cachedItems : [], remoteDocs, now);

    // Seed the index with fetched live docs (never downgrade a stamp). New ids
    // are remote-only (`r`) until they appear locally.
    if (remoteDocs.length > 0) {
        const index = await indexStore.getIndex(userId);
        let changed = false;
        for (const doc of remoteDocs) {
            if (isTombstone(doc)) continue;
            const id = itemId(doc, spec.idField);
            if (id === null) continue;
            const current = index[id];
            const u = doc.updatedAt as number;
            if (!current || u > current.u) {
                index[id] = { u, h: hashItemContent(doc) };
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

/** The app applied cloud items locally: they are now locally known (deletes tombstone). */
export const adoptItems = async (
    spec: { idField: string },
    userId: string,
    adopted: object[],
    indexStore: Pick<CloudV2IndexStore, 'getIndex' | 'setIndex'>,
): Promise<void> => {
    if (!userId || !Array.isArray(adopted) || adopted.length === 0) return;
    const index = await indexStore.getIndex(userId);
    let changed = false;
    for (const item of adopted) {
        const id = itemId(item, spec.idField);
        if (id === null) continue;
        const entry = index[id];
        if (entry?.r) {
            index[id] = { u: entry.u, h: entry.h };
            changed = true;
        }
    }
    if (changed) await indexStore.setIndex(userId, index);
};

/** Owner wipe of users/{uid}/<collection>/* in batches (account deletion). */
export const deleteAllInCollection = async (
    collection: string,
    userId: string,
    firestore: Pick<CloudV2Firestore, 'db' | 'api'>,
): Promise<number> => {
    const { db, api } = firestore;
    const snap = await api.getDocs(api.collection(db, 'users', userId, collection));
    let deleted = 0;
    for (const batch of chunked(snap.docs, CLOUD_V2_BATCH_LIMIT)) {
        const writer = api.writeBatch(db);
        for (const d of batch) writer.delete(api.doc(db, 'users', userId, collection, d.id));
        await writer.commit();
        deleted += batch.length;
    }
    return deleted;
};
