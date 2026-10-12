import { describe, it, expect } from 'vitest';
import type { WorkoutSet } from '../../types';
import { getVolumeComparison } from '../../utils/volumeComparison';

const set = (patch: Partial<WorkoutSet>): WorkoutSet => ({
    id: 1, weight: '', reps: '', rpe: '', completed: true, type: 'regular', ...patch,
});

const prev = [set({ weight: 100, reps: 10 }), set({ weight: 100, reps: 8 })]; // 1800

describe('getVolumeComparison', () => {
    it('compares weight x reps of completed working sets against last time', () => {
        const cur = [set({ weight: 100, reps: 10 }), set({ weight: 105, reps: 8 }), set({ completed: false, weight: 200, reps: 10 })];
        expect(getVolumeComparison(cur, prev, {})).toEqual({ kind: 'volume', current: 1840, previous: 1800, delta: 40 });
    });

    it('ignores warmups and skipped sets on both sides', () => {
        const cur = [set({ type: 'warmup', weight: 60, reps: 10 }), set({ skipped: true, weight: 100, reps: 10 }), set({ weight: 50, reps: 10 })];
        const p = [...prev, set({ type: 'warmup', weight: 40, reps: 10 })];
        expect(getVolumeComparison(cur, p, {})).toMatchObject({ current: 500, previous: 1800, delta: -1300 });
    });

    it('has no delta until a working set is completed', () => {
        const cur = [set({ completed: false, weight: 100, reps: 10 })];
        expect(getVolumeComparison(cur, prev, {})).toMatchObject({ current: 0, previous: 1800, delta: null });
    });

    it('uses total reps for bodyweight exercises', () => {
        const p = [set({ reps: 10 }), set({ reps: 8 })];
        const cur = [set({ reps: 12 })];
        expect(getVolumeComparison(cur, p, { isBodyweight: true })).toEqual({ kind: 'reps', current: 12, previous: 18, delta: -6 });
    });

    it('returns null without usable history or for isometric/cardio work', () => {
        expect(getVolumeComparison(prev, null, {})).toBeNull();
        expect(getVolumeComparison(prev, [set({ completed: false, weight: 100, reps: 10 })], {})).toBeNull();
        expect(getVolumeComparison(prev, [set({ weight: 0, reps: 10 })], {})).toBeNull();
        expect(getVolumeComparison(prev, prev, { isIsometric: true })).toBeNull();
        expect(getVolumeComparison(prev, prev, { isCardio: true })).toBeNull();
    });

    it('tolerates string inputs and blanks', () => {
        const cur = [set({ weight: '100', reps: '10' }), set({ weight: '', reps: '' })];
        expect(getVolumeComparison(cur, prev, {})).toMatchObject({ current: 1000, delta: -800 });
    });
});
