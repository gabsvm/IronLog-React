import { describe, it, expect, beforeEach } from 'vitest';
import { statsCache } from '../../services/statsCache';
import { db } from '../../utils/db';

describe('M2: pruneLegacyStatsKeys removes orphaned cache versions once', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('deletes legacy overview/chart/scope keys and keeps current ones', async () => {
        await db.set('il_stats_scope_v1', 'history');
        await db.set('il_stats_overview_v2:sig:all', { stale: true });
        await db.set('il_stats_overview_v3:sig:202', { stale: true });
        await db.set('il_stats_chart_v2:sig:ex', { stale: true });
        await db.set('il_stats_scope_v2', 'plan');
        await db.set('il_stats_overview_v4:sig:all', { fresh: true });

        await statsCache.pruneLegacyStatsKeys();

        expect(await db.get('il_stats_scope_v1', 'gone')).toBe('gone');
        expect(await db.get('il_stats_overview_v2:sig:all', 'gone')).toBe('gone');
        expect(await db.get('il_stats_overview_v3:sig:202', 'gone')).toBe('gone');
        expect(await db.get('il_stats_chart_v2:sig:ex', 'gone')).toBe('gone');
        expect(await db.get('il_stats_scope_v2', null)).toBe('plan');
        expect(await db.get('il_stats_overview_v4:sig:all', null)).toEqual({ fresh: true });
    });
});
