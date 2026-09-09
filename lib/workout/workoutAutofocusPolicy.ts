import type { WorkoutSet } from '../../types';

export type WorkoutFieldFocus = 'weight' | 'reps';

type FocusInput = {
    wasCompleted: boolean;
    isCompleted: boolean;
    currentSetIndex: number;
    sets: WorkoutSet[];
    isBodyweight: boolean;
    isIsometric: boolean;
};

const hasValue = (value: string | number | undefined): boolean => String(value ?? '').trim().length > 0;

export const getNextWorkoutFieldFocus = ({
    wasCompleted,
    isCompleted,
    currentSetIndex,
    sets,
    isBodyweight,
    isIsometric,
}: FocusInput): WorkoutFieldFocus | null => {
    if (wasCompleted || !isCompleted || isIsometric) return null;

    const nextSet = sets.slice(currentSetIndex + 1).find(candidate => !candidate.completed && !candidate.skipped);
    if (!nextSet) return null;
    if (isBodyweight) return hasValue(nextSet.reps) ? null : 'reps';
    if (!hasValue(nextSet.weight)) return 'weight';
    return hasValue(nextSet.reps) ? null : 'reps';
};
