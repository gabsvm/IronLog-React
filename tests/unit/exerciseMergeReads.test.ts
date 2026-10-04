import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ExerciseDef, Log } from '../../types';
import { getLastLogForExercise } from '../../utils';
import {
    buildExerciseHistoryIndex,
    getExerciseHistorySummary,
    getHistoricalBest1RMIndex,
} from '../../utils/exerciseHistoryIndex';
import { matchParsedExerciseNames } from '../../services/trainingCsv';
import { mergeExercises } from '../../utils/exerciseLibrary';
import { buildStatsLogsSignature, statsCache } from '../../services/statsCache';

const lib = (): ExerciseDef[] => ([
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
    { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', isCustom: true },
]);

let setSeq = 1;
const set = (weight: string, reps: string): any => ({
    id: setSeq++, weight, reps, completed: true, type: 'regular',
});

const logWith = (id: number, exId: string, name: string, sets: any[], endTime: number): Log => ({
    id, dayIdx: 0, name: `session-${id}`, startTime: endTime - 3600, endTime,
    duration: 60, mesoId: 1, week: 1, skipped: false,
    exercises: [{ id: exId, name, muscle: 'CHEST', sets }],
} as unknown as Log);

/** Newest log holds the duplicate's sets; older log holds the survivor's. */
const mergedHistory = () => ([
    logWith(2, 'custom_1', 'Press Banca', [set('100', '5')], 2000),
    logWith(1, 'bp_bar', 'Press Banca Barra', [set('90', '5')], 1000),
]);

describe('Q14: merged history reads', () => {
    it('last-log lookup follows merges without rewriting logs', () => {
        const logs = mergedHistory();
        const before = JSON.stringify(logs);
        const mergedLib = mergeExercises(lib(), 'custom_1', 'bp_bar');

        // The survivor sees the duplicate's newer sets; the duplicate reads
        // through the same group.
        expect(getLastLogForExercise('bp_bar', logs, mergedLib)![0]!.weight).toBe('100');
        expect(getLastLogForExercise('custom_1', logs, mergedLib)![0]!.weight).toBe('100');
        // Stored logs are untouched.
        expect(JSON.stringify(logs)).toBe(before);

        // Without a library the legacy single-id behavior is unchanged.
        expect(getLastLogForExercise('bp_bar', logs)![0]!.weight).toBe('90');
    });

    it('history index canonicalizes under the survivor and rebuilds after a merge', () => {
        const logs = mergedHistory();
        const plain = buildExerciseHistoryIndex(logs);
        expect([...plain.keys()].sort()).toEqual(['bp_bar', 'custom_1']);

        // Same logs reference: the merge-aware call must not serve the stale bucket.
        const mergedLib = mergeExercises(lib(), 'custom_1', 'bp_bar');
        const merged = buildExerciseHistoryIndex(logs, undefined, mergedLib);
        expect([...merged.keys()]).toEqual(['bp_bar']);
        expect(merged.get('bp_bar')!.latestCompletedSets![0]!.weight).toBe('100');
        expect(merged.get('bp_bar')!.bestWeightedWeight).toBe('100');

        // Querying the merged id resolves to the same canonical summary.
        expect(getExerciseHistorySummary(logs, 'custom_1', undefined, mergedLib).bestWeightedWeight).toBe('100');
    });

    it('best-1RM index folds merged bests under the canonical id', () => {
        const logs = mergedHistory();
        const mergedLib = mergeExercises(lib(), 'custom_1', 'bp_bar');
        const best = getHistoricalBest1RMIndex(logs, undefined, mergedLib);
        expect([...best.keys()]).toEqual(['bp_bar']);
        // 100 kg x 5 wins over 90 kg x 5 (Epley).
        expect(best.get('bp_bar')).toBeCloseTo(100 * (1 + 5 / 30), 5);
    });

    it('CSV name matching resolves curated aliases', () => {
        const matches = matchParsedExerciseNames(['Press Banca', 'Overhead Press'], lib());
        expect(matches[0]!.matched!.id).toBe('bp_bar');
        expect(matches[1]!.matched).toBeNull();
    });
});

describe('Q14: chart worker aggregates id groups', () => {
    const realPostMessage = (self as any).postMessage?.bind(self);
    const posted: any[] = [];

    const dispatch = async (data: any) => {
        await import('../../hooks/stats.worker');
        (self as any).postMessage = (message: any) => { posted.push(message); };
        (self as any).onmessage({ data });
    };

    afterEach(() => {
        posted.length = 0;
        if (realPostMessage) (self as any).postMessage = realPostMessage;
    });

    const seed = async () => {
        await dispatch({
            type: 'SET_LOGS',
            logs: [
                {
                    id: 2, skipped: false, mesoId: 1, endTime: 2000,
                    exercises: [{ id: 'custom_1', muscle: 'CHEST', sets: [set('100', '5')] }],
                },
                {
                    id: 1, skipped: false, mesoId: 1, endTime: 1000,
                    exercises: [{ id: 'bp_bar', muscle: 'CHEST', sets: [set('90', '8')] }],
                },
            ],
        });
        posted.length = 0;
    };

    it('emits one point per log matching any group id', async () => {
        await seed();
        await dispatch({ type: 'CALCULATE_CHART', exerciseId: ['bp_bar', 'custom_1'], metric: '1rm', reqId: 7 });
        expect(posted).toHaveLength(1);
        const points = posted[0].dataPoints;
        expect(posted[0].reqId).toBe(7);
        expect(points.map((p: any) => p.date)).toEqual([1000, 2000]);
        expect(points[1].value).toBeCloseTo(100 * (1 + 5 / 30), 1);
    });

    it('keeps the single-id path working and sums volume within one log', async () => {
        await seed();
        await dispatch({ type: 'CALCULATE_CHART', exerciseId: 'bp_bar', metric: '1rm', reqId: 8 });
        expect(posted[0].dataPoints).toHaveLength(1);

        await dispatch({
            type: 'SET_LOGS',
            logs: [{
                id: 3, skipped: false, mesoId: 1, endTime: 3000,
                exercises: [
                    { id: 'bp_bar', muscle: 'CHEST', sets: [set('100', '5')] },
                    { id: 'custom_1', muscle: 'CHEST', sets: [set('80', '5')] },
                ],
            }],
        });
        posted.length = 0;
        await dispatch({ type: 'CALCULATE_CHART', exerciseId: ['bp_bar', 'custom_1'], metric: 'volume', reqId: 9 });
        expect(posted[0].dataPoints).toHaveLength(1);
        expect(posted[0].dataPoints[0].value).toBe(100 * 5 + 80 * 5);
    });
});

describe('Q14: chart cache invalidation on merge', () => {
    it('drops chart entries but keeps overview entries', async () => {
        const logs = mergedHistory();
        const signature = `${buildStatsLogsSignature(logs)}:q14-${Date.now()}`;
        await statsCache.writeOverview(signature, null, {
            volumeData: [['CHEST', 6]], exerciseFrequency: { bp_bar: 1 }, setTypeDist: { regular: 1 }, weeks: 1,
        });
        await statsCache.writeChart(signature, 'bp_bar', '1rm', null, [{ date: 1, value: 1, weight: 1, reps: 1 }]);

        expect(await statsCache.readChart(signature, 'bp_bar', '1rm', null)).not.toBeNull();
        await statsCache.invalidateChartCache();
        expect(await statsCache.readChart(signature, 'bp_bar', '1rm', null)).toBeNull();
        expect(await statsCache.readOverview(signature, null)).not.toBeNull();
    });
});
