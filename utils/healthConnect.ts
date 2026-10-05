// U9: Health Connect (Android app only). Opt-in from Profile → Body:
//   - import body weight into bodyLogs (one entry per local day; a weight the
//     user logged by hand that day always wins);
//   - export each finished workout as a strength-training session
//     (idempotent: clientRecordId = gainslab-<log.id>).
// The web/PWA build never touches the bridge.
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BodyLog, Log } from '../types';
import { formatLocalDateKey } from './localDate';

export type HealthConnectStatus = 'available' | 'update_required' | 'unsupported';

export interface HealthWeightRecord {
    time: number;
    kg: number;
    origin?: string;
}

export interface HealthWorkoutPayload {
    id: string;
    startMs: number;
    endMs: number;
    title?: string;
    notes?: string;
}

interface HealthConnectPlugin {
    getStatus(): Promise<{ status: HealthConnectStatus; granted: boolean }>;
    requestAccess(): Promise<{ granted: boolean }>;
    openHealthConnect(): Promise<void>;
    readWeights(options: { sinceMs: number }): Promise<{ records: HealthWeightRecord[] }>;
    writeWorkout(options: HealthWorkoutPayload & { version?: number }): Promise<{ written: boolean }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect');

export const isHealthConnectPlatform = (): boolean =>
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// ─── Preferences (device-local) ─────────────────────────────────────────────
const PREFS_KEY = 'il_health_connect_v1';

export interface HealthConnectPrefs {
    exportWorkouts: boolean;
    lastWeightImportAt: number;
}

const DEFAULT_PREFS: HealthConnectPrefs = { exportWorkouts: false, lastWeightImportAt: 0 };

export const getHealthConnectPrefs = (): HealthConnectPrefs => {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return { ...DEFAULT_PREFS };
        const parsed = JSON.parse(raw) as Partial<HealthConnectPrefs>;
        return {
            exportWorkouts: parsed.exportWorkouts === true,
            lastWeightImportAt: Number.isFinite(parsed.lastWeightImportAt) ? Number(parsed.lastWeightImportAt) : 0,
        };
    } catch {
        return { ...DEFAULT_PREFS };
    }
};

export const setHealthConnectPrefs = (patch: Partial<HealthConnectPrefs>): HealthConnectPrefs => {
    const next = { ...getHealthConnectPrefs(), ...patch };
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
        // storage unavailable: keep working with the in-memory value
    }
    return next;
};

// ─── Pure helpers ───────────────────────────────────────────────────────────
const MIN_KG = 20;
const MAX_KG = 400;

/**
 * Merges Health Connect weights into body logs. One entry per local day: the
 * latest reading of a day wins among HC records, and any existing body log
 * for that day (typed by hand or imported before) is never replaced.
 */
export const mergeHealthWeights = (
    bodyLogs: BodyLog[],
    records: HealthWeightRecord[],
): { merged: BodyLog[]; added: number } => {
    const takenDays = new Set(bodyLogs.map((l) => formatLocalDateKey(new Date(l.date))));
    const latestByDay = new Map<string, HealthWeightRecord>();
    for (const r of records) {
        if (!Number.isFinite(r.time) || !Number.isFinite(r.kg) || r.kg < MIN_KG || r.kg > MAX_KG) continue;
        const day = formatLocalDateKey(new Date(r.time));
        if (takenDays.has(day)) continue;
        const prev = latestByDay.get(day);
        if (!prev || r.time > prev.time) latestByDay.set(day, r);
    }
    const additions: BodyLog[] = [...latestByDay.values()].map((r) => ({
        id: r.time,
        date: r.time,
        weight: Math.round(r.kg * 10) / 10,
    }));
    if (additions.length === 0) return { merged: bodyLogs, added: 0 };
    return { merged: [...bodyLogs, ...additions].sort((a, b) => b.date - a.date), added: additions.length };
};

/** Builds the session to write, or null when the log has no usable time range. */
export const toHealthWorkout = (log: Log): HealthWorkoutPayload | null => {
    const start = Number(log.startTime);
    const fromDuration = Number.isFinite(log.duration) && log.duration > 0 ? start + log.duration * 1000 : NaN;
    const end = Number(log.endTime) > start ? Number(log.endTime) : fromDuration;
    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(end) || end <= start) return null;
    const done = (log.exercises || []).reduce(
        (n, ex) => n + (ex.sets || []).filter((s) => s.completed && !s.skipped).length,
        0,
    );
    return {
        id: String(log.id),
        startMs: start,
        endMs: end,
        title: log.name || 'GainsLab',
        notes: done > 0 ? `GainsLab · ${done} sets` : 'GainsLab',
    };
};

// ─── Bridge calls (native only) ─────────────────────────────────────────────
export const getHealthConnectStatus = async (): Promise<{ status: HealthConnectStatus; granted: boolean }> => {
    if (!isHealthConnectPlatform()) return { status: 'unsupported', granted: false };
    try {
        return await HealthConnect.getStatus();
    } catch {
        return { status: 'unsupported', granted: false };
    }
};

export const requestHealthConnectAccess = async (): Promise<boolean> => {
    if (!isHealthConnectPlatform()) return false;
    const res = await HealthConnect.requestAccess();
    return res.granted === true;
};

export const openHealthConnectApp = async (): Promise<void> => {
    if (!isHealthConnectPlatform()) return;
    await HealthConnect.openHealthConnect();
};

export const readHealthWeights = async (sinceMs: number): Promise<HealthWeightRecord[]> => {
    if (!isHealthConnectPlatform()) return [];
    const res = await HealthConnect.readWeights({ sinceMs: Math.max(0, Math.floor(sinceMs)) });
    return Array.isArray(res.records) ? res.records : [];
};

export const writeHealthWorkout = async (log: Log): Promise<boolean> => {
    if (!isHealthConnectPlatform()) return false;
    const payload = toHealthWorkout(log);
    if (!payload) return false;
    const res = await HealthConnect.writeWorkout({ ...payload, version: Date.now() });
    return res.written === true;
};

/** Called after a workout is saved; never throws, no-op unless opted in. */
export const maybeExportWorkoutToHealth = async (
    log: Log,
    deps: { prefs?: () => HealthConnectPrefs; write?: (log: Log) => Promise<boolean> } = {},
): Promise<boolean> => {
    const prefs = (deps.prefs ?? getHealthConnectPrefs)();
    if (!prefs.exportWorkouts) return false;
    try {
        return await (deps.write ?? writeHealthWorkout)(log);
    } catch {
        return false;
    }
};

export interface HealthConnectApi {
    getStatus: typeof getHealthConnectStatus;
    requestAccess: typeof requestHealthConnectAccess;
    openApp: typeof openHealthConnectApp;
    readWeights: typeof readHealthWeights;
}

export const healthConnectApi: HealthConnectApi = {
    getStatus: getHealthConnectStatus,
    requestAccess: requestHealthConnectAccess,
    openApp: openHealthConnectApp,
    readWeights: readHealthWeights,
};
