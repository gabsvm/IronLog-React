// S5: size caps for the array sections stored inside users/{uid}.
//
// The legacy upload capped with `.slice(-N)`, which keeps the LAST N array
// elements. nutritionLogs is appended (oldest first), so that kept the newest
// days; but bodyLogs, cardioSessions and customFoods are PREPENDED by the app
// (newest first), so `.slice(-N)` kept the OLDEST N and silently stopped
// syncing new weigh-ins / cardio / foods once a user passed the cap.
// keepNewest() keeps the N most recent items BY DATE, in their original order.
// The caps stay well under the rules' 2x limits (120 / 200).

const dayMs = (date: unknown): number => {
    if (typeof date !== 'string') return 0;
    const ms = Date.parse(`${date}T00:00:00`);
    return Number.isFinite(ms) ? ms : 0;
};

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

/** Keeps the `limit` items with the highest stamp, preserving input order. */
export const keepNewest = <T>(items: T[] | undefined | null, limit: number, stampOf: (item: T) => number): T[] => {
    const list = Array.isArray(items) ? items : [];
    if (list.length <= limit) return list;
    const ranked = list
        .map((item, index) => ({ index, stamp: stampOf(item) }))
        // Newest first; on equal stamps the later array position wins (matches
        // the old slice(-N) behavior for appended arrays).
        .sort((a, b) => b.stamp - a.stamp || b.index - a.index)
        .slice(0, limit);
    const keep = new Set(ranked.map((entry) => entry.index));
    return list.filter((_, index) => keep.has(index));
};

export const SECTION_CAPS = {
    nutritionLogs: 60,
    cardioSessions: 60,
    bodyLogs: 100,
    customFoods: 100,
} as const;

export const capNutritionLogs = <T extends { date?: unknown }>(items: T[] | undefined | null) =>
    keepNewest(items, SECTION_CAPS.nutritionLogs, (day) => dayMs(day?.date));

export const capCardioSessions = <T extends { timestamp?: unknown; date?: unknown }>(items: T[] | undefined | null) =>
    keepNewest(items, SECTION_CAPS.cardioSessions, (s) => num(s?.timestamp) || dayMs(s?.date));

export const capBodyLogs = <T extends { date?: unknown; id?: unknown }>(items: T[] | undefined | null) =>
    keepNewest(items, SECTION_CAPS.bodyLogs, (log) => num(log?.date) || num(log?.id));

export const capCustomFoods = <T extends { createdAt?: unknown }>(items: T[] | undefined | null) =>
    keepNewest(items, SECTION_CAPS.customFoods, (food) => num(food?.createdAt));
