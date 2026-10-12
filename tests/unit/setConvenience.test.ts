import { describe, it, expect } from 'vitest';
import type { WorkoutSet } from '../../types';
import { canFillFromPrevious, copySourceIndex, copyToFollowing, fillFromPrevious, restoreSet } from '../../utils/setConvenience';

let n = 0;
const set = (patch: Partial<WorkoutSet> = {}): WorkoutSet => ({
    id: ++n, weight: '', reps: '', rpe: '', completed: false, type: 'regular', ...patch,
});

describe('fillFromPrevious', () => {
    it('fills open sets from prev values and never touches completed or skipped sets', () => {
        const done = set({ completed: true, weight: 50, reps: 5, prevWeight: 100, prevReps: 10 });
        const skipped = set({ skipped: true, prevWeight: 100, prevReps: 10 });
        const open = set({ prevWeight: 100, prevReps: 8, rpe: 9, type: 'top' });
        const out = fillFromPrevious([done, skipped, open]);
        expect(out[0]).toBe(done);
        expect(out[1]).toBe(skipped);
        expect(out[2]).toMatchObject({ weight: 100, reps: 8, rpe: 9, type: 'top', completed: false });
    });

    it('keeps typed values where history has a blank and reports availability', () => {
        const a = set({ weight: 60, prevReps: 12 });
        expect(fillFromPrevious([a])[0]).toMatchObject({ weight: 60, reps: 12 });
        expect(canFillFromPrevious([set()])).toBe(false);
        expect(canFillFromPrevious([a])).toBe(true);
        expect(canFillFromPrevious([set({ completed: true, prevReps: 5 })])).toBe(false);
    });
});

describe('copyToFollowing', () => {
    it('finds the last completed set with open sets after it and copies weight/reps only', () => {
        const sets = [
            set({ completed: true, weight: 100, reps: 10 }),
            set({ completed: true, weight: 105, reps: 8, rpe: 9 }),
            set({ weight: 90, reps: 12, type: 'backoff' }),
            set({ completed: true, weight: 1, reps: 1 }),
            set(),
        ];
        const src = copySourceIndex(sets);
        expect(src).toBe(3);
        const out = copyToFollowing(sets, 1);
        expect(out[0]).toBe(sets[0]);
        expect(out[1]).toBe(sets[1]);
        expect(out[2]).toMatchObject({ weight: 105, reps: 8, type: 'backoff', rpe: '' });
        expect(out[3]).toBe(sets[3]);
        expect(out[4]).toMatchObject({ weight: 105, reps: 8, completed: false });
    });

    it('offers nothing when no completed set precedes an open one', () => {
        expect(copySourceIndex([set(), set()])).toBe(-1);
        expect(copySourceIndex([set(), set({ completed: true, reps: 5 })])).toBe(-1);
    });
});

describe('restoreSet', () => {
    it('reinserts at the original index, clamps, and is idempotent', () => {
        const [a, b, c] = [set(), set(), set()];
        expect(restoreSet([a, c], b, 1).map(s => s.id)).toEqual([a.id, b.id, c.id]);
        expect(restoreSet([a], b, 9).map(s => s.id)).toEqual([a.id, b.id]);
        expect(restoreSet([a, b], b, 0).map(s => s.id)).toEqual([a.id, b.id]);
    });
});
