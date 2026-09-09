import type { ActiveSession, SessionExercise, WorkoutSet } from '../../types';

export type NormalizedWorkoutState = {
    sessionMeta: Omit<ActiveSession, 'exercises'> | null;
    exerciseOrder: number[];
    exercisesById: Record<number, Omit<SessionExercise, 'sets'>>;
    setOrderByExercise: Record<number, number[]>;
    setsById: Record<number, WorkoutSet>;
};

export const updateNormalizedWorkoutSet = <K extends keyof WorkoutSet>(
    state: NormalizedWorkoutState,
    exerciseId: number,
    setId: number,
    field: K,
    value: WorkoutSet[K],
): NormalizedWorkoutState => {
    const currentSet = state.setsById[setId];
    if (!currentSet || !state.exercisesById[exerciseId]) return state;

    return {
        ...state,
        setsById: {
            ...state.setsById,
            [setId]: { ...currentSet, [field]: value },
        },
    };
};

export const normalizeActiveSession = (session: ActiveSession | null): NormalizedWorkoutState | null => {
    if (!session) return null;

    const exercisesById: Record<number, Omit<SessionExercise, 'sets'>> = {};
    const setOrderByExercise: Record<number, number[]> = {};
    const setsById: Record<number, WorkoutSet> = {};
    const exerciseOrder = session.exercises.map(exercise => exercise.instanceId);

    for (const exercise of session.exercises) {
        const { sets, ...exerciseMeta } = exercise;
        exercisesById[exercise.instanceId] = exerciseMeta;
        setOrderByExercise[exercise.instanceId] = sets.map(set => set.id);
        for (const set of sets) setsById[set.id] = set;
    }

    const { exercises: _exercises, ...sessionMeta } = session;
    return { sessionMeta, exerciseOrder, exercisesById, setOrderByExercise, setsById };
};

export const denormalizeActiveSession = (state: NormalizedWorkoutState | null): ActiveSession | null => {
    if (!state?.sessionMeta) return null;

    return {
        ...state.sessionMeta,
        exercises: state.exerciseOrder.map(instanceId => ({
            ...state.exercisesById[instanceId],
            sets: (state.setOrderByExercise[instanceId] || []).map(setId => state.setsById[setId]),
        })),
    };
};
