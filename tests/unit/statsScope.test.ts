import { describe, it, expect } from 'vitest';
import { filterLogsByScope, countSessionsByScope, scopeMesoId } from '../../utils/statsScope';
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
