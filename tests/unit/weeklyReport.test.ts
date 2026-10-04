import { describe, it, expect } from 'vitest';
import type { Log, MesoCycle } from '../../types';
import { buildWeeklyReport, filterWeekPRs } from '../../utils/weeklyReport';

let setSeq = 100;
const set = (weight: string, reps: string, extra: Record<string, unknown> = {}): any => ({
    id: setSeq++, weight, reps, completed: true, type: 'regular', ...extra,
});

const log = (
    id: number, week: number, muscles: Record<string, number>, startTime: number, extra: Record<string, unknown> = {},
): Log => ({
    id, dayIdx: 0, name: `s${id}`, startTime, endTime: startTime + 3600,
    duration: 60, mesoId: 7, week, skipped: false,
    exercises: Object.entries(muscles).map(([muscle, count], i) => ({
        id: `ex_${muscle}`, name: muscle, muscle,
        sets: Array.from({ length: count }, () => set('60', '10')),
    })),
    ...extra,
} as unknown as Log);

const meso = (week: number, extra: Record<string, unknown> = {}): MesoCycle => ({
    id: 7, mesoType: 'hyp_1', week, duration: 5,
    plan: [[null], [null], [null], [null]],
    ...extra,
} as unknown as MesoCycle);

type Feedback = Record<string, Record<string, Record<string, { soreness: number; performance: number; adjustment: number }>>>;

describe('Q15: buildWeeklyReport', () => {
    /** Week 3: 2 sessions; week 2: 3 sessions. */
    const logs = (): Log[] => ([
        log(31, 3, { CHEST: 8, BACK: 4 }, 30000),
        log(32, 3, { CHEST: 4 }, 31000),
        log(21, 2, { CHEST: 10, BACK: 10 }, 20000),
        log(22, 2, { CHEST: 10 }, 21000),
        log(23, 2, { BACK: 10 }, 22000),
        log(99, 3, { CHEST: 5 }, 32000, { mesoId: 8, importKey: 'other-plan' }),
    ]);

    it('counts sessions, muscle sets vs zones and volume change', () => {
        const report = buildWeeklyReport({ logs: logs(), meso: meso(3), rpFeedback: {} });
        expect(report.week).toBe(3);
        expect(report.sessionsDone).toBe(2);
        expect(report.sessionsPlanned).toBe(4);

        const byMuscle = Object.fromEntries(report.muscles.map((m) => [m.muscle, m]));
        expect(byMuscle.CHEST).toMatchObject({ sets: 12, prevSets: 20, zone: 'MAV' });
        expect(byMuscle.BACK).toMatchObject({ sets: 4, prevSets: 20, zone: 'MV' });

        expect(report.totalSets).toBe(16);
        expect(report.prevTotalSets).toBe(40);
        expect(report.volumeChangePct).toBe(-60);
        expect(report.hasPreviousWeek).toBe(true);

        expect(report.lowMuscles).toEqual(['BACK']);
        expect(report.highMuscles).toEqual([]);
        expect(report.deloadSuggested).toBe(false);
        expect(report.deloadReason).toBeNull();
    });

    it('flags MRV muscles', () => {
        const report = buildWeeklyReport({
            logs: [log(31, 3, { CHEST: 24 }, 30000)],
            meso: meso(3), rpFeedback: {},
        });
        expect(report.highMuscles).toEqual(['CHEST']);
        expect(report.lowMuscles).toEqual([]);
    });

    it('ignores skipped logs/sets and CARDIO in muscle rows', () => {
        const skippedLog = log(33, 3, { CHEST: 10 }, 33000, { skipped: true });
        const skippedSets = log(34, 3, {}, 34000);
        (skippedSets.exercises as any[]) = [{
            id: 'ex_back', name: 'BACK', muscle: 'BACK',
            sets: [set('60', '10', { skipped: true }), set('60', '10', { completed: false })],
        }];
        const cardio = log(35, 3, { CARDIO: 6 }, 35000);
        const report = buildWeeklyReport({
            logs: [log(31, 3, { CHEST: 8 }, 30000), skippedLog, skippedSets, cardio],
            meso: meso(3), rpFeedback: {},
        });
        expect(report.sessionsDone).toBe(3);
        expect(report.totalSets).toBe(8);
        expect(report.muscles.map((m) => m.muscle)).toEqual(['CHEST']);
    });

    it('reports no previous week without a baseline', () => {
        const report = buildWeeklyReport({
            logs: [log(31, 3, { CHEST: 8 }, 30000)],
            meso: meso(3), rpFeedback: {},
        });
        expect(report.hasPreviousWeek).toBe(false);
        expect(report.prevTotalSets).toBe(0);
        expect(report.volumeChangePct).toBeNull();
    });

    it('suggests a deload on the final week of the plan', () => {
        const report = buildWeeklyReport({
            logs: [log(51, 5, { CHEST: 8 }, 50000)],
            meso: meso(5), rpFeedback: {},
        });
        expect(report.deloadSuggested).toBe(true);
        expect(report.deloadReason).toBe('final-week');
    });

    it('suggests a deload on an unfavorable feedback trend', () => {
        const rpFeedback: Feedback = {
            7: {
                3: {
                    CHEST: { soreness: 4, performance: 2, adjustment: -1 },
                    BACK: { soreness: 3, performance: 2, adjustment: -1 },
                    QUADS: { soreness: 1, performance: 4, adjustment: 1 },
                },
            },
        };
        const report = buildWeeklyReport({
            logs: [log(31, 3, { CHEST: 8 }, 30000)],
            meso: meso(3), rpFeedback,
        });
        expect(report.deloadSuggested).toBe(true);
        expect(report.deloadReason).toBe('feedback');
    });

    it('stays silent while already deloading', () => {
        const report = buildWeeklyReport({
            logs: [log(51, 5, { CHEST: 8 }, 50000)],
            meso: meso(5, { isDeload: true }), rpFeedback: {},
        });
        expect(report.deloadSuggested).toBe(false);
        expect(report.deloadReason).toBeNull();
    });

    it('returns zeros for an empty week', () => {
        const report = buildWeeklyReport({ logs: [], meso: meso(3), rpFeedback: {} });
        expect(report.sessionsDone).toBe(0);
        expect(report.totalSets).toBe(0);
        expect(report.muscles).toEqual([]);
        expect(report.lowMuscles).toEqual([]);
        expect(report.volumeChangePct).toBeNull();
        expect(report.deloadSuggested).toBe(false);
    });
});

describe('Q15: filterWeekPRs', () => {
    const logs = (): Log[] => ([
        log(31, 3, { CHEST: 8 }, 30000),
        log(32, 3, { CHEST: 4 }, 40000),
        log(21, 2, { CHEST: 10 }, 20000),
    ]);

    it('counts PR rows set during the plan week', () => {
        const rows = [{ date: 31000 }, { date: 41000 }, { date: 21000 }, { date: 99999 }];
        expect(filterWeekPRs(rows, logs(), 7, 3)).toBe(2);
    });

    it('counts nothing without week logs', () => {
        expect(filterWeekPRs([{ date: 31000 }], [], 7, 3)).toBe(0);
    });
});
