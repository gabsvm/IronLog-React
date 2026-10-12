import type { WorkoutSet } from '../types';

/**
 * Per-exercise "this session vs last session" figure shown on the expanded
 * workout card. Weighted lifts compare volume (kg x reps, canonical kg);
 * bodyweight lifts compare total reps. Timed/cardio work has no comparable
 * figure and returns null.
 */
export type VolumeComparisonKind = 'volume' | 'reps';

export interface VolumeComparison {
    kind: VolumeComparisonKind;
    current: number;
    previous: number;
    /** current - previous; null when nothing has been completed yet. */
    delta: number | null;
}

const isCountedSet = (set: WorkoutSet | null | undefined): set is WorkoutSet =>
    !!set && !!set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop';

const num = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const sumSets = (sets: readonly WorkoutSet[] | null | undefined, kind: VolumeComparisonKind): number => {
    if (!sets) return 0;
    let total = 0;
    for (const set of sets) {
        if (!isCountedSet(set)) continue;
        total += kind === 'reps' ? num(set.reps) : num(set.weight) * num(set.reps);
    }
    return total;
};

export const hasCountedSets = (sets: readonly WorkoutSet[] | null | undefined): boolean =>
    !!sets && sets.some(isCountedSet);

export const getVolumeComparison = (
    currentSets: readonly WorkoutSet[],
    previousSets: readonly WorkoutSet[] | null | undefined,
    opts: { isBodyweight?: boolean; isIsometric?: boolean; isCardio?: boolean },
): VolumeComparison | null => {
    if (opts.isCardio || opts.isIsometric) return null;
    if (!hasCountedSets(previousSets)) return null;

    const kind: VolumeComparisonKind = opts.isBodyweight ? 'reps' : 'volume';
    const previous = sumSets(previousSets, kind);
    if (previous <= 0) return null;

    const current = sumSets(currentSets, kind);
    return {
        kind,
        current,
        previous,
        delta: hasCountedSets(currentSets) ? current - previous : null,
    };
};
