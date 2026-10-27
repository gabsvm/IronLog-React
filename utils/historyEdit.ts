import type { DistanceUnit, ExerciseDef, GlobalTemplate, Log, SessionExercise, WeightUnit, WorkoutSet } from '../types';
import { fromDisplayDistance, KM_PER_MI } from './strongTraining';
import { fromDisplay, toDisplay } from './units';
import { MAX_CARDIO_DISTANCE_KM } from './cardioValidation';

/**
 * Editing a finished workout (see docs/specs/history-edit.md). The draft is a
 * deep copy of the Log in which the editable sets carry weight/reps/rpe as
 * strings in the DISPLAY unit plus editable duration/distance strings;
 * buildEditedLog turns it back into a canonical (kg) Log.
 *
 * Full editor (v2): name, date/start/end/duration, session + exercise notes,
 * add/remove/reorder exercises and sets, set type, RIR and cardio/isometric
 * sets. Everything persists through the normal logs flow (setLogs ->
 * usePersistedState + cloud V2 last-writer-wins via updatedAt).
 */

export const MAX_WEIGHT_KG = 1500;
export const MAX_REPS = 1000;
export const MAX_RIR = 10;
export const MAX_DURATION_S = 24 * 3600;
export const MAX_WORKOUT_NAME = 120;
export const MAX_NOTE_LEN = 2000;

export type EditField = 'weight' | 'reps' | 'rpe' | 'duration' | 'distance' | 'type';
export type EditErrors = Record<string, Partial<Record<EditField, true>>>;
export interface MetaErrors {
    name?: true;
    date?: true;
    duration?: true;
    note?: true;
}
export type EditResult =
    | { ok: true; changed: boolean; log: Log }
    | { ok: false; errors: EditErrors; empty: boolean; metaErrors: MetaErrors };

export const SET_TYPE_OPTIONS: WorkoutSet['type'][] = [
    'regular', 'warmup', 'myorep', 'myorep_match', 'cluster', 'top', 'backoff',
    'giant', 'avt_hop', 'emom', 'drop', 'failure', 'rest_pause', 'time_volume', 'triple_add',
];

/** Strength / bodyweight sets that were really performed. Cardio and isometric holds use duration/distance. */
export const isEditableSet = (ex: SessionExercise, set: WorkoutSet): boolean =>
    !!set && !!set.completed && !set.skipped && ex.muscle !== 'CARDIO' && !ex.isIsometric;

/** Cardio sets with an editable time/distance. */
export const isCardioSetEditable = (ex: SessionExercise, set: WorkoutSet): boolean =>
    !!set && !!set.completed && !set.skipped && ex.muscle === 'CARDIO';

/** Isometric holds with an editable duration (+ optional added load). */
export const isIsoSetEditable = (ex: SessionExercise, set: WorkoutSet): boolean =>
    !!set && !!set.completed && !set.skipped && ex.muscle !== 'CARDIO' && !!ex.isIsometric;

export const setKey = (instanceId: number | string, setId: number | string): string => `${instanceId}:${setId}`;

const displayWeight = (value: unknown, unit: WeightUnit): string => {
    if (value === '' || value == null) return '';
    const n = Number(value);
    return Number.isFinite(n) ? String(toDisplay(n, unit)) : '';
};

const asText = (value: unknown): string =>
    value === '' || value == null ? '' : String(value);

/** Canonical storage is km; the draft carries the display unit (no drift for untouched sets). */
const displayDistance = (value: unknown, distanceUnit: DistanceUnit): string => {
    if (value === '' || value == null) return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    const v = distanceUnit === 'mi' ? n / KM_PER_MI : n;
    return String(Math.round(v * 10000) / 10000);
};

export const toDraft = (log: Log, unit: WeightUnit, distanceUnit: DistanceUnit = 'km'): Log => {
    const draft: Log = JSON.parse(JSON.stringify(log));
    for (const ex of draft.exercises || []) {
        ex.sets = (ex.sets || []).map(set => {
            if (isEditableSet(ex, set)) {
                return {
                    ...set,
                    weight: displayWeight(set.weight, unit),
                    reps: set.reps == null ? '' : String(set.reps),
                    rpe: set.rpe == null ? '' : String(set.rpe),
                };
            }
            if (isIsoSetEditable(ex, set)) {
                return { ...set, duration: asText(set.duration), distance: displayDistance(set.distance, distanceUnit), weight: displayWeight(set.weight, unit) };
            }
            if (isCardioSetEditable(ex, set)) {
                return { ...set, duration: asText(set.duration), distance: displayDistance(set.distance, distanceUnit) };
            }
            return set;
        });
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
        sets: ex.sets.map(set => {
            if (set.id !== setId) return set;
            if ((field === 'weight' || field === 'reps' || field === 'rpe' || field === 'type') && isEditableSet(ex, set)) {
                if (field === 'type' && !SET_TYPE_OPTIONS.some(t => t === value)) return set;
                return { ...set, [field]: value };
            }
            if (field === 'duration' && (isCardioSetEditable(ex, set) || isIsoSetEditable(ex, set))) {
                return { ...set, duration: value };
            }
            if (field === 'distance' && isCardioSetEditable(ex, set)) {
                return { ...set, distance: value };
            }
            // Isometric added load is edited through the same weight input as strength.
            if (field === 'weight' && isIsoSetEditable(ex, set)) {
                return { ...set, weight: value };
            }
            return set;
        }),
    }));

/** Convenience for the set-type picker (same as draftUpdateSet with field 'type'). */
export const draftSetSetType = (draft: Log, instanceId: number, setId: number, type: WorkoutSet['type']): Log =>
    draftUpdateSet(draft, instanceId, setId, 'type', type);

export const draftRemoveSet = (draft: Log, instanceId: number, setId: number): Log =>
    mapExercise(draft, instanceId, ex => ({
        ...ex,
        sets: ex.sets.filter(set => set.id !== setId),
    }));

const maxSetId = (draft: Log): number => {
    let max = 0;
    for (const ex of draft.exercises || []) for (const set of ex.sets || []) max = Math.max(max, Number(set.id) || 0);
    return max;
};

const maxInstanceId = (draft: Log): number => {
    let max = 0;
    for (const ex of draft.exercises || []) max = Math.max(max, Number(ex.instanceId) || 0);
    return max;
};


/** Add a completed set after the last completed one, prefilled from it. Works for strength, cardio and isometric. */
export const draftAddSet = (draft: Log, instanceId: number): Log => {
    const nextId = maxSetId(draft) + 1;
    return mapExercise(draft, instanceId, ex => {
        const sets = ex.sets || [];
        const last = [...sets].reverse().find(set => set && set.completed && !set.skipped && set.type !== 'warmup')
            ?? [...sets].reverse().find(set => set && set.completed && !set.skipped);
        const insertAt = last ? sets.lastIndexOf(last) + 1 : sets.length;
        const added: WorkoutSet = ex.muscle === 'CARDIO'
            ? {
                id: nextId, weight: '', reps: '', rpe: '', completed: true, type: 'regular',
                duration: last ? asText(last.duration) : '', distance: last ? asText(last.distance) : '',
            }
            : ex.isIsometric
              ? {
                  id: nextId, weight: last ? asText(last.weight) : '', reps: '', rpe: '', completed: true, type: 'regular',
                  duration: last ? asText(last.duration) : '',
              }
              : {
                  id: nextId, weight: last ? asText(last.weight) : '', reps: last ? asText(last.reps) : '',
                  rpe: '', completed: true, type: 'regular',
              };
        return { ...ex, sets: [...sets.slice(0, insertAt), added, ...sets.slice(insertAt)] };
    });
};

/** Move a set within its exercise by delta positions (reorder). */
export const draftMoveSet = (draft: Log, instanceId: number, setId: number, delta: 1 | -1): Log =>
    mapExercise(draft, instanceId, ex => {
        const sets = [...(ex.sets || [])];
        const from = sets.findIndex(set => set.id === setId);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= sets.length) return ex;
        const [moved] = sets.splice(from, 1);
        sets.splice(to, 0, moved);
        return { ...ex, sets };
    });

export const draftSetNote = (draft: Log, note: string): Log => ({ ...draft, note });

export const draftSetExerciseNote = (draft: Log, instanceId: number, note: string): Log =>
    mapExercise(draft, instanceId, ex => ({ ...ex, note }));

export const draftSetMeta = (
    draft: Log,
    patch: Partial<Pick<Log, 'name' | 'startTime' | 'endTime' | 'duration' | 'note'>>,
): Log => ({ ...draft, ...patch });

/** Append a library exercise to the draft with one blank completed set. */
export const draftAddExercise = (draft: Log, def: ExerciseDef): Log => {
    const instanceId = Math.max(maxInstanceId(draft) + 1, 1);
    const id = maxSetId(draft) + 1;
    const base: WorkoutSet = { id, weight: '', reps: '', rpe: '', completed: true, type: 'regular' };
    const first: WorkoutSet = def.muscle === 'CARDIO'
        ? { ...base, duration: '', distance: '' }
        : def.isIsometric
          ? { ...base, duration: '' }
          : base;
    // Structured clone keeps the ExerciseDef shape; JSON typing is what the compiler lost track of.
    const defCopy: ExerciseDef = JSON.parse(JSON.stringify(def));
    const exercise: SessionExercise = { ...defCopy, instanceId, sets: [first] };
    return { ...draft, exercises: [...(draft.exercises || []), exercise] };
};

export const draftRemoveExercise = (draft: Log, instanceId: number): Log => ({
    ...draft,
    exercises: (draft.exercises || []).filter(ex => ex.instanceId !== instanceId),
});

/** Move an exercise within the session by delta positions (reorder). */
export const draftMoveExercise = (draft: Log, instanceId: number, delta: 1 | -1): Log => {
    const list = [...(draft.exercises || [])];
    const from = list.findIndex(ex => ex.instanceId === instanceId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return draft;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    return { ...draft, exercises: list };
};

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

const parseRir = (text: string): string | 'bad' => {
    const trimmed = text.trim();
    if (trimmed === '') return '';
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > MAX_RIR) return 'bad';
    return trimmed;
};

export interface ParsedDuration { raw: string; seconds: number; }
const parseDurationInput = (text: string): ParsedDuration | null | 'bad' => {
    const trimmed = text.trim();
    if (trimmed === '') return null;
    let body = trimmed.toLowerCase();
    if (body.endsWith('s') && !body.includes(':')) body = body.slice(0, -1).trim();
    const parts = body.split(':').map(p => p.trim());
    if (parts.some(p => p === '' || !/^\d+(\.\d+)?$/.test(p))) return 'bad';
    let seconds = 0;
    if (parts.length === 1) seconds = Number(parts[0]);
    else if (parts.length === 2) seconds = Number(parts[0]) * 60 + Number(parts[1]);
    else if (parts.length === 3) seconds = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
    else return 'bad';
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_DURATION_S) return 'bad';
    return { raw: trimmed, seconds };
};

const parseDistanceKm = (text: string, distanceUnit: DistanceUnit): number | null | 'bad' => {
    const trimmed = text.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return 'bad';
    const km = fromDisplayDistance(n, distanceUnit);
    return km > MAX_CARDIO_DISTANCE_KM ? 'bad' : km;
};

/* ── date/time helpers for the meta editor (local timezone, <input type=date|time>) ── */

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const toDateInputValue = (ts: number): string => {
    const d = new Date(Number(ts) || 0);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const toTimeInputValue = (ts: number): string => {
    const d = new Date(Number(ts) || 0);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** Combine a yyyy-mm-dd date string with an hh:mm time string into epoch ms (local). Null when invalid. */
export const combineDateTime = (dateStr: string, timeStr: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return null;
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr.trim())) return null;
    const ts = new Date(`${dateStr.trim()}T${timeStr.trim()}`).getTime();
    return Number.isFinite(ts) ? ts : null;
};

/* ── save-as-template (no global changes needed: caller passes the result to setPersonalTemplates) ── */

/** Convert a finished workout into a personal (private) routine template. */
export const buildTemplateFromLog = (log: Log, now: number, uniq: string | number = ''): GlobalTemplate => {
    const stamp = Number.isFinite(now) ? now : Date.now();
    const tag = uniq === '' ? '' : `_${uniq}`;
    const title = (log.name || '').trim() || 'Session';
    const slots = (log.exercises || []).map((ex, i) => {
        const done = (ex.sets || []).filter(s => s && s.completed && !s.skipped);
        const ref = done.find(s => s.type !== 'warmup') ?? done[0];
        return {
            muscle: ex.muscle,
            setTarget: Math.max(1, done.length),
            reps: ref && ref.reps !== '' && ref.reps != null ? String(ref.reps) : '',
            exerciseId: ex.id ?? null,
            setType: ref && ref.type && ref.type !== 'regular' ? ref.type : undefined,
            label: typeof ex.name === 'string' ? ex.name : ex.name?.en,
            notes: ex.note,
            programSlotId: `slot_${stamp}_${i}${tag}`,
        };
    });
    return {
        id: `personal_${stamp}${tag}`,
        name: `personal_${stamp}${tag}`,
        title: { en: title, es: title },
        description: {
            en: 'Private template saved from your workout history.',
            es: 'Plantilla privada guardada desde tu historial.',
        },
        isPro: false,
        program: [{
            id: `day_${stamp}${tag}`,
            dayName: { en: title, es: title },
            slots,
            notes: log.note,
        }],
        order: stamp,
        scope: 'personal',
    };
};

/**
 * Validate the draft and produce the Log to persist. Weight/reps/RIR/type of
 * strength sets, duration/distance of cardio/isometric sets, set
 * removals/additions/reorders, exercise add/remove/reorder/notes and the
 * session meta (name, date, duration, note) can differ from the original;
 * everything else (id, mesoId, week, dayIdx, programSystem, importKey…)
 * is taken from the original object.
 */
export const buildEditedLog = (original: Log, draft: Log, unit: WeightUnit, now: number, distanceUnit: DistanceUnit = 'km'): EditResult => {
    const errors: EditErrors = {};
    const metaErrors: MetaErrors = {};

    // ── meta ──
    const name = String(draft.name ?? '').trim();
    if (name === '' || name.length > MAX_WORKOUT_NAME) metaErrors.name = true;
    const startTime = Number(draft.startTime);
    const endTime = Number(draft.endTime);
    if (!Number.isFinite(startTime) || startTime <= 0 || !Number.isFinite(endTime) || endTime <= 0 || startTime > endTime) {
        metaErrors.date = true;
    }
    let duration = Number(draft.duration);
    if (!Number.isFinite(duration) || duration < 0) {
        duration = (!metaErrors.date) ? Math.max(0, Math.round((endTime - startTime) / 1000)) : 0;
    }
    const note = draft.note ?? original.note ?? '';
    if (String(note).length > MAX_NOTE_LEN) metaErrors.note = true;

    // ── exercises (draft order wins, so reorder persists) ──
    const origByInstance: Record<number, SessionExercise> = {};
    for (const ex of original.exercises || []) origByInstance[ex.instanceId] = ex;
    const nextExercises: SessionExercise[] = [];

    for (const draftEx of draft.exercises || []) {
        const origEx = origByInstance[draftEx.instanceId];
        const kindSource = origEx ?? draftEx;
        const isStrength = kindSource.muscle !== 'CARDIO' && !kindSource.isIsometric;
        const isCardio = kindSource.muscle === 'CARDIO';
        const origSets: Record<number, WorkoutSet> = {};
        for (const s of origEx?.sets || []) origSets[s.id] = s;
        const nextSets: WorkoutSet[] = [];

        for (const set of draftEx.sets || []) {
            const orig = origSets[set.id];
            if (!set || !set.completed || set.skipped) {
                // Incomplete/skipped sets are preserved read-only (history never hides data).
                if (orig) nextSets.push(orig);
                else if (set) nextSets.push({ ...set });
                continue;
            }
            const key = setKey(draftEx.instanceId, set.id);

            if (isStrength) {
                const weight = parseWeightKg(asText(set.weight), unit);
                const reps = parseReps(asText(set.reps));
                const rir = parseRir(asText(set.rpe));
                const rawType = String(set.type ?? 'regular');
                const type = SET_TYPE_OPTIONS.some(t => t === rawType) ? rawType : 'bad';
                if (weight === 'bad') (errors[key] ||= {}).weight = true;
                if (reps === 'bad') (errors[key] ||= {}).reps = true;
                if (rir === 'bad') (errors[key] ||= {}).rpe = true;
                if (type === 'bad') (errors[key] ||= {}).type = true;
                if (weight === 'bad' || reps === 'bad' || rir === 'bad' || type === 'bad') continue;
                if (orig && origEx && isEditableSet(origEx, orig)) {
                    const keepWeight = asText(set.weight) === displayWeight(orig.weight, unit);
                    const keepReps = asText(set.reps) === String(orig.reps ?? '');
                    const keepRir = asText(set.rpe) === String(orig.rpe ?? '');
                    const keepType = rawType === (orig.type || 'regular');
                    nextSets.push(keepWeight && keepReps && keepRir && keepType
                        ? orig
                        : {
                            ...orig,
                            weight: keepWeight ? orig.weight : (weight ?? ''),
                            reps: keepReps ? orig.reps : (reps as number),
                            rpe: keepRir ? orig.rpe : (rir as string),
                            type: rawType as WorkoutSet['type'],
                        });
                } else {
                    nextSets.push({
                        ...set, weight: weight ?? '', reps: reps as number, rpe: rir as string,
                        completed: true, type: rawType as WorkoutSet['type'],
                    });
                }
            } else if (isCardio) {
                const durationParsed = parseDurationInput(asText(set.duration));
                const distance = parseDistanceKm(asText(set.distance), distanceUnit);
                if (durationParsed === 'bad') (errors[key] ||= {}).duration = true;
                if (distance === 'bad') (errors[key] ||= {}).distance = true;
                if (durationParsed === null && distance === null) (errors[key] ||= {}).duration = true;
                if (durationParsed === 'bad' || distance === 'bad' || (durationParsed === null && distance === null)) continue;
                const normDuration = durationParsed === null ? '' : (/:/.test(durationParsed.raw) ? durationParsed.raw : durationParsed.seconds);
                const normDistance = distance ?? '';
                if (orig) {
                    const keepDur = asText(set.duration) === asText(orig.duration);
                    const keepDist = asText(set.distance) === displayDistance(orig.distance, distanceUnit);
                    nextSets.push(keepDur && keepDist ? orig : { ...orig, duration: keepDur ? orig.duration : normDuration, distance: keepDist ? orig.distance : normDistance });
                } else {
                    nextSets.push({ ...set, duration: normDuration, distance: normDistance, completed: true, type: 'regular', weight: '', reps: '', rpe: '' });
                }
            } else {
                // Isometric: duration + optional added load.
                const durationParsed = parseDurationInput(asText(set.duration));
                const weight = parseWeightKg(asText(set.weight), unit);
                if (durationParsed === 'bad' || durationParsed === null) (errors[key] ||= {}).duration = true;
                if (weight === 'bad') (errors[key] ||= {}).weight = true;
                if (durationParsed === 'bad' || durationParsed === null || weight === 'bad') continue;
                const normDuration = /:/.test(durationParsed.raw) ? durationParsed.raw : durationParsed.seconds;
                if (orig) {
                    const keepDur = asText(set.duration) === asText(orig.duration);
                    const keepWeight = asText(set.weight) === displayWeight(orig.weight, unit);
                    nextSets.push(keepDur && keepWeight
                        ? orig
                        : {
                            ...orig,
                            duration: keepDur ? orig.duration : normDuration,
                            weight: keepWeight ? orig.weight : (weight ?? ''),
                        });
                } else {
                    nextSets.push({ ...set, duration: normDuration, weight: weight ?? '', completed: true, type: 'regular', reps: '', rpe: '' });
                }
            }
        }

        const draftNote = draftEx.note ?? '';
        if (!origEx) {
            // New exercise from the picker: keep def fields, drop it when it ended up set-less.
            if (nextSets.length === 0) continue;
            nextSets.forEach(s => { if (s.rpe === undefined) s.rpe = ''; });
            nextExercises.push({ ...draftEx, sets: nextSets });
            continue;
        }
        const setsUntouched = nextSets.length === origEx.sets.length && nextSets.every((set, i) => set === origEx.sets[i]);
        const noteUntouched = (draftNote || '') === (origEx.note || '');
        nextExercises.push(setsUntouched && noteUntouched ? origEx : { ...origEx, sets: nextSets, note: draftNote || undefined });
    }

    const hasCompleted = nextExercises.some(ex => (ex.sets || []).some(set => set && set.completed && !set.skipped));
    if (Object.keys(errors).length > 0 || Object.keys(metaErrors).length > 0 || !hasCompleted) {
        return { ok: false, errors, empty: !hasCompleted, metaErrors };
    }

    const candidate: Log = {
        ...original,
        name,
        startTime,
        endTime,
        duration,
        exercises: nextExercises,
    };
    if (note !== '' || original.note !== undefined) candidate.note = String(note);

    if (JSON.stringify(candidate) === JSON.stringify(original)) return { ok: true, changed: false, log: original };
    const previousStamp = Number(original.updatedAt ?? original.endTime ?? 0) || 0;
    return { ok: true, changed: true, log: { ...candidate, updatedAt: Math.max(now, previousStamp + 1) } };
};

/** Log to write back when the user undoes a save: the original content with a newer stamp than the edit. */
export const buildUndoLog = (original: Log, edited: Log, now: number): Log => {
    const stamp = Math.max(now, Number(edited.updatedAt ?? 0) + 1);
    return { ...original, updatedAt: stamp };
};
