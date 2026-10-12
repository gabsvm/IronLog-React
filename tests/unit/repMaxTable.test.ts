import { describe, it, expect } from 'vitest';
import type { Log } from '../../types';
import { computeRepMaxTable } from '../../utils/repMaxTable';

const log = (endTime: number, sets: any[], id = 'bench', extra: Partial<Log> = {}): Log => ({
    id: endTime, dayIdx: 0, name: 'x', startTime: endTime - 1, endTime, duration: 1, mesoId: 1, week: 1,
    exercises: [{ id, instanceId: 1, sets } as any], ...extra,
});
const s = (weight: number, reps: number, extra: any = {}) => ({ id: 1, weight, reps, rpe: '', completed: true, type: 'regular', ...extra });
const ids = new Set(['bench']);

describe('computeRepMaxTable', () => {
    it('returns [] without qualifying history', () => {
        expect(computeRepMaxTable([], ids)).toEqual([]);
        expect(computeRepMaxTable([log(1, [s(100, 5, { completed: false })])], ids)).toEqual([]);
        expect(computeRepMaxTable([log(1, [s(100, 5)], 'other')], ids)).toEqual([]);
    });

    it('picks the heaviest set per exact rep count, recent wins ties, ignores warmups/skipped/13+ reps', () => {
        const rows = computeRepMaxTable([
            log(10, [s(100, 5), s(60, 5, { type: 'warmup' }), s(200, 5, { skipped: true }), s(50, 20)]),
            log(20, [s(100, 5), s(90, 8)]),
            log(30, [s(150, 5)], 'bench', { skipped: true }),
        ], ids);
        expect(rows).toHaveLength(12);
        expect(rows[4]).toMatchObject({ reps: 5, actualWeight: 100, actualDate: 20 });
        expect(rows[7]).toMatchObject({ reps: 8, actualWeight: 90 });
        expect(rows[0].actualWeight).toBeNull();
        expect(rows[11].actualWeight).toBeNull();
    });

    it('predicts from the best Epley 1RM so it matches the 1RM shown elsewhere', () => {
        const rows = computeRepMaxTable([log(1, [s(100, 5)])], ids); // 1RM = 100 * (1 + 5/30) = 116.67
        expect(rows[0].predictedWeight).toBeCloseTo(116.667, 2);
        expect(rows[4].predictedWeight).toBeCloseTo(100, 5);
        expect(rows[9].predictedWeight).toBeCloseTo(87.5, 2);
    });

    it('merges history across an exercise id group', () => {
        const rows = computeRepMaxTable([log(1, [s(80, 10)], 'bench'), log(2, [s(85, 10)], 'bench-dup')], new Set(['bench', 'bench-dup']));
        expect(rows[9]).toMatchObject({ actualWeight: 85, actualDate: 2 });
    });
});
