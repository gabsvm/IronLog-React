import { describe, it, expect } from 'vitest';
import { filterLogsByScope, countSessionsByScope, scopeMesoId, summarizeLogsByScope } from '../../utils/statsScope';
import type { Log } from '../../types';

const makeLog = (id: number, mesoId?: number, skipped = false): Log =>
    ({ id: `l${id}`, mesoId, skipped } as unknown as Log);

describe('K5: session counting and scope filtering share one definition', () => {
    const logs = [
        makeLog(1, 10),
        makeLog(2, 10),
        makeLog(3, 10, true), // skipped: never counts
        makeLog(4, 20),
        makeLog(5, 20),
        makeLog(6), // no meso (freestyle)
    ];

    it('history scope counts every non-skipped log across mesocycles', () => {
        expect(countSessionsByScope(logs, null)).toBe(5);
        expect(countSessionsByScope(logs, undefined)).toBe(5);
        expect(filterLogsByScope(logs, null).map(l => l.id)).toEqual(['l1', 'l2', 'l4', 'l5', 'l6']);
    });

    it('plan scope counts only non-skipped logs of that meso', () => {
        expect(countSessionsByScope(logs, 10)).toBe(2);
        expect(countSessionsByScope(logs, 20)).toBe(2);
        expect(countSessionsByScope(logs, 999)).toBe(0);
    });

    it('skipped sessions never count in any scope', () => {
        expect(filterLogsByScope(logs, 10).every(l => !l.skipped)).toBe(true);
        expect(countSessionsByScope([makeLog(7, 10, true)], 10)).toBe(0);
        expect(countSessionsByScope([makeLog(7, 10, true)], null)).toBe(0);
    });

    it('scopeMesoId maps plan/history to a meso filter', () => {
        expect(scopeMesoId('plan', 10)).toBe(10);
        expect(scopeMesoId('plan', null)).toBeNull();
        expect(scopeMesoId('history', 10)).toBeNull();
    });

    it('tolerates missing logs', () => {
        expect(countSessionsByScope(null as unknown as Log[], null)).toBe(0);
        expect(countSessionsByScope(undefined as unknown as Log[], 10)).toBe(0);
    });
});

describe('L3: summarizeLogsByScope shares the worker definition', () => {
    const doneSets = (n: number) =>
        Array.from({ length: n }, (_, i) => ({ id: i + 1, completed: true, skipped: false }));
    const undoneSets = (n: number) =>
        Array.from({ length: n }, (_, i) => ({ id: 100 + i, completed: false, skipped: false }));
    const richLog = (partial: Record<string, unknown>): Log =>
        ({ id: 'x', skipped: false, exercises: [], ...partial } as unknown as Log);

    const logs = [
        richLog({
            id: 'l1', mesoId: 10,
            exercises: [
                { id: 'e-back', muscle: 'BACK', sets: doneSets(6) },
                { id: 'e-cardio', muscle: 'CARDIO', sets: doneSets(2) },
            ],
        }),
        richLog({
            id: 'l2', mesoId: 10, skipped: true,
            exercises: [{ id: 'e-back', muscle: 'BACK', sets: doneSets(60) }],
        }),
        richLog({
            id: 'l3', mesoId: 20,
            exercises: [
                { id: 'e-chest', muscle: 'CHEST', sets: doneSets(4) },
                { id: 'e-tri', muscle: 'TRICEPS', sets: undoneSets(3) },
            ],
        }),
    ];

    it('history scope summarizes every non-skipped log', () => {
        expect(summarizeLogsByScope(logs, null)).toEqual({
            sessions: 2,
            exercises: 3,
            sets: 12,
            muscles: 2,
        });
    });

    it('plan scope summarizes only that meso', () => {
        expect(summarizeLogsByScope(logs, 10)).toEqual({
            sessions: 1,
            exercises: 2,
            sets: 8,
            muscles: 1,
        });
    });

    it('excludes CARDIO from muscles but keeps its sets, and drops empty exercises', () => {
        const summary = summarizeLogsByScope(logs, 20);
        // TRICEPS had no completed set: not an exercise, not a muscle.
        expect(summary).toEqual({ sessions: 1, exercises: 1, sets: 4, muscles: 1 });
    });

    it('tolerates missing logs', () => {
        expect(summarizeLogsByScope(null as unknown as Log[], null)).toEqual({
            sessions: 0, exercises: 0, sets: 0, muscles: 0,
        });
    });
});
