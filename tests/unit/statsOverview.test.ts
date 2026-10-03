import { describe, it, expect } from 'vitest';
import type { Log } from '../../types';
import { computeOverview, formatSets } from '../../utils/statsOverview';

let nextId = 1;
const sets = (n: number, completed = true) =>
    Array.from({ length: n }, (_, i) => ({ id: i + 1, completed, skipped: false }));
const log = (partial: Record<string, unknown>): Log =>
    ({
        id: nextId++,
        dayIdx: 0,
        name: 'test',
        startTime: Date.parse('2026-09-07T10:00:00Z'), // a Monday
        endTime: Date.parse('2026-09-07T11:00:00Z'),
        duration: 3600,
        skipped: false,
        exercises: [],
        ...partial,
    }) as Log;
const muscleEx = (muscle: string, setCount: number, completed = true, id = 1) => ({
    id,
    muscle,
    sets: sets(setCount, completed),
});
const avgOf = (volumeData: [string, number][], muscle: string) =>
    volumeData.find(([m]) => m === muscle)?.[1];

describe('L1: computeOverview divides by real weeks in scope', () => {
    it('counts (mesoId, week) pairs across two mesocycles: weeks = 6, not 3', () => {
        const logs: Log[] = [];
        for (const mesoId of [101, 102]) {
            for (const week of [1, 2, 3]) {
                logs.push(log({ mesoId, week, exercises: [muscleEx('BACK', 6)] }));
            }
        }
        const { weeks, volumeData } = computeOverview(logs, null);
        expect(weeks).toBe(6);
        // 36 back sets over 6 real weeks, not 36 / 3 = 12.
        expect(avgOf(volumeData, 'BACK')).toBe(6);
    });

    it('restricts the divisor to the requested plan', () => {
        const logs: Log[] = [];
        for (const mesoId of [101, 102]) {
            for (const week of [1, 2, 3]) {
                logs.push(log({ mesoId, week, exercises: [muscleEx('CHEST', 4)] }));
            }
        }
        const scoped = computeOverview(logs, 102);
        expect(scoped.weeks).toBe(3);
        expect(avgOf(scoped.volumeData, 'CHEST')).toBe(4);
    });

    it('falls back to the ISO calendar week when mesoId or week is missing', () => {
        const monday = Date.parse('2026-09-07T10:00:00Z');
        const tuesday = Date.parse('2026-09-08T10:00:00Z');
        const nextMonday = Date.parse('2026-09-14T10:00:00Z');
        const logs = [
            log({ mesoId: undefined, week: undefined, startTime: monday, exercises: [muscleEx('BACK', 2)] }),
            log({ mesoId: undefined, week: undefined, startTime: tuesday, exercises: [muscleEx('BACK', 2)] }),
            log({ mesoId: undefined, week: undefined, startTime: nextMonday, exercises: [muscleEx('BACK', 2)] }),
        ];
        const { weeks, volumeData } = computeOverview(logs, null);
        expect(weeks).toBe(2);
        expect(avgOf(volumeData, 'BACK')).toBe(3);
    });

    it('ignores skipped logs and incomplete or skipped sets', () => {
        const logs = [
            log({ mesoId: 101, week: 1, exercises: [muscleEx('BACK', 6)] }),
            log({ mesoId: 101, week: 2, skipped: true, exercises: [muscleEx('BACK', 60)] }),
            log({
                mesoId: 101, week: 3,
                exercises: [{ id: 1, muscle: 'BACK', sets: [...sets(2, true), ...sets(50, false)] }],
            }),
        ];
        const { weeks, volumeData } = computeOverview(logs, 101);
        expect(weeks).toBe(2);
        // (6 + 2) / 2 = 4.
        expect(avgOf(volumeData, 'BACK')).toBe(4);
    });

    it('numeric case: 3 weeks with 6 back sets per week average 6', () => {
        const logs = [1, 2, 3].map((week) =>
            log({ mesoId: 101, week, exercises: [muscleEx('BACK', 6)] }),
        );
        const { weeks, volumeData } = computeOverview(logs, 101);
        expect(weeks).toBe(3);
        expect(avgOf(volumeData, 'BACK')).toBe(6);
    });

    it('keeps one decimal: 2 sets over 5 weeks average 0.4', () => {
        const logs = [1, 2, 3, 4, 5].map((week) =>
            log({ mesoId: 101, week, exercises: week === 1 ? [muscleEx('BACK', 2)] : [] }),
        );
        const { weeks, volumeData } = computeOverview(logs, 101);
        expect(weeks).toBe(5);
        expect(avgOf(volumeData, 'BACK')).toBe(0.4);
    });

    it('floors positive averages at 0.1 so volume never rounds to zero', () => {
        const weeks = Array.from({ length: 25 }, (_, i) => i + 1);
        const logs = weeks.map((week) =>
            log({ mesoId: 101, week, exercises: week === 1 ? [muscleEx('BACK', 1)] : [] }),
        );
        const { volumeData } = computeOverview(logs, 101);
        expect(avgOf(volumeData, 'BACK')).toBe(0.1);
    });

    it('never divides by zero and keeps the worker result shape', () => {
        const { weeks, volumeData, exerciseFrequency } = computeOverview([], null);
        expect(weeks).toBe(1);
        expect(volumeData).toEqual(expect.any(Array));
        expect(exerciseFrequency).toEqual({});
        const values = volumeData.map(([, v]) => v);
        const sorted = [...values].sort((a, b) => b - a);
        expect(values).toEqual(sorted);
    });
});

describe('M2: formatSets prints whole sets plainly, decimals localized', () => {
    it('prints integers without decimals in both languages', () => {
        expect(formatSets(6, 'es')).toBe('6');
        expect(formatSets(6, 'en')).toBe('6');
    });

    it('prints one decimal with a comma in Spanish and a dot in English', () => {
        expect(formatSets(3.5, 'es')).toBe('3,5');
        expect(formatSets(3.5, 'en')).toBe('3.5');
    });

    it('rounds display artifacts like 0.1 + 0.2 to one decimal', () => {
        expect(formatSets(0.1 + 0.2, 'es')).toBe('0,3');
    });
});
