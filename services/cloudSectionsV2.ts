// S5: nutrition / body / cardio / custom-food collections in the cloud (V2),
// behind the same VITE_CLOUD_LOGS_V2 flag as the session history (Q21).
//
// Problem: these sections live as arrays inside users/{uid} and are capped on
// upload (60 nutrition days / 60 cardio / 100 weigh-ins / 100 foods), so a new
// device only ever receives the most recent slice. V2 stores one document per
// item in users/{uid}/<section>/{id} with the shared engine
// (services/cloudCollectionSync.ts). Granularity: one doc per nutrition DAY,
// so two devices editing the same day concurrently resolve last-writer-wins
// for that day (the legacy path resolved the WHOLE array that way).
// Migration source: the capped arrays already in users/{uid}; the local device
// contributes its full history. Marker: users/{uid}.collectionsFormat.<name> = 2.
import type { BodyLog, CardioSession, CustomFood, NutritionLog } from '../types';
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

const markerFor = (name: CloudSectionV2): CollectionSpec<object>['marker'] => ({
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

export const NUTRITION_SPEC: CollectionSpec<Stamped<NutritionLog>> = {
    collection: 'nutritionLogs',
    idField: 'date',
    keys: ['date', 'entries', 'waterMl', 'updatedAt', 'deleted'],
    stampOf: (day) =>
        firstStamp(
            day.updatedAt,
            Math.max(0, ...(Array.isArray(day.entries) ? day.entries.map((e) => Number(e?.timestamp) || 0) : [])),
            dayMs(day.date),
        ),
    // The app appends days: oldest first.
    compare: (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
    marker: markerFor('nutritionLogs'),
    readLegacy: legacyFromUserDoc<Stamped<NutritionLog>>('nutritionLogs'),
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

export const SECTION_SPECS: Record<CloudSectionV2, CollectionSpec<any>> = {
    nutritionLogs: NUTRITION_SPEC,
    bodyLogs: BODY_SPEC,
    cardioSessions: CARDIO_SPEC,
    customFoods: FOODS_SPEC,
};
