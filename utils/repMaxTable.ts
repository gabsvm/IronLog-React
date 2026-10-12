import type { Log } from '../types';
import { estimate1RM } from '../utils';

export const REP_MAX_ROWS = 12;

export interface RepMaxRow {
    reps: number;
    /** Heaviest completed working set with exactly this many reps (kg), or null. */
    actualWeight: number | null;
    actualDate: number | null;
    /** What the best estimated 1RM predicts for this many reps (kg, unrounded). */
    predictedWeight: number | null;
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
export const computeRepMaxTable = (logs: readonly Log[], exerciseIds: ReadonlySet<string>): RepMaxRow[] => {
    const actual = new Map<number, { weight: number; date: number }>();
    let best1RM = 0;

    for (const log of logs) {
        if (!log || log.skipped || !Array.isArray(log.exercises)) continue;
        const date = log.endTime || log.startTime || 0;
        for (const ex of log.exercises) {
            if (!ex || !exerciseIds.has(String(ex.id)) || !Array.isArray(ex.sets)) continue;
            for (const set of ex.sets) {
                if (!set || !set.completed || set.skipped || set.type === 'warmup' || set.type === 'avt_hop') continue;
                const weight = positive(set.weight);
                const reps = Math.round(positive(set.reps));
                if (weight <= 0 || reps < 1 || reps > REP_MAX_ROWS) continue;

                best1RM = Math.max(best1RM, reps === 1 ? weight : estimate1RM(weight, reps));
                const current = actual.get(reps);
                if (!current || weight > current.weight || (weight === current.weight && date > current.date)) {
                    actual.set(reps, { weight, date });
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
