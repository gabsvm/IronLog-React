import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    capBodyLogs,
    capCardioSessions,
    capCustomFoods,
    capNutritionLogs,
    keepNewest,
} from '../../services/syncCaps';
import {
    BODY_SPEC,
    CARDIO_SPEC,
    CLOUD_SECTIONS_V2,
    FOODS_SPEC,
    NUTRITION_SPEC,
    SECTION_SPECS,
} from '../../services/cloudSectionsV2';
import {
    docPathId,
    downloadCollection,
    mergeItems,
    planUpload,
    uploadCollection,
    type CloudV2Firestore,
    type CloudV2IndexStore,
    type UploadIndex,
} from '../../services/cloudCollectionSync';
import { V2_COLLECTIONS } from '../../services/cloudV2Collections';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// ── S5a: legacy caps keep the NEWEST items ────────────────────────────────

describe('S5: legacy caps keep the newest items by date (flag OFF path)', () => {
    it('newest-first bodyLogs: keeps the newest 100, not the oldest (old slice(-100) bug)', () => {
        const newestFirst = Array.from({ length: 150 }, (_, i) => ({ id: NOW - i * DAY, date: NOW - i * DAY, weight: 80 }));
        const capped = capBodyLogs(newestFirst);
        expect(capped).toHaveLength(100);
        expect(capped[0].date).toBe(NOW);
        expect(capped[99].date).toBe(NOW - 99 * DAY);
        // The old behavior would have dropped today's weigh-in.
        expect(newestFirst.slice(-100).some((l) => l.date === NOW)).toBe(false);
    });

    it('newest-first cardio and foods keep their newest items in original order', () => {
        const cardio = Array.from({ length: 70 }, (_, i) => ({ id: `c${i}`, timestamp: NOW - i * DAY, date: isoDay(NOW - i * DAY) }));
        expect(capCardioSessions(cardio).map((c) => c.id)).toEqual(cardio.slice(0, 60).map((c) => c.id));
        const foods = Array.from({ length: 120 }, (_, i) => ({ id: `f${i}`, createdAt: NOW - i * 1000 }));
        expect(capCustomFoods(foods).map((f) => f.id)).toEqual(foods.slice(0, 100).map((f) => f.id));
    });

    it('golden: appended nutritionLogs give exactly what slice(-60) gave', () => {
        const days = Array.from({ length: 90 }, (_, i) => ({ date: isoDay(NOW - (89 - i) * DAY), entries: [] }));
        expect(capNutritionLogs(days)).toEqual(days.slice(-60));
    });

    it('golden: arrays under the cap are returned untouched (same reference)', () => {
        const small = [{ id: 1, date: 5, weight: 70 }];
        expect(capBodyLogs(small)).toBe(small);
        expect(keepNewest(undefined, 3, () => 0)).toEqual([]);
    });
});

// ── Generic in-memory Firestore (any users/{uid}/... path) ─────────────────

const createFake = () => {
    const docs = new Map<string, Record<string, unknown>>();
    const key = (path: string[]) => path.join('/');
    const deepMerge = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
        const out = { ...a };
        for (const [k, v] of Object.entries(b)) {
            out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object'
                ? deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>)
                : v;
        }
        return out;
    };
    const list = (path: string[], filter?: { value: number }) =>
        [...docs.entries()]
            .filter(([k]) => k.startsWith(`${key(path)}/`) && k.split('/').length === path.length + 1)
            .filter(([, d]) => !filter || (d.updatedAt as number) > filter.value)
            .map(([k, d]) => ({ id: k.split('/').pop()!, data: () => ({ ...d }) }));
    const api = {
        doc: (_db: unknown, ...path: string[]) => ({ path }),
        collection: (_db: unknown, ...path: string[]) => ({ path }),
        query: (target: { path: string[] }, c: { value: number }) => ({ path: target.path, c }),
        where: (_f: string, _op: string, value: unknown) => ({ value }),
        getDoc: async (ref: { path: string[] }) => {
            const d = docs.get(key(ref.path));
            return { exists: () => !!d, data: () => (d ? { ...d } : undefined) };
        },
        getDocs: async (t: { path: string[]; c?: { value: number } }) => ({ docs: list(t.path, t.c) }),
        setDoc: async (ref: { path: string[] }, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
            const k = key(ref.path);
            docs.set(k, opts?.merge ? deepMerge(docs.get(k) ?? {}, data) : { ...data });
        },
        deleteDoc: async (ref: { path: string[] }) => void docs.delete(key(ref.path)),
        writeBatch: () => {
            const ops: Array<() => void> = [];
            return {
                set: (ref: { path: string[] }, data: Record<string, unknown>) => ops.push(() => docs.set(key(ref.path), { ...data })),
                delete: (ref: { path: string[] }) => ops.push(() => docs.delete(key(ref.path))),
                commit: async () => ops.forEach((op) => op()),
            };
        },
    };
    return { firestore: { db: {}, api } as unknown as CloudV2Firestore, docs };
};

const memoryStore = (): CloudV2IndexStore => {
    let index: UploadIndex = {};
    let pulled = 0;
    let marker = 0;
    return {
        getIndex: async () => ({ ...index }),
        setIndex: async (_u, v) => void (index = { ...v }),
        getLastPulledAt: async () => pulled,
        setLastPulledAt: async (_u, v) => void (pulled = v),
        getFormatMarker: async () => marker,
        setFormatMarker: async (_u, v) => void (marker = v),
    };
};

// ── S5b: specs on the shared engine ────────────────────────────────────────

describe('S5: section specs', () => {
    it('nutrition days are keyed by date; tombstones carry the date', () => {
        const day = { date: '2026-10-01', entries: [{ id: 'm1', timestamp: NOW - 5000 }], waterMl: 500 } as any;
        const first = planUpload(NUTRITION_SPEC, [day], {}, NOW);
        expect(first.upserts.map((u) => u.id)).toEqual(['2026-10-01']);
        const removed = planUpload(NUTRITION_SPEC, [], first.index, NOW + 1);
        expect(removed.tombstones[0].doc).toEqual({ date: '2026-10-01', updatedAt: NOW + 1, deleted: true });
    });

    it('merge keeps each section in the app order', () => {
        const nut = mergeItems(NUTRITION_SPEC, [{ date: '2026-10-02', entries: [] } as any], [{ date: '2026-10-01', entries: [], updatedAt: 1 }], NOW);
        expect(nut.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-02']);
        const body = mergeItems(BODY_SPEC, [{ id: 1, date: 1000, weight: 80 } as any], [{ id: 2, date: 2000, weight: 79, updatedAt: 5 }], NOW);
        expect(body.map((b) => b.id)).toEqual([2, 1]);
        const cardio = mergeItems(CARDIO_SPEC, [], [{ id: 'a', timestamp: 1, updatedAt: 1 }, { id: 'b', timestamp: 2, updatedAt: 1 }], NOW);
        expect(cardio.map((c) => c.id)).toEqual(['b', 'a']);
        const foods = mergeItems(FOODS_SPEC, [], [{ id: 'x', createdAt: 1, updatedAt: 1 }, { id: 'y', createdAt: 9, updatedAt: 1 }], NOW);
        expect(foods.map((f) => f.id)).toEqual(['y', 'x']);
    });

    it('ids with a slash are path-encoded but round-trip intact', async () => {
        const fake = createFake();
        const store = memoryStore();
        fake.docs.set('users/u1', {});
        await uploadCollection(FOODS_SPEC, { userId: 'u1', items: [{ id: 'a/b', name: 'x', createdAt: 1 } as any], firestore: fake.firestore, indexStore: store, now: NOW });
        expect(fake.docs.has(`users/u1/customFoods/${docPathId('a/b')}`)).toBe(true);
        const pulled = await downloadCollection(FOODS_SPEC, { userId: 'u1', firestore: fake.firestore, indexStore: memoryStore(), cachedItems: undefined, now: NOW + 1 });
        expect(pulled.map((f) => f.id)).toEqual(['a/b']);
    });
});

describe('S5: migration from the capped arrays + full local history', () => {
    it('a new device receives the FULL nutrition history (not just 60 days)', async () => {
        const fake = createFake();
        const days = Array.from({ length: 200 }, (_, i) => ({
            date: isoDay(NOW - (199 - i) * DAY),
            entries: [{ id: `m${i}`, name: 'x', calories: 500, protein: 30, carbs: 50, fat: 10, mealType: 'lunch' as const, timestamp: NOW - (199 - i) * DAY }],
            waterMl: 0,
        }));
        // Legacy cloud only has the capped slice.
        fake.docs.set('users/u1', { nutritionLogs: capNutritionLogs(days) });

        const deviceA = memoryStore();
        const statsA = await uploadCollection(NUTRITION_SPEC, { userId: 'u1', items: days, firestore: fake.firestore, indexStore: deviceA, now: NOW });
        expect(statsA.uploaded).toBe(200);
        expect(fake.docs.get('users/u1')).toMatchObject({ collectionsFormat: { nutritionLogs: 2 } });
        // The legacy array is never removed.
        expect((fake.docs.get('users/u1')!.nutritionLogs as unknown[]).length).toBe(60);

        const onB = await downloadCollection(NUTRITION_SPEC, { userId: 'u1', firestore: fake.firestore, indexStore: memoryStore(), cachedItems: undefined, now: NOW + 1000 });
        expect(onB).toHaveLength(200);
        expect(onB[0].date).toBe(days[0].date);

        // Incremental: re-upload of the same days writes nothing.
        expect(await uploadCollection(NUTRITION_SPEC, { userId: 'u1', items: days, firestore: fake.firestore, indexStore: deviceA, now: NOW + 2000 }))
            .toEqual({ uploaded: 0, tombstoned: 0, expired: 0 });
    });

    it('migration markers are per collection (nutrition migrated, body not yet)', async () => {
        const fake = createFake();
        fake.docs.set('users/u1', { collectionsFormat: { nutritionLogs: 2 }, bodyLogs: [{ id: 1, date: 1, weight: 80 }] });
        const stats = await uploadCollection(BODY_SPEC, { userId: 'u1', items: [], firestore: fake.firestore, indexStore: memoryStore(), now: NOW });
        expect(stats.uploaded).toBe(1);
        expect(fake.docs.get('users/u1')).toMatchObject({ collectionsFormat: { nutritionLogs: 2, bodyLogs: 2 } });
    });
});

describe('S5: client lists match firestore.rules', () => {
    const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
    const ruleKeys = (fn: string) => {
        const body = rules.match(new RegExp(`function ${fn}\\(\\) \\{\\s*return \\[([\\s\\S]*?)\\];`));
        expect(body, fn).not.toBeNull();
        return [...body![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    };

    it('each spec key list equals its rules allowlist', () => {
        expect(ruleKeys('nutritionDocAllowedKeys')).toEqual([...NUTRITION_SPEC.keys].sort());
        expect(ruleKeys('bodyDocAllowedKeys')).toEqual([...BODY_SPEC.keys].sort());
        expect(ruleKeys('cardioDocAllowedKeys')).toEqual([...CARDIO_SPEC.keys].sort());
        expect(ruleKeys('foodDocAllowedKeys')).toEqual([...FOODS_SPEC.keys].sort());
    });

    it('every V2 collection has a rules match and is wiped on account deletion', () => {
        expect([...V2_COLLECTIONS]).toEqual(['logs', ...CLOUD_SECTIONS_V2]);
        for (const section of CLOUD_SECTIONS_V2) {
            expect(SECTION_SPECS[section].collection).toBe(section);
            expect(rules).toContain(`match /${section}/{itemId}`);
        }
    });
});
