// U11: client side of the Claude training analysis. Builds a compact,
// anonymous summary of the last weeks (no names, notes, emails or ids) and
// posts it with the user's Firebase ID token to the server function, which
// holds the Anthropic key. Opt-in: nothing is sent until the user accepts.
import type { BodyLog, Log } from '../types';
import { estimate1RM } from '../utils';
import { formatLocalDateKey } from '../utils/localDate';
import type { AnalysisInput, AnalysisResult } from '../server/aiAnalysis';

export type { AnalysisInput, AnalysisResult };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const ANALYSIS_WEEKS = 8;
const CONSENT_KEY = 'il_ai_analysis_consent_v1';
const LAST_KEY = 'il_ai_analysis_last_v1';

const mondayOf = (t: number): Date => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
};

const isWorkingSet = (s: { completed?: boolean; skipped?: boolean; type?: string }) =>
    s.completed === true && !s.skipped && s.type !== 'warmup';

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Pure: weekly sets per muscle, sessions, average RIR (from RPE when logged),
 * e1RM trend of the 6 most-trained lifts and body weight, for the last
 * ANALYSIS_WEEKS weeks. Returns null when there is nothing to analyse.
 */
export const buildAnalysisInput = (opts: {
    logs: Log[];
    bodyLogs: BodyLog[];
    lang: 'es' | 'en';
    unit: 'kg' | 'lb';
    exerciseName: (ex: Log['exercises'][number]) => string;
    /** Stored loads are kg; converts to the user's display unit. */
    convert?: (kg: number) => number;
    now?: number;
}): AnalysisInput | null => {
    const now = opts.now ?? Date.now();
    const convert = opts.convert ?? ((kg: number) => kg);
    const firstWeek = mondayOf(now - (ANALYSIS_WEEKS - 1) * WEEK_MS).getTime();
    const recent = opts.logs.filter((l) => !l.skipped && Number(l.startTime) >= firstWeek && Number(l.startTime) <= now);
    if (recent.length === 0) return null;

    const weeks = new Map<string, { sessions: number; sets: Record<string, number>; rirSum: number; rirN: number }>();
    for (let i = 0; i < ANALYSIS_WEEKS; i += 1) {
        weeks.set(formatLocalDateKey(new Date(firstWeek + i * WEEK_MS + 12 * 3600 * 1000)), { sessions: 0, sets: {}, rirSum: 0, rirN: 0 });
    }
    const lifts = new Map<string, { sets: number; best: Map<string, number> }>();

    for (const log of recent) {
        const key = formatLocalDateKey(mondayOf(log.startTime));
        const week = weeks.get(key);
        if (!week) continue;
        let any = false;
        for (const ex of log.exercises || []) {
            const done = (ex.sets || []).filter(isWorkingSet);
            if (done.length === 0) continue;
            any = true;
            const muscle = String(ex.targetMuscle || ex.muscle || 'OTHER').slice(0, 60);
            week.sets[muscle] = (week.sets[muscle] || 0) + done.length;
            const name = opts.exerciseName(ex).slice(0, 60);
            const lift = lifts.get(name) || { sets: 0, best: new Map<string, number>() };
            lift.sets += done.length;
            for (const s of done) {
                const rpe = Number(s.rpe);
                if (Number.isFinite(rpe) && rpe >= 5 && rpe <= 10) {
                    week.rirSum += 10 - rpe;
                    week.rirN += 1;
                }
                const w = Number(s.weight);
                const r = Number(s.reps);
                if (!ex.isBodyweight && !ex.isIsometric && w > 0 && r > 0 && r <= 20) {
                    const e = estimate1RM(w, r);
                    lift.best.set(key, Math.max(lift.best.get(key) || 0, e));
                }
            }
            lifts.set(name, lift);
        }
        if (any) week.sessions += 1;
    }

    const topLifts = [...lifts.entries()]
        .filter(([, l]) => l.best.size > 0)
        .sort((a, b) => b[1].sets - a[1].sets)
        .slice(0, 6)
        .map(([name, l]) => ({
            name,
            points: [...l.best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, e1rm]) => ({ date, e1rm: round1(convert(e1rm)) })),
        }));

    const bodyweight = opts.bodyLogs
        .filter((b) => b.date >= firstWeek && b.date <= now && b.weight >= 20 && b.weight <= 900)
        .sort((a, b) => a.date - b.date)
        .slice(-16)
        .map((b) => ({ date: formatLocalDateKey(new Date(b.date)), value: round1(convert(b.weight)) }));

    return {
        lang: opts.lang,
        unit: opts.unit,
        weeks: [...weeks.entries()].map(([weekStart, w]) => ({
            weekStart,
            sessions: w.sessions,
            setsByMuscle: w.sets,
            avgRir: w.rirN > 0 ? round1(w.rirSum / w.rirN) : null,
        })),
        lifts: topLifts,
        bodyweight,
    };
};

// ─── Request ────────────────────────────────────────────────────────────────
export type AnalysisErrorCode =
    | 'unauthenticated' | 'rate_limited' | 'not_configured' | 'refused' | 'network' | 'failed';

export class AnalysisError extends Error {
    constructor(readonly code: AnalysisErrorCode) {
        super(code);
        this.name = 'AnalysisError';
    }
}

/** Endpoint: same-origin on the web; the Android app needs VITE_AI_ANALYSIS_URL. */
export const getAnalysisEndpoint = (isNative: boolean): string | null => {
    const configured = String(import.meta.env.VITE_AI_ANALYSIS_URL || '').trim();
    if (configured) return configured;
    return isNative ? null : '/api/ai-analysis';
};

export const requestAnalysis = async (
    input: AnalysisInput,
    deps: { endpoint: string; getIdToken: () => Promise<string | null>; fetchImpl?: typeof fetch },
): Promise<AnalysisResult> => {
    const token = await deps.getIdToken();
    if (!token) throw new AnalysisError('unauthenticated');
    let res: Response;
    try {
        res = await (deps.fetchImpl ?? fetch)(deps.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(input),
        });
    } catch {
        throw new AnalysisError('network');
    }
    if (res.ok) {
        const body = (await res.json()) as { analysis?: AnalysisResult };
        if (body.analysis && typeof body.analysis.summary === 'string') return body.analysis;
        throw new AnalysisError('failed');
    }
    if (res.status === 401) throw new AnalysisError('unauthenticated');
    if (res.status === 429) throw new AnalysisError('rate_limited');
    if (res.status === 503) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new AnalysisError(body.error === 'not_configured' ? 'not_configured' : 'rate_limited');
    }
    if (res.status === 502) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (body.error === 'refused') throw new AnalysisError('refused');
    }
    throw new AnalysisError('failed');
};

// ─── Local state (device-only) ──────────────────────────────────────────────
export const hasAnalysisConsent = (): boolean => {
    try {
        return localStorage.getItem(CONSENT_KEY) === '1';
    } catch {
        return false;
    }
};

export const setAnalysisConsent = (value: boolean): void => {
    try {
        if (value) localStorage.setItem(CONSENT_KEY, '1');
        else localStorage.removeItem(CONSENT_KEY);
    } catch {
        // ignore
    }
};

export interface StoredAnalysis {
    at: number;
    result: AnalysisResult;
}

export const loadLastAnalysis = (): StoredAnalysis | null => {
    try {
        const raw = localStorage.getItem(LAST_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredAnalysis;
        return parsed && typeof parsed.at === 'number' && typeof parsed.result?.summary === 'string' ? parsed : null;
    } catch {
        return null;
    }
};

export const saveLastAnalysis = (entry: StoredAnalysis): void => {
    try {
        localStorage.setItem(LAST_KEY, JSON.stringify(entry));
    } catch {
        // ignore
    }
};
