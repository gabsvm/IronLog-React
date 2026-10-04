import { describe, it, expect } from 'vitest';
import type { Log } from '../../types';
import { lastSessionSummary, streakWeeks, weekProgress } from '../../utils/homeSummary';

let setSeq = 900;
const set = (weight: string, reps: string): any => ({
    id: setSeq++, weight, reps, completed: true, type: 'regular',
});

const log = (
    id: number, week: number, dayIdx: number, sets: any[], endTime: number, extra: Record<string, unknown> = {},
): Log => ({
    id, dayIdx, name: `s${id}`, startTime: endTime - 3600, endTime,
    duration: 3600, mesoId: 7, week, skipped: false,
    exercises: [{ id: 'ex_chest', name: 'Press', muscle: 'CHEST', sets }],
    ...extra,
} as unknown as Log);

describe('Q16: weekProgress', () => {
    it('counts distinct trained days against planned days', () => {
        const logs = [
            log(1, 2, 0, [set('60', '10')], 1000),
            log(2, 2, 0, [set('60', '10')], 1100),
            log(3, 2, 1, [set('60', '10')], 1200),
            log(4, 2, 2, [set('60', '10')], 1300, { skipped: true }),
            log(5, 1, 3, [set('60', '10')], 900),
            log(6, 2, 3, [set('60', '10')], 1400, { mesoId: 8 }),
        ];
        expect(weekProgress(logs, 7, 2, 4)).toEqual({ done: 2, planned: 4 });
    });

    it('returns zeros without logs', () => {
        expect(weekProgress([], 7, 1, 4)).toEqual({ done: 0, planned: 4 });
    });
});

describe('Q16: lastSessionSummary', () => {
    it('summarizes the newest session: date, duration, volume and PRs', () => {
        const logs = [
            log(1, 1, 0, [set('50', '10')], 1000),
            log(2, 2, 1, [set('60', '10'), set('60', '10')], 2000),
        ];
        const summary = lastSessionSummary(logs, 7)!;
        expect(summary).not.toBeNull();
        expect(summary.date).toBe(2000);
        expect(summary.durationMin).toBe(60);
        expect(summary.volumeKg).toBe(1200);
        // 60x10 (e1rm 80) beats the old 50x10 best (66.7) by >1%.
        expect(summary.prCount).toBe(1);
    });

    it('does not count first-time exercises as PRs', () => {
        const only = log(1, 1, 0, [set('60', '10')], 1000);
        expect(lastSessionSummary([only], 7)!.prCount).toBe(0);
    });

    it('ignores skipped logs and other mesos', () => {
        const logs = [
            log(1, 2, 0, [set('60', '10')], 1000),
            log(2, 2, 1, [set('100', '10')], 2000, { skipped: true }),
            log(3, 2, 2, [set('100', '10')], 3000, { mesoId: 8 }),
        ];
        const summary = lastSessionSummary(logs, 7)!;
        expect(summary.date).toBe(1000);
        expect(summary.volumeKg).toBe(600);
    });

    it('returns null without completed sessions', () => {
        expect(lastSessionSummary([], 7)).toBeNull();
        expect(lastSessionSummary([log(1, 1, 0, [set('60', '10')], 1000, { skipped: true })], 7)).toBeNull();
    });
});

describe('Q16: streakWeeks', () => {
    /** One log per trained day; weeks complete at 3 planned days. */
    const trained = (week: number, days: number[], base: number): Log[] =>
        days.map((dayIdx, i) => log(base + i, week, dayIdx, [set('60', '10')], base * 1000 + i));

    it('counts consecutive complete weeks ending now', () => {
        const logs = [...trained(1, [0, 1, 2], 10), ...trained(2, [0, 1, 2], 20), ...trained(3, [0, 1, 2], 30)];
        expect(streakWeeks(logs, 7, 3, 3)).toBe(3);
    });

    it('skips an in-progress current week without breaking the streak', () => {
        const logs = [...trained(1, [0, 1, 2], 10), ...trained(2, [0, 1, 2], 20), ...trained(3, [0], 30)];
        expect(streakWeeks(logs, 7, 3, 3)).toBe(2);
    });

    it('stops at the first incomplete week', () => {
        const logs = [...trained(1, [0, 1, 2], 10), ...trained(2, [0], 20), ...trained(3, [0, 1, 2], 30)];
        expect(streakWeeks(logs, 7, 3, 3)).toBe(1);
    });

    it('starts at zero for a new meso and guards degenerate input', () => {
        expect(streakWeeks([...trained(1, [0], 10)], 7, 1, 3)).toBe(0);
        expect(streakWeeks([], 7, 1, 3)).toBe(0);
        expect(streakWeeks([...trained(1, [0, 1, 2], 10)], 7, 1, 0)).toBe(0);
    });
});
