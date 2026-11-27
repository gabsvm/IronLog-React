import type { EquipmentType, Log } from '../types';
import { estimate1RM } from '../utils';
import { getEffectiveSetLoad, getLogBodyWeight } from './trainingMetrics';

export const REP_MAX_ROWS = 12;

export interface RepMaxRow {
    reps: number;
    /** Heaviest completed working set with exactly this many reps (kg), or null. */
    actualWeight: number | null;
    actualDate: number | null;
    /** What the best estimated 1RM predicts for this many reps (kg, unrounded). */
    predictedWeight: number | null;
}

export interface RepMaxOptions {
    equipment?: EquipmentType;
    isBodyweight?: boolean;
    bodyWeight?: number;
}

const positive = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Rep-max table for one exercise (1..12 reps). "Actual" is the heaviest real set
 * at that exact rep count (ties go to the most recent); "predicted" inverts the
 * app's own 1RM estimate (Epley, see utils.estimate1RM) from the best set in
 * the 1..12 range, so it agrees with the 1RM shown elsewhere. Only completed,
 * non-warmup sets count. Returns [] when there is no qualifying history.
 */
export const computeRepMaxTable = (
    logs: readonly Log[],
    exerciseIds: ReadonlySet<string>,
    options: RepMaxOptions = {},
): RepMaxRow[] => {
    const actual = new Map<number, { weight: number; rankLoad: number; date: number }>();
    let best1RM = 0;

    for (const log of logs) {
        if (!log || log.skipped || !Array.isArray(log.exercises)) continue;
        const date = log.endTime || log.startTime || 0;
        const logBw = getLogBodyWeight(log, options.bodyWeight);
        for (const ex of log.exercises) {
            if (!ex || !exerciseIds.has(String(ex.id)) || !Array.isArray(ex.sets)) continue;
            const eq = options.equipment ?? ex.equipment;
            const isAssisted = eq === 'machine_assistance';
            for (const set of ex.sets) {
                if (!set || !set.completed || set.skipped || set.type === 'warmup' || set.type === 'avt_hop') continue;
                const rawWeight = positive(set.weight);
                const reps = Math.round(positive(set.reps));
                if (reps < 1 || reps > REP_MAX_ROWS) continue;
                if (!isAssisted && rawWeight <= 0) continue;

                const rankLoad = isAssisted
                    ? getEffectiveSetLoad(set, { equipment: eq, isBodyweight: options.isBodyweight ?? ex.isBodyweight }, logBw)
                    : rawWeight;
                if (rankLoad <= 0) continue;

                best1RM = Math.max(best1RM, reps === 1 ? rankLoad : estimate1RM(rankLoad, reps));
                const displayWeight = isAssisted ? -rawWeight : rawWeight;
                const current = actual.get(reps);
                if (!current || rankLoad > current.rankLoad || (rankLoad === current.rankLoad && date > current.date)) {
                    actual.set(reps, { weight: displayWeight, rankLoad, date });
                }
            }
        }
    }

    if (best1RM <= 0) return [];
    return Array.from({ length: REP_MAX_ROWS }, (_, i) => {
        const reps = i + 1;
        const hit = actual.get(reps);
        return {
            reps,
            actualWeight: hit?.weight ?? null,
            actualDate: hit?.date ?? null,
            predictedWeight: reps === 1 ? best1RM : best1RM / (1 + reps / 30),
        };
    });
};
