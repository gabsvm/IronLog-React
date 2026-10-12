import type { Log, SessionExercise, WeightUnit, WorkoutSet } from '../types';
import { fromDisplay, toDisplay } from './units';

/**
 * Editing a finished workout (see docs/specs/history-edit.md). The draft is a
 * deep copy of the Log in which the editable sets carry weight/reps as strings
 * in the DISPLAY unit; buildEditedLog turns it back into a canonical (kg) Log.
 */

export const MAX_WEIGHT_KG = 1500;
export const MAX_REPS = 1000;

export type EditField = 'weight' | 'reps';
export type EditErrors = Record<string, Partial<Record<EditField, true>>>;
export type EditResult =
    | { ok: true; changed: boolean; log: Log }
    | { ok: false; errors: EditErrors; empty: boolean };

/** Strength / bodyweight sets that were really performed. Cardio and isometric holds are read-only. */
export const isEditableSet = (ex: SessionExercise, set: WorkoutSet): boolean =>
    !!set && !!set.completed && !set.skipped && ex.muscle !== 'CARDIO' && !ex.isIsometric;

export const setKey = (instanceId: number | string, setId: number | string): string => `${instanceId}:${setId}`;

const displayWeight = (value: unknown, unit: WeightUnit): string => {
    if (value === '' || value == null) return '';
    const n = Number(value);
    return Number.isFinite(n) ? String(toDisplay(n, unit)) : '';
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const toDraft = (log: Log, unit: WeightUnit): Log => {
    const draft = clone(log);
    for (const ex of draft.exercises || []) {
        ex.sets = (ex.sets || []).map(set =>
            isEditableSet(ex, set)
                ? { ...set, weight: displayWeight(set.weight, unit), reps: set.reps == null ? '' : String(set.reps) }
                : set);
    }
    return draft;
};

const mapExercise = (draft: Log, instanceId: number, fn: (ex: SessionExercise) => SessionExercise): Log => ({
    ...draft,
    exercises: (draft.exercises || []).map(ex => (ex.instanceId === instanceId ? fn(ex) : ex)),
});

export const draftUpdateSet = (draft: Log, instanceId: number, setId: number, field: EditField, value: string): Log =>
    mapExercise(draft, instanceId, ex => ({
        ...ex,
        sets: ex.sets.map(set => (set.id === setId && isEditableSet(ex, set) ? { ...set, [field]: value } : set)),
    }));

export const draftRemoveSet = (draft: Log, instanceId: number, setId: number): Log =>
    mapExercise(draft, instanceId, ex => ({
        ...ex,
        sets: ex.sets.filter(set => !(set.id === setId && isEditableSet(ex, set))),
    }));

/** Add a completed regular set after the last editable one, prefilled from it. */
export const draftAddSet = (draft: Log, instanceId: number): Log => {
    let maxId = 0;
    for (const ex of draft.exercises || []) for (const set of ex.sets || []) maxId = Math.max(maxId, Number(set.id) || 0);
    return mapExercise(draft, instanceId, ex => {
        if (ex.muscle === 'CARDIO' || ex.isIsometric) return ex;
        const lastEditable = [...ex.sets].reverse().find(set => isEditableSet(ex, set) && set.type !== 'warmup');
        const added: WorkoutSet = {
            id: maxId + 1,
            weight: lastEditable ? lastEditable.weight : '',
            reps: lastEditable ? lastEditable.reps : '',
            rpe: '',
            completed: true,
            type: 'regular',
        };
        const insertAt = lastEditable ? ex.sets.lastIndexOf(lastEditable) + 1 : ex.sets.length;
        return { ...ex, sets: [...ex.sets.slice(0, insertAt), added, ...ex.sets.slice(insertAt)] };
    });
};

export const draftSetNote = (draft: Log, note: string): Log => ({ ...draft, note });

const parseWeightKg = (text: string, unit: WeightUnit): number | null | 'bad' => {
    const trimmed = text.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return 'bad';
    const kg = fromDisplay(n, unit);
    return kg > MAX_WEIGHT_KG ? 'bad' : kg;
};

const parseReps = (text: string): number | 'bad' => {
    const trimmed = text.trim();
    if (!/^\d+$/.test(trimmed)) return 'bad';
    const n = Number(trimmed);
    return n >= 1 && n <= MAX_REPS ? n : 'bad';
};

const sameContent = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Validate the draft and produce the Log to persist. Only weight/reps of
 * editable sets, set removals/additions and the note can differ from the
 * original; everything else is taken from the original object.
 */
export const buildEditedLog = (original: Log, draft: Log, unit: WeightUnit, now: number): EditResult => {
    const errors: EditErrors = {};

    const exercises: SessionExercise[] = (original.exercises || []).map(origEx => {
        const draftEx = (draft.exercises || []).find(ex => ex.instanceId === origEx.instanceId);
        if (!draftEx) return origEx;
        const origSets = new Map(origEx.sets.map(set => [set.id, set]));
        const nextSets: WorkoutSet[] = [];

        for (const set of draftEx.sets || []) {
            const orig = origSets.get(set.id);
            if (!isEditableSet(draftEx, set)) {
                if (orig) nextSets.push(orig);
                continue;
            }
            const key = setKey(origEx.instanceId, set.id);
            const weight = parseWeightKg(String(set.weight ?? ''), unit);
            const reps = parseReps(String(set.reps ?? ''));
            if (weight === 'bad') (errors[key] ||= {}).weight = true;
            if (reps === 'bad') (errors[key] ||= {}).reps = true;
            if (weight === 'bad' || reps === 'bad') continue;

            if (orig && isEditableSet(origEx, orig)) {
                // Unchanged display values keep the stored value exactly (no lb<->kg drift).
                const keepWeight = String(set.weight ?? '') === displayWeight(orig.weight, unit);
                const keepReps = String(set.reps ?? '') === String(orig.reps ?? '');
                nextSets.push(keepWeight && keepReps
                    ? orig
                    : { ...orig, weight: keepWeight ? orig.weight : (weight ?? ''), reps: keepReps ? orig.reps : reps });
            } else {
                nextSets.push({ ...set, weight: weight ?? '', reps, rpe: '', completed: true, type: 'regular' });
            }
        }
        const untouched = nextSets.length === origEx.sets.length && nextSets.every((set, i) => set === origEx.sets[i]);
        return untouched ? origEx : { ...origEx, sets: nextSets };
    });

    const hasCompleted = exercises.some(ex => (ex.sets || []).some(set => set.completed && !set.skipped));
    if (Object.keys(errors).length > 0 || !hasCompleted) {
        return { ok: false, errors, empty: !hasCompleted };
    }

    const candidate: Log = { ...original, exercises };
    const note = draft.note;
    if (note !== undefined && (note !== '' || original.note !== undefined)) candidate.note = note;

    if (sameContent(candidate, original)) return { ok: true, changed: false, log: original };
    const previousStamp = Number(original.updatedAt ?? original.endTime ?? 0) || 0;
    return { ok: true, changed: true, log: { ...candidate, updatedAt: Math.max(now, previousStamp + 1) } };
};

/** Log to write back when the user undoes a save: the original content with a newer stamp than the edit. */
export const buildUndoLog = (original: Log, edited: Log, now: number): Log => {
    const stamp = Math.max(now, Number(edited.updatedAt ?? 0) + 1);
    return { ...original, updatedAt: stamp };
};
