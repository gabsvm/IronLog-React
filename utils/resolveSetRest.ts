import type { ActiveSession, MesoCycle, SessionExercise, WorkoutSet } from '../types';
import { readWorkoutPrefs } from './workoutPrefs';
import { getExerciseRestOverride } from './exerciseRestOverrides';

/**
 * Strong parity: the auto-rest duration for one completed set. Mirrors the
 * per-exercise and per-set-type resolution the controller applies on set
 * completion (density > per-exercise preset > calisthenics/type rules).
 * Returns null when no rest applies (drop without preset, EMOM).
 */
export const resolveSetRestSeconds = (
    set: Pick<WorkoutSet, 'type'> | null | undefined,
    ex: (Pick<SessionExercise, 'progressionMode' | 'densityTargetRestSeconds' | 'defaultRestSeconds' | 'isIsometric' | 'isBodyweight' | 'cardioType'> & { id?: string }) | null | undefined,
    config: unknown,
    currentMeso?: Pick<MesoCycle, 'mesoType'> | null,
): number | null => {
    if (!set || !ex) return null;
    // Persisted per-exercise override behaves like a stamped defaultRestSeconds.
    const storedOverride = !ex.defaultRestSeconds ? getExerciseRestOverride(typeof ex.id === 'string' ? ex.id : undefined) : undefined;
    const exerciseDefault = ex.defaultRestSeconds && ex.defaultRestSeconds > 0 ? ex.defaultRestSeconds : storedOverride;
    if (set.type === 'emom') return null;
    if (set.type === 'drop' && !exerciseDefault) return null;

    const restPrefs = readWorkoutPrefs(config);
    const isMetabolite = currentMeso?.mesoType === 'metabolite';
    let dur = restPrefs.defaultRestSeconds ?? (isMetabolite ? 60 : 120);

    if (ex.progressionMode === 'density' && ex.densityTargetRestSeconds && ex.densityTargetRestSeconds > 0) {
        dur = ex.densityTargetRestSeconds;
    } else if (exerciseDefault && exerciseDefault > 0) {
        dur = exerciseDefault;
    } else {
        if (ex.isIsometric) {
            dur = 150;
        } else if (ex.isBodyweight) {
            dur = isMetabolite ? 45 : 90;
        }

        if (set.type === 'myorep' || set.type === 'myorep_match' || set.type === 'giant') dur = 30;
        if (set.type === 'warmup') dur = restPrefs.warmupRestSeconds ?? 60;
        if (set.type === 'cluster') dur = 15;
        if (set.type === 'drop') dur = 0;
        if (set.type === 'rest_pause') dur = 20;
        if (set.type === 'time_volume') dur = 10;
        if (set.type === 'triple_add') dur = 10;

        if (ex.cardioType === 'tabata') dur = 10;
        else if (ex.cardioType === 'hiit') dur = (set as { restSeconds?: unknown }).restSeconds as number || 60;
    }
    return Math.max(0, Math.round(Number(dur) || 0));
};

/** Superset gate shared with the controller: rest only when both sides finish the same round. */
export const isSupersetRoundComplete = (
    exercises: readonly SessionExercise[] | undefined,
    exInstanceId: number,
): boolean => {
    const list = exercises || [];
    const ex = list.find((e) => e.instanceId === exInstanceId);
    if (!ex?.supersetId) return true;
    const partners = list.filter((e) => e.supersetId === ex.supersetId && e.instanceId !== exInstanceId);
    if (partners.length === 0) return true;
    const isWorking = (s: WorkoutSet) => s && s.type !== 'warmup' && s.type !== 'avt_hop';
    const thisCompleted = (ex.sets || []).filter((s) => isWorking(s) && s.completed).length;
    return partners.every((p) => (p.sets || []).filter((s) => isWorking(s) && s.completed).length >= thisCompleted);
};

/** ActiveSession lookup for hooks that only have the store (no render state). */
export const findSessionExercise = (session: ActiveSession | null | undefined, instanceId: number): SessionExercise | undefined =>
    (session?.exercises || []).find((e) => e.instanceId === instanceId);
