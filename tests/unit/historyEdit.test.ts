import { describe, it, expect } from 'vitest';
import type { Log, SessionExercise, WorkoutSet } from '../../types';
import { buildEditedLog, buildUndoLog, draftAddSet, draftRemoveSet, draftSetNote, draftUpdateSet, setKey, toDraft } from '../../utils/historyEdit';

const set = (id: number, patch: Partial<WorkoutSet> = {}): WorkoutSet => ({ id, weight: 100, reps: 5, rpe: 8, completed: true, type: 'regular', ...patch });
const ex = (instanceId: number, sets: WorkoutSet[], patch: Partial<SessionExercise> = {}): SessionExercise =>
    ({ id: `e${instanceId}`, instanceId, name: 'x', muscle: 'CHEST', sets, ...patch } as any);
const log = (): Log => ({
    id: 7, dayIdx: 1, name: 'Push', startTime: 1000, endTime: 5000, duration: 4000, mesoId: 3, week: 2, note: 'old',
    exercises: [
        ex(1, [set(1), set(2, { weight: 102.5, reps: 6 }), set(3, { completed: false }), set(4, { type: 'warmup', weight: 40 })]),
        ex(2, [set(10, { duration: 60, weight: '' })], { isIsometric: true }),
        ex(3, [set(20, { duration: '20:00', weight: '', reps: '' })], { muscle: 'CARDIO' }),
    ],
});

describe('buildEditedLog', () => {
    it('returns the original untouched (no stamp bump) when nothing changed, in kg and lb', () => {
        for (const unit of ['kg', 'lb'] as const) {
            const original = log();
            const res = buildEditedLog(original, toDraft(original, unit), unit, 9999);
            expect(res).toEqual({ ok: true, changed: false, log: original });
        }
    });

    it('edits weight/reps, bumps updatedAt past the previous stamp, and leaves everything else identical', () => {
        const original = log();
        let draft = toDraft(original, 'kg');
        draft = draftUpdateSet(draft, 1, 1, 'weight', '105');
        draft = draftUpdateSet(draft, 1, 1, 'reps', '4');
        draft = draftSetNote(draft, 'fixed');
        const res = buildEditedLog(original, draft, 'kg', 4000); // clock behind endTime
        if (!res.ok) throw new Error('expected ok');
        expect(res.changed).toBe(true);
        const edited = res.log;
        expect(edited.updatedAt).toBe(5001);
        expect(edited.note).toBe('fixed');
        expect(edited.exercises[0].sets[0]).toMatchObject({ id: 1, weight: 105, reps: 4, rpe: 8, completed: true });
        expect(edited.exercises[0].sets[1]).toBe(original.exercises[0].sets[1]);
        expect(edited.exercises[0].sets[2]).toBe(original.exercises[0].sets[2]);
        expect(edited.exercises[1]).toBe(original.exercises[1]);
        expect(edited.exercises[2]).toBe(original.exercises[2]);
        const { exercises: _a, note: _b, updatedAt: _c, ...restEdited } = edited;
        const { exercises: _d, note: _e, ...restOrig } = original;
        expect(restEdited).toEqual(restOrig);
    });

    it('converts lb input to kg only for sets that changed', () => {
        const original = log();
        let draft = toDraft(original, 'lb');
        expect(draft.exercises[0].sets[0].weight).toBe('220.5'); // 100 kg shown in lb
        draft = draftUpdateSet(draft, 1, 2, 'weight', '225');
        const res = buildEditedLog(original, draft, 'lb', 9000);
        if (!res.ok) throw new Error('expected ok');
        expect(res.log.exercises[0].sets[0].weight).toBe(100); // untouched, no drift
        expect(res.log.exercises[0].sets[1].weight).toBeCloseTo(102.0583, 3); // 225 lb
    });

    it('rejects invalid weight/reps with per-field errors and does not return a log', () => {
        const original = log();
        let draft = toDraft(original, 'kg');
        draft = draftUpdateSet(draft, 1, 1, 'weight', '-5');
        draft = draftUpdateSet(draft, 1, 2, 'reps', '0');
        draft = draftUpdateSet(draft, 1, 2, 'weight', '99999');
        const res = buildEditedLog(original, draft, 'kg', 9000);
        if (!('errors' in res)) throw new Error('expected failure'); // tsconfig is not strict: no boolean-literal narrowing
        expect(res.errors[setKey(1, 1)]).toEqual({ weight: true });
        expect(res.errors[setKey(1, 2)]).toEqual({ weight: true, reps: true });
        const frac = buildEditedLog(original, draftUpdateSet(toDraft(original, 'kg'), 1, 1, 'reps', '5.5'), 'kg', 9000);
        expect(frac.ok).toBe(false);
    });

    it('allows blank weight (bodyweight) and removes / adds sets', () => {
        const original = log();
        let draft = toDraft(original, 'kg');
        draft = draftUpdateSet(draft, 1, 1, 'weight', '');
        draft = draftRemoveSet(draft, 1, 2);
        draft = draftAddSet(draft, 1);
        const res = buildEditedLog(original, draft, 'kg', 9000);
        if (!res.ok) throw new Error('expected ok');
        const sets = res.log.exercises[0].sets;
        expect(sets[0]).toMatchObject({ id: 1, weight: '' });
        expect(sets.find(s => s.id === 2)).toBeUndefined();
        const added = sets.find(s => s.id === 21)!; // max id in the whole log (20) + 1
        expect(added).toMatchObject({ weight: '', reps: 5, completed: true, type: 'regular', rpe: '' });
        expect(sets.findIndex(s => s.id === 21)).toBeGreaterThan(sets.findIndex(s => s.id === 1));
        expect(sets.some(s => s.id === 3) && sets.some(s => s.id === 4)).toBe(true); // untouched sets survive
    });

    it('refuses to leave a workout with no completed sets', () => {
        const original: Log = { ...log(), exercises: [ex(1, [set(1)])] };
        const draft = draftRemoveSet(toDraft(original, 'kg'), 1, 1);
        expect(buildEditedLog(original, draft, 'kg', 9000)).toMatchObject({ ok: false, empty: true });
    });

    it('does not edit or add sets on cardio / isometric exercises', () => {
        const original = log();
        let draft = toDraft(original, 'kg');
        draft = draftUpdateSet(draft, 2, 10, 'reps', '9');
        draft = draftRemoveSet(draft, 3, 20);
        draft = draftAddSet(draft, 3);
        const res = buildEditedLog(original, draft, 'kg', 9000);
        expect(res).toEqual({ ok: true, changed: false, log: original });
    });

    it('undo restores the original content with a newer stamp than the edit', () => {
        const original = log();
        const res = buildEditedLog(original, draftSetNote(toDraft(original, 'kg'), 'x'), 'kg', 9000);
        if (!res.ok) throw new Error('expected ok');
        const undone = buildUndoLog(original, res.log, 8000);
        expect(undone.updatedAt).toBe(9001);
        expect({ ...undone, updatedAt: undefined }).toEqual({ ...original, updatedAt: undefined });
    });
});
