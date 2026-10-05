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
    NUTRITION_DAY_SPEC,
    NUTRITION_ENTRY_SPEC,
    SECTION_ADAPTERS,
    SECTION_COLLECTIONS,
    joinNutrition,
    splitNutrition,
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
    it('U6: nutrition is one doc per meal (id) plus one per day (date)', () => {
        const day = { date: '2026-10-01', entries: [{ id: 'm1', name: 'Avena', calories: 300, timestamp: NOW - 5000 }], waterMl: 500 } as any;
        const [entries, days] = splitNutrition([day]);
        expect(entries).toEqual([{ id: 'm1', name: 'Avena', calories: 300, timestamp: NOW - 5000, date: '2026-10-01' }]);
        expect(days).toEqual([{ date: '2026-10-01', waterMl: 500 }]);
        const first = planUpload(NUTRITION_ENTRY_SPEC, entries, {}, NOW);
        expect(first.upserts.map((u) => u.id)).toEqual(['m1']);
        const removed = planUpload(NUTRITION_ENTRY_SPEC, [], first.index, NOW + 1);
        expect(removed.tombstones[0].doc).toEqual({ id: 'm1', updatedAt: NOW + 1, deleted: true });
        expect(planUpload(NUTRITION_DAY_SPEC, days, {}, NOW).upserts.map((u) => u.id)).toEqual(['2026-10-01']);
    });

    it('U6: split/join round-trips (days oldest first, meals by time, water kept)', () => {
        const logs = [
            { date: '2026-10-02', waterMl: 0, entries: [{ id: 'b', timestamp: 20 }, { id: 'a', timestamp: 10 }] },
            { date: '2026-10-01', waterMl: 750, entries: [] },
        ] as any;
        const joined = joinNutrition(...splitNutrition(logs));
        expect(joined.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-02']);
        expect(joined[0].waterMl).toBe(750);
        expect(joined[1].entries.map((e) => e.id)).toEqual(['a', 'b']);
        expect(joined[1].entries[0]).not.toHaveProperty('date');
    });

    it('U6: two devices adding meals to the SAME day both survive', async () => {
        const fake = createFake();
        fake.docs.set('users/u1', { collectionsFormat: { nutritionEntries: 2, nutritionDays: 2 } });
        const a = memoryStore();
        const b = memoryStore();
        await a.setFormatMarker('u1', 2);
        await b.setFormatMarker('u1', 2);
        const dayA = [{ date: '2026-10-01', waterMl: 0, entries: [{ id: 'fromA', name: 'A', timestamp: NOW }] }] as any;
        const dayB = [{ date: '2026-10-01', waterMl: 0, entries: [{ id: 'fromB', name: 'B', timestamp: NOW + 1 }] }] as any;
        await uploadCollection(NUTRITION_ENTRY_SPEC, { userId: 'u1', items: splitNutrition(dayA)[0], firestore: fake.firestore, indexStore: a, now: NOW });
        await uploadCollection(NUTRITION_ENTRY_SPEC, { userId: 'u1', items: splitNutrition(dayB)[0], firestore: fake.firestore, indexStore: b, now: NOW + 10 });
        const pulled = await downloadCollection(NUTRITION_ENTRY_SPEC, { userId: 'u1', firestore: fake.firestore, indexStore: memoryStore(), cachedItems: undefined, now: NOW + 20 });
        const [day] = joinNutrition(pulled, []);
        expect(day.entries.map((e) => e.id)).toEqual(['fromA', 'fromB']);
    });

    it('merge keeps each section in the app order', () => {
        const nut = mergeItems(NUTRITION_DAY_SPEC, [{ date: '2026-10-02', waterMl: 0 } as any], [{ date: '2026-10-01', waterMl: 0, updatedAt: 1 }], NOW);
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

        const adapter = SECTION_ADAPTERS.nutritionLogs;
        const storesA = adapter.parts.map(() => memoryStore());
        const parts = adapter.split(days);
        const statsA = await Promise.all(adapter.parts.map((spec, i) =>
            uploadCollection(spec, { userId: 'u1', items: parts[i], firestore: fake.firestore, indexStore: storesA[i], now: NOW })));
        expect(statsA.map((x) => x.uploaded)).toEqual([200, 200]);
        expect(fake.docs.get('users/u1')).toMatchObject({ collectionsFormat: { nutritionEntries: 2, nutritionDays: 2 } });
        // The legacy array is never removed.
        expect((fake.docs.get('users/u1')!.nutritionLogs as unknown[]).length).toBe(60);

        const pulled = await Promise.all(adapter.parts.map((spec) =>
            downloadCollection(spec, { userId: 'u1', firestore: fake.firestore, indexStore: memoryStore(), cachedItems: undefined, now: NOW + 1000 })));
        const onB = adapter.join(pulled) as typeof days;
        expect(onB).toHaveLength(200);
        expect(onB[0].date).toBe(days[0].date);

        // Incremental: re-upload of the same days writes nothing.
        const again = await Promise.all(adapter.parts.map((spec, i) =>
            uploadCollection(spec, { userId: 'u1', items: parts[i], firestore: fake.firestore, indexStore: storesA[i], now: NOW + 2000 })));
        expect(again).toEqual([{ uploaded: 0, tombstoned: 0, expired: 0 }, { uploaded: 0, tombstoned: 0, expired: 0 }]);
    });

    it('migration markers are per collection (nutrition migrated, body not yet)', async () => {
        const fake = createFake();
        fake.docs.set('users/u1', { collectionsFormat: { nutritionEntries: 2 }, bodyLogs: [{ id: 1, date: 1, weight: 80 }] });
        const stats = await uploadCollection(BODY_SPEC, { userId: 'u1', items: [], firestore: fake.firestore, indexStore: memoryStore(), now: NOW });
        expect(stats.uploaded).toBe(1);
        expect(fake.docs.get('users/u1')).toMatchObject({ collectionsFormat: { nutritionEntries: 2, bodyLogs: 2 } });
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
        expect(ruleKeys('nutritionEntryAllowedKeys')).toEqual([...NUTRITION_ENTRY_SPEC.keys].sort());
        expect(ruleKeys('nutritionDayAllowedKeys')).toEqual([...NUTRITION_DAY_SPEC.keys].sort());
        expect(ruleKeys('bodyDocAllowedKeys')).toEqual([...BODY_SPEC.keys].sort());
        expect(ruleKeys('cardioDocAllowedKeys')).toEqual([...CARDIO_SPEC.keys].sort());
        expect(ruleKeys('foodDocAllowedKeys')).toEqual([...FOODS_SPEC.keys].sort());
    });

    it('every V2 collection has a rules match and is wiped on account deletion', () => {
        expect([...V2_COLLECTIONS]).toEqual(['logs', ...SECTION_COLLECTIONS]);
        for (const collection of SECTION_COLLECTIONS) {
            expect(rules).toContain(`match /${collection}/{itemId}`);
        }
        expect(Object.keys(SECTION_ADAPTERS)).toEqual([...CLOUD_SECTIONS_V2]);
    });
});
