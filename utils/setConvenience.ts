import type { WorkoutSet } from '../types';

/**
 * Pure helpers for the workout-card set shortcuts. They only ever write the
 * load/reps columns (never completion, type, RPE or program prescription) so a
 * convenience action cannot copy session-specific state.
 */

const isBlank = (value: unknown): boolean => value === '' || value == null;

const canWrite = (set: WorkoutSet): boolean => !set.completed && !set.skipped && set.type !== 'avt_hop';

/** True when at least one editable set has a value from the last session to fill in. */
export const canFillFromPrevious = (sets: readonly WorkoutSet[]): boolean =>
    sets.some(set => canWrite(set) && (!isBlank(set.prevWeight) || !isBlank(set.prevReps)));

/** Fill each open set's weight/reps from what it showed as "previous". Blanks in the history are left untouched. */
export const fillFromPrevious = (sets: readonly WorkoutSet[]): WorkoutSet[] =>
    sets.map(set => {
        if (!canWrite(set)) return set;
        const weight = isBlank(set.prevWeight) ? set.weight : set.prevWeight!;
        const reps = isBlank(set.prevReps) ? set.reps : set.prevReps!;
        return weight === set.weight && reps === set.reps ? set : { ...set, weight, reps };
    });

/** Index of the last completed set that still has open sets after it, or -1. */
export const copySourceIndex = (sets: readonly WorkoutSet[]): number => {
    for (let i = sets.length - 2; i >= 0; i--) {
        const set = sets[i];
        if (set.completed && !isBlank(set.reps) && sets.slice(i + 1).some(canWrite)) return i;
    }
    return -1;
};

/** Copy weight/reps of the set at `sourceIndex` onto every open set after it. */
export const copyToFollowing = (sets: readonly WorkoutSet[], sourceIndex: number): WorkoutSet[] => {
    const source = sets[sourceIndex];
    if (!source) return sets.slice();
    return sets.map((set, i) =>
        i > sourceIndex && canWrite(set) && (set.weight !== source.weight || set.reps !== source.reps)
            ? { ...set, weight: source.weight, reps: source.reps }
            : set,
    );
};

/** Put a removed set back at its original position (clamped), unless it is already there. */
export const restoreSet = (sets: readonly WorkoutSet[], removed: WorkoutSet, index: number): WorkoutSet[] => {
    if (sets.some(set => set.id === removed.id)) return sets.slice();
    const at = Math.max(0, Math.min(index, sets.length));
    return [...sets.slice(0, at), removed, ...sets.slice(at)];
};
