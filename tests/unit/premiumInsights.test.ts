import { describe, expect, it } from 'vitest';
import type { Log } from '../../types';
import { buildPremiumInsights } from '../../utils/premiumInsights';

// Local-time anchor keeps the rolling windows invariant across test environments.
const today = new Date(2026, 9, 13, 12).getTime();
const daysAgo = (days: number) => {
    const day = new Date(today);
    day.setDate(day.getDate() - days);
    return day.getTime();
};
const makeLog = (id: number, days: number, weight = 75, options?: { skipped?: boolean; mesoId?: number; completed?: boolean; setType?: string }): Log => ({
    id, dayIdx: 0, name: 'Torso', startTime: daysAgo(days), endTime: daysAgo(days) + 3600000,
    duration: 3600, week: 1, mesoId: options?.mesoId ?? 1, skipped: options?.skipped,
    exercises: [{
        id: 'bench', instanceId: id, name: { es: 'Press banca', en: 'Bench press' },
        muscle: 'CHEST',
        sets: [{ id: 1, weight, reps: 8, rpe: 2, type: (options?.setType ?? 'regular') as 'regular', completed: options?.completed ?? true }],
    }],
});

describe('premium insights', () => {
    it('counts only completed working sets in the correct rolling week and plan', () => {
        const rows = [makeLog(1, 0), makeLog(2, 8), makeLog(3, 15), makeLog(4, 22),
            makeLog(5, 1, 100, { skipped: true }),
            makeLog(6, 2, 100, { mesoId: 2 }),
            makeLog(7, 3, 100, { completed: false }),
            makeLog(8, 5, 100, { setType: 'warmup' })];
        const insight = buildPremiumInsights(rows, 1, today);
        expect(insight.weeklyWorkingSets).toEqual([1, 1, 1, 1]);
        expect(insight.weekChangePct).toBe(0);
        expect(insight.bestSet?.weight).toBe(75);
    });
    it('keeps all-history and plan scopes separate and avoids invented percentages', () => {
        const rows = [makeLog(1, 1, 75), makeLog(2, 1, 85, { mesoId: 2 })];
        expect(buildPremiumInsights(rows, 1, today).weekChangePct).toBeNull();
        expect(buildPremiumInsights(rows, null, today).currentWeekSets).toBe(2);
        expect(buildPremiumInsights(rows, null, today).bestSet?.weight).toBe(85);
    });
    it('ignores future sessions and uses the actual strongest weighted series', () => {
        const rows = [makeLog(1, -1, 200), makeLog(2, 0, 65), makeLog(3, 12, 90)];
        const insight = buildPremiumInsights(rows, null, today);
        expect(insight.weeklyWorkingSets).toEqual([0, 0, 1, 1]);
        expect(insight.bestSet?.weight).toBe(90);
        expect(insight.weekChangePct).toBe(0);
    });
    it('returns a meaningful empty result', () => {
        expect(buildPremiumInsights([], null, today)).toEqual({
            weeklyWorkingSets: [0, 0, 0, 0], currentWeekSets: 0, previousWeekSets: 0, weekChangePct: null, bestSet: null,
        });
    });
});
