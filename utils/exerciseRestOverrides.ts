/** Per-exercise rest defaults (Strong "Rest Timer Settings"): exercise id → seconds. Null/absent = follow global defaults. Stored in localStorage for synchronous reads during session build. */
const KEY = 'il_rest_overrides_v1';

type RestOverrides = Record<string, number>;

let cache: RestOverrides | null = null;

const readRaw = (): RestOverrides => {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return {};
        const out: RestOverrides = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            const n = Number(v);
            if (typeof k === 'string' && Number.isFinite(n) && n > 0) out[k] = Math.min(1800, Math.round(n));
        }
        return out;
    } catch {
        return {};
    }
};

export const getExerciseRestOverrides = (): RestOverrides => {
    if (!cache) cache = readRaw();
    return cache;
};

export const getExerciseRestOverride = (exerciseId: string | null | undefined): number | undefined => {
    if (!exerciseId) return undefined;
    const v = getExerciseRestOverrides()[exerciseId];
    return typeof v === 'number' && v > 0 ? v : undefined;
};

export const setExerciseRestOverride = (exerciseId: string | null | undefined, seconds: number | undefined): void => {
    if (!exerciseId) return;
    const next = { ...getExerciseRestOverrides() };
    if (seconds === undefined || !(seconds > 0)) {
        delete next[exerciseId];
    } else {
        next[exerciseId] = Math.min(1800, Math.round(seconds));
    }
    cache = next;
    try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        // Non-fatal: the session-scoped value still applies.
    }
    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ironlog:rest-overrides-changed'));
        }
    } catch {
        // Never break callers on event dispatch.
    }
};
