import { describe, it, expect, beforeEach, vi } from 'vitest';
import { statsCache } from '../../services/statsCache';
import { db } from '../../utils/db';

describe('N1: pruneStaleSignatureKeys drops cache entries from older log signatures', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('keeps only the current signature keys for overview and chart', async () => {
        const sig = 'n1-current';
        await db.set(`il_stats_overview_v4:${sig}:all`, { fresh: true });
        await db.set(`il_stats_overview_v4:${sig}:202`, { fresh: true });
        await db.set(`il_stats_chart_v3:${sig}:ex1:weight:all`, { fresh: true });
        await db.set('il_stats_overview_v4:n1-old-a:all', { stale: true });
        await db.set('il_stats_overview_v4:n1-old-b:202', { stale: true });
        await db.set('il_stats_chart_v3:n1-old-a:ex1:weight:all', { stale: true });

        await statsCache.pruneStaleSignatureKeys(sig);

        expect(await db.get(`il_stats_overview_v4:${sig}:all`, null)).toEqual({ fresh: true });
        expect(await db.get(`il_stats_overview_v4:${sig}:202`, null)).toEqual({ fresh: true });
        expect(await db.get(`il_stats_chart_v3:${sig}:ex1:weight:all`, null)).toEqual({ fresh: true });
        expect(await db.get('il_stats_overview_v4:n1-old-a:all', 'gone')).toBe('gone');
        expect(await db.get('il_stats_overview_v4:n1-old-b:202', 'gone')).toBe('gone');
        expect(await db.get('il_stats_chart_v3:n1-old-a:ex1:weight:all', 'gone')).toBe('gone');
    });

    it('compares signatures with inner colons by exact prefix, never by split', async () => {
        // Real signatures look like "v2:3:first:…:hash" (join(':')).
        const current = 'v2:3:logA:111:logB:222:9:abc';
        const shorterPrefix = 'v2:3:logA:111';
        await db.set(`il_stats_overview_v4:${current}:all`, { fresh: true });
        await db.set(`il_stats_overview_v4:${shorterPrefix}:all`, { stale: true });
        await db.set(`il_stats_overview_v4:${current}:extra:tail`, { fresh: true });

        await statsCache.pruneStaleSignatureKeys(current);

        expect(await db.get(`il_stats_overview_v4:${current}:all`, null)).toEqual({ fresh: true });
        expect(await db.get(`il_stats_overview_v4:${current}:extra:tail`, null)).toEqual({ fresh: true });
        expect(await db.get(`il_stats_overview_v4:${shorterPrefix}:all`, 'gone')).toBe('gone');
    });

    it('never deletes the scope or selected-exercise keys', async () => {
        await db.set('il_stats_scope_v2', 'plan');
        await db.set('il_stats_selected_exercise_v1', 'ex9');
        await db.set('il_stats_overview_v4:n1-old-c:all', { stale: true });

        await statsCache.pruneStaleSignatureKeys('n1-current-c');

        expect(await db.get('il_stats_scope_v2', null)).toBe('plan');
        expect(await db.get('il_stats_selected_exercise_v1', null)).toBe('ex9');
        expect(await db.get('il_stats_overview_v4:n1-old-c:all', 'gone')).toBe('gone');
    });

    it('runs at most once per signature per session', async () => {
        const sig = 'n1-once-per-sig';
        await db.set('il_stats_overview_v4:n1-old-d:all', { stale: true });
        await statsCache.pruneStaleSignatureKeys(sig);
        expect(await db.get('il_stats_overview_v4:n1-old-d:all', 'gone')).toBe('gone');

        // A stale key written after the first pass survives a second call
        // with the same signature: the second call is a no-op.
        await db.set('il_stats_overview_v4:n1-old-e:all', { stale: true });
        await statsCache.pruneStaleSignatureKeys(sig);
        expect(await db.get('il_stats_overview_v4:n1-old-e:all', null)).toEqual({ stale: true });

        // But a new signature prunes again.
        await statsCache.pruneStaleSignatureKeys('n1-once-per-sig-2');
        expect(await db.get('il_stats_overview_v4:n1-old-e:all', 'gone')).toBe('gone');
    });

    it('never throws when IndexedDB fails', async () => {
        await db.set('il_stats_overview_v4:n1-old-f:all', { stale: true });
        const failingDel = vi.spyOn(db, 'del').mockRejectedValueOnce(new Error('idb down'));
        try {
            await expect(statsCache.pruneStaleSignatureKeys('n1-current-f')).resolves.toBeUndefined();
        } finally {
            failingDel.mockRestore();
        }
    });
});
