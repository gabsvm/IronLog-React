// S5/U6: nutrition / body / cardio / custom-food collections in the cloud (V2),
// behind the same VITE_CLOUD_LOGS_V2 flag as the session history (Q21).
//
// Problem: these sections live as arrays inside users/{uid} and are capped on
// upload (60 nutrition days / 60 cardio / 100 weigh-ins / 100 foods), so a new
// device only ever receives the most recent slice. V2 stores one document per
// item with the shared engine (services/cloudCollectionSync.ts).
// U6: nutrition is stored per MEAL (users/{uid}/nutritionEntries/{entryId},
// with its day) plus one small doc per day for water
// (users/{uid}/nutritionDays/{date}), so two devices logging meals on the same
// day no longer overwrite each other (S5 resolved the whole day as one doc).
// Each section is described by an adapter: which collections it uses and how
// to split / re-join its local array.
// Migration source: the capped arrays already in users/{uid}; the local device
// contributes its full history. Marker: users/{uid}.collectionsFormat.<collection> = 2.
import type { BodyLog, CardioSession, CustomFood, FoodEntry, NutritionLog } from '../types';
import { MIGRATED_FORMAT, type CollectionSpec } from './cloudCollectionSync';

export const CLOUD_SECTIONS_V2 = ['nutritionLogs', 'bodyLogs', 'cardioSessions', 'customFoods'] as const;
export type CloudSectionV2 = (typeof CLOUD_SECTIONS_V2)[number];

/** First finite positive number among the candidates (0 when none). */
const firstStamp = (...candidates: unknown[]): number => {
    for (const candidate of candidates) {
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) return candidate;
    }
    return 0;
};

const dayMs = (date: unknown): number => {
    if (typeof date !== 'string') return 0;
    const ms = Date.parse(`${date}T00:00:00`);
    return Number.isFinite(ms) ? ms : 0;
};

const markerFor = (name: string): CollectionSpec<object>['marker'] => ({
    isMigrated: (userData) =>
        ((userData?.collectionsFormat as Record<string, unknown> | undefined)?.[name]) === MIGRATED_FORMAT,
    patch: () => ({ collectionsFormat: { [name]: MIGRATED_FORMAT } }),
});

const legacyFromUserDoc = <T,>(name: CloudSectionV2) =>
    async (_firestore: unknown, _userId: string, userData: Record<string, unknown> | undefined): Promise<T[]> => {
        const raw = userData?.[name];
        return Array.isArray(raw) ? (raw as T[]) : [];
    };

type Stamped<T> = T & { updatedAt?: number };

const desc = (a: number, b: number): number => b - a;
const descText = (a: string, b: string): number => (a < b ? 1 : a > b ? -1 : 0);

/** One meal; `date` is the day it belongs to (NutritionLog.date). */
export type NutritionEntryItem = Stamped<FoodEntry> & { date: string };
/** Per-day values that are not meals (today: water). */
export type NutritionDayItem = { date: string; waterMl: number; updatedAt?: number };

const legacyNutrition = (userData: Record<string, unknown> | undefined): NutritionLog[] => {
    const raw = userData?.nutritionLogs;
    return Array.isArray(raw) ? (raw as NutritionLog[]) : [];
};

/** Local NutritionLog[] → [meal items, day items]. */
export const splitNutrition = (logs: NutritionLog[] | undefined | null): [NutritionEntryItem[], NutritionDayItem[]] => {
    const entries: NutritionEntryItem[] = [];
    const days: NutritionDayItem[] = [];
    for (const day of Array.isArray(logs) ? logs : []) {
        if (!day || typeof day.date !== 'string') continue;
        days.push({ date: day.date, waterMl: Number(day.waterMl) || 0, ...(typeof (day as Stamped<NutritionLog>).updatedAt === 'number' ? { updatedAt: (day as Stamped<NutritionLog>).updatedAt } : {}) });
        for (const entry of Array.isArray(day.entries) ? day.entries : []) {
            if (entry && entry.id) entries.push({ ...entry, date: day.date });
        }
    }
    return [entries, days];
};

/** [meal items, day items] → NutritionLog[] (days oldest first, meals by time). */
export const joinNutrition = (entries: NutritionEntryItem[], days: NutritionDayItem[]): NutritionLog[] => {
    const byDate = new Map<string, NutritionLog & { updatedAt?: number }>();
    const ensure = (date: string) => {
        let day = byDate.get(date);
        if (!day) {
            day = { date, entries: [], waterMl: 0 };
            byDate.set(date, day);
        }
        return day;
    };
    for (const d of days) {
        const day = ensure(d.date);
        day.waterMl = Number(d.waterMl) || 0;
        if (typeof d.updatedAt === 'number') day.updatedAt = d.updatedAt;
    }
    for (const e of entries) {
        const { date, ...entry } = e;
        ensure(date).entries.push(entry as FoodEntry);
    }
    for (const day of byDate.values()) {
        day.entries.sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0) || (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0));
    }
    return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
};

export const NUTRITION_ENTRY_SPEC: CollectionSpec<NutritionEntryItem> = {
    collection: 'nutritionEntries',
    idField: 'id',
    keys: ['id', 'date', 'name', 'calories', 'protein', 'carbs', 'fat', 'mealType', 'timestamp', 'updatedAt', 'deleted'],
    stampOf: (e) => firstStamp(e.updatedAt, e.timestamp, dayMs(e.date)),
    compare: (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0),
    marker: markerFor('nutritionEntries'),
    readLegacy: async (_firestore, _userId, userData) => splitNutrition(legacyNutrition(userData))[0],
};

export const NUTRITION_DAY_SPEC: CollectionSpec<NutritionDayItem> = {
    collection: 'nutritionDays',
    idField: 'date',
    keys: ['date', 'waterMl', 'updatedAt', 'deleted'],
    stampOf: (d) => firstStamp(d.updatedAt, dayMs(d.date)),
    compare: (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
    marker: markerFor('nutritionDays'),
    readLegacy: async (_firestore, _userId, userData) => splitNutrition(legacyNutrition(userData))[1],
};

export const BODY_SPEC: CollectionSpec<Stamped<BodyLog>> = {
    collection: 'bodyLogs',
    idField: 'id',
    keys: ['id', 'date', 'weight', 'bodyFat', 'notes', 'updatedAt', 'deleted'],
    stampOf: (log) => firstStamp(log.updatedAt, log.date, log.id),
    // The app prepends weigh-ins: newest first.
    compare: (a, b) => desc(a.date ?? 0, b.date ?? 0) || desc(Number(a.id) || 0, Number(b.id) || 0),
    marker: markerFor('bodyLogs'),
    readLegacy: legacyFromUserDoc<Stamped<BodyLog>>('bodyLogs'),
};

export const CARDIO_SPEC: CollectionSpec<Stamped<CardioSession>> = {
    collection: 'cardioSessions',
    idField: 'id',
    keys: [
        'id', 'date', 'activityType', 'durationMin', 'distanceKm', 'caloriesBurned',
        'avgHeartRate', 'notes', 'timestamp', 'updatedAt', 'deleted',
    ],
    stampOf: (session) => firstStamp(session.updatedAt, session.timestamp, dayMs(session.date)),
    // The app prepends sessions: newest first.
    compare: (a, b) => desc(a.timestamp ?? 0, b.timestamp ?? 0) || descText(String(a.id), String(b.id)),
    marker: markerFor('cardioSessions'),
    readLegacy: legacyFromUserDoc<Stamped<CardioSession>>('cardioSessions'),
};

export const FOODS_SPEC: CollectionSpec<Stamped<CustomFood>> = {
    collection: 'customFoods',
    idField: 'id',
    keys: [
        'id', 'name', 'calories', 'protein', 'carbs', 'fat', 'servingSize',
        'isFavorite', 'createdAt', 'updatedAt', 'deleted',
    ],
    stampOf: (food) => firstStamp(food.updatedAt, food.createdAt),
    // The app prepends foods: newest first.
    compare: (a, b) => desc(a.createdAt ?? 0, b.createdAt ?? 0) || descText(String(a.id), String(b.id)),
    marker: markerFor('customFoods'),
    readLegacy: legacyFromUserDoc<Stamped<CustomFood>>('customFoods'),
};

/** How a local section array maps onto one or more V2 collections. */
export interface SectionAdapter {
    parts: CollectionSpec<any>[];
    split(items: unknown[] | undefined | null): object[][];
    join(parts: object[][]): unknown[];
}

const single = (spec: CollectionSpec<any>): SectionAdapter => ({
    parts: [spec],
    split: (items) => [Array.isArray(items) ? (items as object[]) : []],
    join: ([items]) => items,
});

export const SECTION_ADAPTERS: Record<CloudSectionV2, SectionAdapter> = {
    nutritionLogs: {
        parts: [NUTRITION_ENTRY_SPEC, NUTRITION_DAY_SPEC],
        split: (items) => splitNutrition(items as NutritionLog[]),
        join: ([entries, days]) => joinNutrition(entries as NutritionEntryItem[], days as NutritionDayItem[]),
    },
    bodyLogs: single(BODY_SPEC),
    cardioSessions: single(CARDIO_SPEC),
    customFoods: single(FOODS_SPEC),
};

/** Every V2 collection used by the section adapters (rules + account deletion). */
export const SECTION_COLLECTIONS = Object.values(SECTION_ADAPTERS).flatMap((a) => a.parts.map((p) => p.collection));
