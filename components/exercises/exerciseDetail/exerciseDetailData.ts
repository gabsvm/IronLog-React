import type { ExerciseDef, Log } from '../../../types';
import { estimateOneRm, type OneRmFormula } from '../../../utils/strongTraining';
import { getEffectiveSetLoad, getLogBodyWeight, getSetLoadVolume } from '../../../utils/trainingMetrics';
import type { ChartDataPoint } from '../../stats/ProgressChart';

// Shared, UI-free derivations for the exercise detail tabs. All history
// resolves through the canonical id group so merged duplicates share one
// detail view (logs are never rewritten). Loads are canonical kg; display
// conversion happens in the tab components.
export type ExerciseGroupIds = string[];

const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const isWorkingSet = (set: { completed?: boolean; skipped?: boolean; type?: string }): boolean =>
    !!set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop';

export interface ExerciseHistorySet {
    weight: number;
    reps: number;
    type: string;
    duration: number | string;
    distance: number | string;
}

export interface ExerciseHistoryEntry {
    logId: number;
    date: number;
    logName: string;
    sets: ExerciseHistorySet[];
    /** Heaviest effective load among working sets (kg, bodyweight included). */
    bestWeight: number;
    /** Reps logged at the heaviest set. */
    bestReps: number;
    /** Best Epley estimate among working sets (kg). */
    best1RM: number;
    /** Sum of set volumes for the session (kg). */
    volume: number;
    /** Total working minutes (cardio). */
    durationMin: number;
    /** Total working distance (cardio, km). */
    distanceKm: number;
    /** Longest hold (isometric, seconds). */
    bestHoldSec: number;
}

export const parseSetMinutes = (value: unknown): number => {
    if (typeof value === 'number') return value > 0 ? value : 0;
    if (value == null || value === '') return 0;
    const raw = String(value).trim();
    if (raw.includes(':')) {
        const parts = raw.split(':').map(Number);
        if (parts.some(part => !Number.isFinite(part))) return 0;
        if (parts.length === 2) return parts[0] + parts[1] / 60;
        if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
        return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Newest-first per-session history for one exercise group. Skipped logs and
 * skipped/incomplete sets never count; warmups are listed but excluded from
 * best/volume aggregates (same convention as the rep-max table).
 */
export const getExerciseHistoryEntries = (
    logs: readonly Log[],
    groupIds: ExerciseGroupIds,
    fallbackBodyWeight?: number,
    formula: OneRmFormula = 'epley',
    factorInRpe = false,
): ExerciseHistoryEntry[] => {
    if (groupIds.length === 0) return [];
    const wanted = new Set(groupIds.map(String));
    const entries: ExerciseHistoryEntry[] = [];

    for (const log of logs) {
        if (!log || log.skipped || !Array.isArray(log.exercises)) continue;
        const matches = log.exercises.filter(ex => ex && wanted.has(String(ex.id)));
        if (matches.length === 0) continue;
        const logBodyWeight = getLogBodyWeight(log, fallbackBodyWeight);
        const date = log.endTime || log.startTime || 0;

        const sets: ExerciseHistorySet[] = [];
        let bestWeight = 0;
        let bestReps = 0;
        let best1RM = 0;
        let volume = 0;
        let durationMin = 0;
        let distanceKm = 0;
        let bestHoldSec = 0;

        for (const ex of matches) {
            const isCardio = ex.muscle === 'CARDIO';
            const isIsometric = !!(ex as ExerciseDef).isIsometric;
            for (const set of ex.sets || []) {
                if (!set || !set.completed || set.skipped) continue;
                sets.push({
                    weight: toNumber(set.weight),
                    reps: Math.round(toNumber(set.reps)),
                    type: set.type || 'regular',
                    duration: set.duration ?? 0,
                    distance: set.distance ?? 0,
                });
                if (!isWorkingSet(set)) continue;
                if (isCardio) {
                    durationMin += parseSetMinutes(set.duration);
                    distanceKm += toNumber(set.distance);
                    continue;
                }
                if (isIsometric) {
                    bestHoldSec = Math.max(bestHoldSec, toNumber(set.duration));
                    continue;
                }
                const reps = Math.round(toNumber(set.reps));
                const effective = getEffectiveSetLoad(set, ex, logBodyWeight);
                volume += getSetLoadVolume(set, ex, logBodyWeight);
                if (effective > bestWeight && reps > 0) {
                    bestWeight = effective;
                    bestReps = reps;
                }
                if (reps > 0 && effective > 0) {
                    best1RM = Math.max(best1RM, estimateOneRm(effective, reps, formula, set.rpe, factorInRpe));
                }
            }
        }

        if (sets.length === 0) continue;
        entries.push({
            logId: log.id,
            date,
            logName: String(log.name || ''),
            sets,
            bestWeight,
            bestReps,
            best1RM,
            volume,
            durationMin,
            distanceKm,
            bestHoldSec,
        });
    }

    entries.sort((a, b) => b.date - a.date);
    return entries;
};

/**
 * Per-session heaviest effective load series (canonical kg), newest-last for
 * charts. Mirrors the stats worker 1RM filter (completed, not skipped, with
 * load and reps) but tracks the max instead of the estimate, so the "max
 * load" graph agrees with the 1RM/volume graphs point for point.
 */
export const computeMaxWeightSeries = (
    logs: readonly Log[],
    groupIds: ExerciseGroupIds,
    fallbackBodyWeight?: number,
): ChartDataPoint[] => {
    if (groupIds.length === 0) return [];
    const wanted = new Set(groupIds.map(String));
    const points: ChartDataPoint[] = [];

    for (const log of logs) {
        if (!log || log.skipped || !Array.isArray(log.exercises)) continue;
        const matches = log.exercises.filter(ex => ex && wanted.has(String(ex.id)));
        if (matches.length === 0) continue;
        const logBodyWeight = getLogBodyWeight(log, fallbackBodyWeight);
        let best = 0;
        let bestReps = 0;
        for (const ex of matches) {
            for (const set of ex.sets || []) {
                if (!set || !set.completed || set.skipped) continue;
                if (!(set.weight || set.weight === 0 || set.weight === '0') || !set.reps) continue;
                const load = getEffectiveSetLoad(set, ex, logBodyWeight);
                const reps = Math.round(toNumber(set.reps));
                if (load > best && reps > 0) {
                    best = load;
                    bestReps = reps;
                }
            }
        }
        if (best > 0) {
            points.push({ date: log.endTime || log.startTime || 0, value: Number(best.toFixed(1)), weight: best, reps: bestReps });
        }
    }

    points.sort((a, b) => a.date - b.date);
    return points;
};

export interface ExerciseRecords {
    sessions: number;
    lastDate: number | null;
    best1RM: number;
    best1RMWeight: number;
    best1RMReps: number;
    best1RMDate: number | null;
    maxWeight: number;
    maxWeightReps: number;
    maxWeightDate: number | null;
    maxSessionVolume: number;
    maxSessionVolumeDate: number | null;
    totalVolume: number;
    maxReps: number;
    maxRepsWeight: number;
    maxRepsDate: number | null;
    bestHoldSec: number;
    bestHoldDate: number | null;
    totalDurationMin: number;
    totalDistanceKm: number;
}

/** Aggregate personal records over the history entries (working sets only). */
export const computeExerciseRecords = (entries: readonly ExerciseHistoryEntry[]): ExerciseRecords => {
    const records: ExerciseRecords = {
        sessions: entries.length,
        lastDate: entries.length > 0 ? entries[0].date : null,
        best1RM: 0,
        best1RMWeight: 0,
        best1RMReps: 0,
        best1RMDate: null,
        maxWeight: 0,
        maxWeightReps: 0,
        maxWeightDate: null,
        maxSessionVolume: 0,
        maxSessionVolumeDate: null,
        totalVolume: 0,
        maxReps: 0,
        maxRepsWeight: 0,
        maxRepsDate: null,
        bestHoldSec: 0,
        bestHoldDate: null,
        totalDurationMin: 0,
        totalDistanceKm: 0,
    };

    for (const entry of entries) {
        records.totalVolume += entry.volume;
        records.totalDurationMin += entry.durationMin;
        records.totalDistanceKm += entry.distanceKm;
        if (entry.volume > records.maxSessionVolume) {
            records.maxSessionVolume = entry.volume;
            records.maxSessionVolumeDate = entry.date;
        }
        if (entry.best1RM > records.best1RM) {
            records.best1RM = entry.best1RM;
            records.best1RMWeight = entry.bestWeight;
            records.best1RMReps = entry.bestReps;
            records.best1RMDate = entry.date;
        }
        if (entry.bestWeight > records.maxWeight) {
            records.maxWeight = entry.bestWeight;
            records.maxWeightReps = entry.bestReps;
            records.maxWeightDate = entry.date;
        }
        if (entry.bestHoldSec > records.bestHoldSec) {
            records.bestHoldSec = entry.bestHoldSec;
            records.bestHoldDate = entry.date;
        }
        for (const set of entry.sets) {
            if (set.reps > records.maxReps) {
                records.maxReps = set.reps;
                records.maxRepsWeight = set.weight;
                records.maxRepsDate = entry.date;
            }
        }
    }

    return records;
};
