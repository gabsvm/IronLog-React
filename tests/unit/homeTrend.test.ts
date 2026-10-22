import { describe, expect, it } from 'vitest';
import { homeStrengthTrend } from '../../views/home/homeTrend';
import type { Log, SessionExercise, WorkoutSet } from '../../types';

const now = new Date('2026-10-21T12:00:00Z').getTime();
const day = 86400000;
const set = (weight: number, overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({ id: weight, weight, reps: 8, rpe: '', completed: true, type: 'regular', ...overrides });
const log = (id: number, ago: number, sets: WorkoutSet[], exercise: Partial<SessionExercise> = {}, overrides: Partial<Log> = {}): Log => ({ id, dayIdx: 0, name: 'Upper', startTime: now - ago * day - 1800000, endTime: now - ago * day, duration: 1800, mesoId: 7, week: 1, exercises: [{ id: 'press', instanceId: 1, name: { es: 'Press', en: 'Press' }, muscle: 'CHEST', sets, ...exercise }], ...overrides });

describe('Home load trend', () => {
    it('uses real same-exercise working-set maxima in chronological order', () => {
        const result = homeStrengthTrend([log(2, 1, [set(70), set(200, { type: 'warmup' }), set(90, { skipped: true }), set(85, { completed: false })]), log(1, 10, [set(50), set(60)])], 7, now);
        expect(result?.points).toEqual([{ date: now - 10 * day, weightKg: 60 }, { date: now - day, weightKg: 70 }]);
    });
    it('does not mix exercises, plans, protocols or expired/future/skipped sessions', () => {
        const recent = log(1, 1, [set(60)]);
        const invalid = [log(2, 60, [set(70)]), log(3, -1, [set(70)]), log(4, 2, [set(70)], {}, { mesoId: 8 }), log(5, 2, [set(70)], {}, { skipped: true }), log(6, 2, [set(70)], { id: 'row' }), log(7, 2, [set(70)], { isBodyweight: true }), log(8, 2, [set(70)], { isIsometric: true }), log(9, 2, [set(70)], { muscle: 'CARDIO' }), log(10, 2, [set(70)], { volumeCountingMode: 'per_side' }), log(11, 2, [set(70, { type: 'time_volume' })])];
        expect(homeStrengthTrend([recent, ...invalid], 7, now)).toBeNull();
    });
    it('returns a genuine empty state without two comparable observations', () => {
        expect(homeStrengthTrend([], 7, now)).toBeNull();
        expect(homeStrengthTrend([log(1, 1, [set(60)])], 7, now)).toBeNull();
    });
    it('deduplicates repeated exercise instances within one session and caps the chart at eight sessions', () => {
        const logs = Array.from({ length: 10 }, (_, index) => log(index, index + 1, [set(50 + index)]));
        logs[0].exercises.push({ ...logs[0].exercises[0], instanceId: 2, sets: [set(90)] });
        const result = homeStrengthTrend(logs, 7, now);
        expect(result?.points).toHaveLength(8);
        expect(result?.points[result.points.length - 1].weightKg).toBe(90);
    });
});
