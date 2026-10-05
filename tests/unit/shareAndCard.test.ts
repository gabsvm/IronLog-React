import { describe, it, expect, vi } from 'vitest';
import { shareFileOrDownload } from '../../utils/shareFile';
import { buildSessionCardModel, formatSessionDuration } from '../../utils/sessionCard';

// U8: native share path + session card model.
describe('U8: shareFileOrDownload', () => {
    it('native app: hands the bytes (base64) to the native share sheet', async () => {
        const nativeShare = vi.fn(async () => true);
        const result = await shareFileOrDownload('a,b\n1,2', 'x.csv', 'text/csv', 'T', { isNative: () => true, nativeShare });
        expect(result).toBe('shared');
        expect(nativeShare).toHaveBeenCalledWith('x.csv', 'text/csv', btoa('a,b\n1,2'), 'T');
    });

    it('binary blobs survive the base64 round trip', async () => {
        const bytes = new Uint8Array([137, 80, 78, 71, 0, 255, 10]);
        const nativeShare = vi.fn(async () => true);
        await shareFileOrDownload(new Blob([bytes], { type: 'image/png' }), 'x.png', 'image/png', 'T', { isNative: () => true, nativeShare });
        const sent = (nativeShare.mock.calls[0] as unknown as [string, string, string])[2];
        expect([...Uint8Array.from(atob(sent), (c) => c.charCodeAt(0))]).toEqual([...bytes]);
    });

    it('native share failure falls back to the web path; web never encodes', async () => {
        const nativeShare = vi.fn(async () => false);
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        (URL as any).createObjectURL = vi.fn(() => 'blob:x');
        (URL as any).revokeObjectURL = vi.fn();
        expect(await shareFileOrDownload('data', 'x.json', 'application/json', 'T', { isNative: () => true, nativeShare })).toBe('downloaded');
        nativeShare.mockClear();
        expect(await shareFileOrDownload('data', 'x.json', 'application/json', 'T', { isNative: () => false, nativeShare })).toBe('downloaded');
        expect(nativeShare).not.toHaveBeenCalled();
        expect(click).toHaveBeenCalledTimes(2);
        click.mockRestore();
    });
});

describe('U8: session card model', () => {
    const labels = { workoutComplete: 'Done', time: 'Time', sets: 'Sets', totalVolume: 'Volume', musclesHit: 'Muscles' };
    const set = (w: number, r: number, completed = true) => ({ id: Math.random(), weight: String(w), reps: String(r), completed, type: 'regular' });

    it('stats, top exercises by completed sets, best set text', () => {
        const log = {
            id: 1, name: 'Push', startTime: Date.UTC(2026, 9, 1), endTime: Date.UTC(2026, 9, 1, 1), duration: 3720,
            exercises: [
                { name: 'Bench', sets: [set(80, 8), set(85, 6), set(0, 0, false)] },
                { name: 'Fly', sets: [set(20, 12)] },
                { name: 'Skipped', sets: [set(10, 10, false)] },
            ],
        } as any;
        const model = buildSessionCardModel({
            log, labels, locale: 'en-US', totals: { volume: 1450, sets: 3, muscles: ['CHEST'] }, volumeText: '1,450 kg',
            exerciseName: (ex) => ex.name as string,
            bestSetText: (ex) => {
                const done = ex.sets.filter((s) => s.completed);
                const best = done.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
                return `${best.weight} kg × ${best.reps}`;
            },
        });
        expect(model.stats).toEqual([
            { label: 'Time', value: '1h 2m' }, { label: 'Sets', value: '3' }, { label: 'Volume', value: '1,450 kg' },
        ]);
        expect(model.topExercises).toEqual([{ name: 'Bench', detail: '85 kg × 6' }, { name: 'Fly', detail: '20 kg × 12' }]);
        expect(model.muscles).toEqual(['CHEST']);
    });

    it('formats durations', () => {
        expect(formatSessionDuration(59)).toBe('0m');
        expect(formatSessionDuration(3600)).toBe('1h 0m');
        expect(formatSessionDuration(-5)).toBe('0m');
    });
});
