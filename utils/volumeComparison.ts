import type { WorkoutSet } from '../types';

/**
 * Per-exercise "this session vs last session" figure shown on the expanded
 * workout card. Weighted lifts compare volume (kg x reps, canonical kg);
 * bodyweight lifts compare total reps. Timed/cardio work has no comparable
 * figure and returns null.
 *
 * Mid-exercise the comparison is like-for-like: with k sets done so far, they
 * are compared with the first k working sets of last time, so finishing 1 of 4
 * sets does not read as a huge drop against last time's full total.
 */
export type VolumeComparisonKind = 'volume' | 'reps';

export interface VolumeComparison {
    kind: VolumeComparisonKind;
    current: number;
    /** Last time's figure over the same sets as `current` (all of them before the first set is done). */
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

const sumCounted = (sets: readonly WorkoutSet[], kind: VolumeComparisonKind): number => {
    let total = 0;
    for (const set of sets) {
        total += kind === 'reps' ? num(set.reps) : num(set.weight) * num(set.reps);
    }
    return total;
};

export const sumSets = (sets: readonly WorkoutSet[] | null | undefined, kind: VolumeComparisonKind): number =>
    sets ? sumCounted(sets.filter(isCountedSet), kind) : 0;

export const hasCountedSets = (sets: readonly WorkoutSet[] | null | undefined): boolean =>
    !!sets && sets.some(isCountedSet);

export const getVolumeComparison = (
    currentSets: readonly WorkoutSet[],
    previousSets: readonly WorkoutSet[] | null | undefined,
    opts: { isBodyweight?: boolean; isIsometric?: boolean; isCardio?: boolean },
): VolumeComparison | null => {
    if (opts.isCardio || opts.isIsometric) return null;
    const previousCounted = (previousSets ?? []).filter(isCountedSet);
    if (previousCounted.length === 0) return null;

    const kind: VolumeComparisonKind = opts.isBodyweight ? 'reps' : 'volume';
    if (sumCounted(previousCounted, kind) <= 0) return null;

    const currentCounted = currentSets.filter(isCountedSet);
    const done = currentCounted.length;
    const basis = done > 0 && done < previousCounted.length ? previousCounted.slice(0, done) : previousCounted;
    const previous = sumCounted(basis, kind);
    const current = sumCounted(currentCounted, kind);
    return { kind, current, previous, delta: done > 0 ? current - previous : null };
};
