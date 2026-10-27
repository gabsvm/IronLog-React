import { describe, it, expect } from 'vitest';
import type { ExerciseDef, Log, SessionExercise, WorkoutSet } from '../../types';
import {
    buildEditedLog,
    buildTemplateFromLog,
    combineDateTime,
    draftAddExercise,
    draftMoveExercise,
    draftMoveSet,
    draftRemoveExercise,
    draftSetExerciseNote,
    draftSetMeta,
    draftSetNote,
    draftUpdateSet,
    toDateInputValue,
    toDraft,
    toTimeInputValue,
} from '../../utils/historyEdit';
import { toDisplay } from '../../utils/units';

const START = 1_700_000_000_000;
const set = (id: number, patch: Partial<WorkoutSet> = {}): WorkoutSet =>
    ({ id, weight: 100, reps: 5, rpe: '2', completed: true, type: 'regular', ...patch });
const ex = (instanceId: number, sets: WorkoutSet[], patch: Partial<SessionExercise> = {}): SessionExercise =>
    ({ id: `e${instanceId}`, instanceId, name: `Ex ${instanceId}`, muscle: 'CHEST', sets, ...patch } as SessionExercise);
const log = (): Log => ({
    id: 7, dayIdx: 1, name: 'Push', startTime: START, endTime: START + 3_600_000, duration: 3600,
    mesoId: 3, week: 2, exercises: [ex(1, [set(1), set(2)]), ex(2, [set(10)])],
});
const edit = (original: Log, mutate: (draft: Log) => Log, now = START + 9_000_000) => {
    const res = buildEditedLog(original, mutate(toDraft(original, 'kg')), 'kg', now);
    if (!res.ok) throw new Error(`expected ok, got ${JSON.stringify(res)}`);
    return res;
};

describe('history full editor: session meta', () => {
    it('renames the workout with a monotonic stamp', () => {
        const original = log();
        const res = buildEditedLog(original, draftSetMeta(toDraft(original, 'kg'), { name: 'Pull' }), 'kg', 9000);
        if (!res.ok) throw new Error('expected ok');
        expect(res.changed).toBe(true);
        expect(res.log.name).toBe('Pull');
        expect(res.log.updatedAt).toBe(original.endTime + 1);
    });

    it('rejects an empty or overlong name', () => {
        const original = log();
        for (const bad of ['', '   ', 'x'.repeat(121)]) {
            const res = buildEditedLog(original, draftSetMeta(toDraft(original, 'kg'), { name: bad }), 'kg', START);
            if (!('metaErrors' in res)) throw new Error('expected failure');
            expect(res.metaErrors.name).toBe(true);
        }
    });

    it('rejects an end before the start', () => {
        const original = log();
        const res = buildEditedLog(
            original,
            draftSetMeta(toDraft(original, 'kg'), { startTime: START + 5000, endTime: START }),
            'kg', START,
        );
        expect(res.ok).toBe(false);
        if (!('metaErrors' in res)) throw new Error('expected failure');
        expect(res.metaErrors.date).toBe(true);
    });

    it('shifts start/end together and keeps the explicit duration', () => {
        const original = log();
        const res = edit(original, d => draftSetMeta(d, { startTime: START + 60_000, endTime: START + 3_660_000 }));
        expect(res.log.startTime).toBe(START + 60_000);
        expect(res.log.endTime).toBe(START + 3_660_000);
        expect(res.log.duration).toBe(3600);
    });

    it('derives the duration when it is missing', () => {
        const original = log();
        const res = edit(original, d => draftSetMeta(d, { duration: Number.NaN }));
        expect(res.log.duration).toBe(3600);
    });
});

describe('history full editor: RIR and set type', () => {
    it('saves RIR and set-type changes', () => {
        const original = log();
        const res = edit(original, d => draftUpdateSet(draftUpdateSet(d, 1, 1, 'rpe', '1'), 1, 1, 'type', 'warmup'));
        expect(res.log.exercises[0].sets[0]).toMatchObject({ rpe: '1', type: 'warmup' });
        expect(res.log.exercises[0].sets[1]).toBe(original.exercises[0].sets[1]);
    });

    it('rejects out-of-range RIR and unknown set types', () => {
        const original = log();
        const badRir = buildEditedLog(original, draftUpdateSet(toDraft(original, 'kg'), 1, 1, 'rpe', '11'), 'kg', START);
        if (!('errors' in badRir)) throw new Error('expected failure');
        expect(badRir.errors['1:1']).toEqual({ rpe: true });
        const draft = toDraft(original, 'kg');
        draft.exercises[0].sets[0].type = 'bogus' as unknown as WorkoutSet['type']; // invalid on purpose: save must flag it
        const badType = buildEditedLog(original, draft, 'kg', START);
        if (!('errors' in badType)) throw new Error('expected failure');
        expect(badType.errors['1:1']).toEqual({ type: true });
    });
});

describe('history full editor: exercises', () => {
    const squat: ExerciseDef = { id: 'sq', name: 'Squat', muscle: 'QUADS' };

    it('adds a picked exercise and saves it once its set is filled', () => {
        const original = log();
        let draft = draftAddExercise(toDraft(original, 'kg'), squat);
        expect(draft.exercises).toHaveLength(3);
        const addedId = draft.exercises[2].sets[0].id;
        draft = draftUpdateSet(draftUpdateSet(draft, 3, addedId, 'weight', '80'), 3, addedId, 'reps', '8');
        const res = edit(original, () => draft);
        expect(res.log.exercises[2]).toMatchObject({ id: 'sq', muscle: 'QUADS' });
        expect(res.log.exercises[2].sets[0]).toMatchObject({ weight: 80, reps: 8, completed: true });
    });

    it('refuses a blank added exercise set', () => {
        const original = log();
        const res = buildEditedLog(original, draftAddExercise(toDraft(original, 'kg'), squat), 'kg', START);
        expect(res.ok).toBe(false);
    });

    it('removes an exercise, reorders them and saves exercise notes', () => {
        const original = log();
        const removed = edit(original, d => draftRemoveExercise(d, 2));
        expect(removed.log.exercises.map(e => e.instanceId)).toEqual([1]);

        const moved = edit(original, d => draftMoveExercise(d, 2, -1));
        expect(moved.changed).toBe(true);
        expect(moved.log.exercises.map(e => e.instanceId)).toEqual([2, 1]);

        const noted = edit(original, d => draftSetExerciseNote(d, 1, 'felt strong'));
        expect(noted.log.exercises[0].note).toBe('felt strong');
        expect(noted.log.exercises[1]).toBe(original.exercises[1]);
    });

    it('refuses to remove every exercise', () => {
        const original = log();
        const res = buildEditedLog(
            original,
            draftRemoveExercise(draftRemoveExercise(toDraft(original, 'kg'), 1), 2),
            'kg', START,
        );
        expect(res).toMatchObject({ ok: false, empty: true });
    });
});

describe('history full editor: sets', () => {
    it('reorders sets within an exercise', () => {
        const original = log();
        const res = edit(original, d => draftMoveSet(d, 1, 1, 1));
        expect(res.log.exercises[0].sets.map(s => s.id)).toEqual([2, 1]);
        expect(res.log.exercises[0].sets[0]).toBe(original.exercises[0].sets[1]);
    });

    it('preserves incomplete and skipped sets read-only without hiding them', () => {
        const original: Log = {
            ...log(),
            exercises: [ex(1, [set(1), set(2, { completed: false, weight: '', reps: '' }), set(3, { skipped: true })])],
        };
        const res = buildEditedLog(original, toDraft(original, 'kg'), 'kg', START);
        expect(res).toEqual({ ok: true, changed: false, log: original });
    });
});

describe('history full editor: cardio and isometric', () => {
    const run: ExerciseDef = { id: 'run', name: 'Run', muscle: 'CARDIO' };

    it('requires time or distance on a cardio set', () => {
        const original = log();
        const res = buildEditedLog(original, draftAddExercise(toDraft(original, 'kg'), run), 'kg', START);
        if (!('errors' in res)) throw new Error('expected failure');
        expect(res.errors['3:11']?.duration).toBe(true);
    });

    it('rejects bad cardio inputs', () => {
        const original = log();
        let draft = draftAddExercise(toDraft(original, 'kg'), run);
        draft = draftUpdateSet(draftUpdateSet(draft, 3, 11, 'duration', 'abc'), 3, 11, 'distance', '-3');
        const res = buildEditedLog(original, draft, 'kg', START);
        if (!('errors' in res)) throw new Error('expected failure');
        expect(res.errors['3:11']).toEqual({ duration: true, distance: true });
    });

    it('edits isometric duration and added load', () => {
        const original: Log = {
            ...log(),
            exercises: [ex(3, [set(20, { duration: 60, weight: '', reps: '', rpe: '' })], { isIsometric: true })],
        };
        const res = edit(original, d => draftUpdateSet(draftUpdateSet(d, 3, 20, 'duration', '90'), 3, 20, 'weight', '10'));
        expect(res.log.exercises[0].sets[0]).toMatchObject({ duration: 90, weight: 10 });
    });

    it('requires a duration on isometric sets', () => {
        const original: Log = {
            ...log(),
            exercises: [ex(3, [set(20, { duration: 60, weight: '', reps: '', rpe: '' })], { isIsometric: true })],
        };
        const res = buildEditedLog(original, draftUpdateSet(toDraft(original, 'kg'), 3, 20, 'duration', ''), 'kg', START);
        if (!('errors' in res)) throw new Error('expected failure');
        expect(res.errors['3:20']?.duration).toBe(true);
    });
});

describe('history full editor: template and date helpers', () => {
    it('builds a private template from a log', () => {
        const tpl = buildTemplateFromLog(log(), START);
        expect(tpl.id).toBe(`personal_${START}`);
        expect(tpl.scope).toBe('personal');
        expect(tpl.title).toEqual({ en: 'Push', es: 'Push' });
        expect(tpl.program).toHaveLength(1);
        expect(tpl.program[0].slots).toHaveLength(2);
        expect(tpl.program[0].slots[0]).toMatchObject({ muscle: 'CHEST', setTarget: 2, reps: '5', exerciseId: 'e1' });
    });

    it('round-trips date and time inputs through the local timezone', () => {
        const ts = new Date(2024, 0, 15, 18, 30, 45).getTime();
        expect(toDateInputValue(ts)).toBe('2024-01-15');
        expect(toTimeInputValue(ts)).toBe('18:30');
        expect(combineDateTime('2024-01-15', '18:30')).toBe(new Date(2024, 0, 15, 18, 30).getTime());
        expect(combineDateTime('nope', '18:30')).toBeNull();
    });
});

describe('history full editor: distance unit', () => {
    const run: ExerciseDef = { id: 'run', name: 'Run', muscle: 'CARDIO' };
    const runLog = (distance: number | string): Log => ({
        ...log(),
        exercises: [ex(3, [set(20, { duration: '20:00', weight: '', reps: '', rpe: '', distance })], { muscle: 'CARDIO' })],
    });

    it('shows stored km as miles in the draft without drift on save', () => {
        const original = runLog(1.609344);
        const draft = toDraft(original, 'kg', 'mi');
        expect(draft.exercises[0].sets[0].distance).toBe('1');
        const res = buildEditedLog(original, draft, 'kg', START, 'mi');
        expect(res).toEqual({ ok: true, changed: false, log: original });
    });

    it('converts entered miles back to canonical km', () => {
        const original = runLog('');
        let draft = draftAddExercise(toDraft(original, 'kg', 'mi'), run);
        draft = draftUpdateSet(draftUpdateSet(draft, 4, 21, 'duration', '30:00'), 4, 21, 'distance', '3');
        const res = buildEditedLog(original, draft, 'kg', START, 'mi');
        if (!res.ok) throw new Error('expected ok');
        expect(res.log.exercises[1].sets[0].distance).toBeCloseTo(4.828, 3);
    });

    it('validates the canonical km limit, not the display value', () => {
        const original = runLog('');
        let draft = draftAddExercise(toDraft(original, 'kg', 'mi'), run);
        draft = draftUpdateSet(draftUpdateSet(draft, 4, 21, 'duration', '30:00'), 4, 21, 'distance', '700');
        const res = buildEditedLog(original, draft, 'kg', START, 'mi');
        expect(res.ok).toBe(false);
        if (!('errors' in res)) throw new Error('expected failure');
        expect(res.errors['4:21']?.distance).toBe(true);
    });
});

describe('history P1 fixes (DataReview)', () => {
    const isoLog = (): Log => ({
        ...log(),
        exercises: [ex(3, [set(20, { duration: 60, weight: 10, reps: '', rpe: '' })], { isIsometric: true })],
    });

    it('does not corrupt isometric added load when saving unrelated changes in lb', () => {
        const original = isoLog();
        const draft = toDraft(original, 'lb');
        expect(draft.exercises[0].sets[0].weight).toBe(String(toDisplay(10, 'lb')));
        const res = buildEditedLog(original, draftSetNote(draft, 'only a note'), 'lb', START);
        if (!res.ok) throw new Error('expected ok');
        expect(res.changed).toBe(true);
        expect(res.log.note).toBe('only a note');
        expect(res.log.exercises[0].sets[0].weight).toBe(10);
        expect(res.log.exercises[0].sets[0]).toBe(original.exercises[0].sets[0]);
    });

    it('round-trips failure sets without blocking the save', () => {
        const original: Log = {
            ...log(),
            exercises: [ex(1, [set(1, { type: 'failure' }), set(2)])],
        };
        const untouched = buildEditedLog(original, toDraft(original, 'kg'), 'kg', START);
        expect(untouched).toEqual({ ok: true, changed: false, log: original });
        const res = buildEditedLog(original, draftSetNote(toDraft(original, 'kg'), 'hard day'), 'kg', START);
        if (!res.ok) throw new Error('expected ok');
        expect(res.changed).toBe(true);
        expect(res.log.exercises[0].sets[0].type).toBe('failure');
    });

    it('generates unique template ids per call', () => {
        const a = buildTemplateFromLog(log(), START, 101);
        const b = buildTemplateFromLog(log(), START, 102);
        expect(a.id).toBe(`personal_${START}_101`);
        expect(a.id).not.toBe(b.id);
        expect(a.program[0].id).not.toBe(b.program[0].id);
        expect(buildTemplateFromLog(log(), START).id).toBe(`personal_${START}`);
    });
});
