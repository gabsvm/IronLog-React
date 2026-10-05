import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    mergeHealthWeights,
    toHealthWorkout,
    maybeExportWorkoutToHealth,
    getHealthConnectPrefs,
    setHealthConnectPrefs,
    type HealthConnectApi,
} from '../../utils/healthConnect';
import { HealthConnectCard } from '../../components/profile/HealthConnectCard';
import type { BodyLog } from '../../types';

const at = (y: number, m: number, d: number, h = 8) => new Date(y, m - 1, d, h).getTime();

describe('U9: mergeHealthWeights', () => {
    it('one entry per local day, latest reading wins, rounded to 0.1 kg', () => {
        const { merged, added } = mergeHealthWeights([], [
            { time: at(2026, 10, 1, 7), kg: 80.04 },
            { time: at(2026, 10, 1, 21), kg: 80.66 },
            { time: at(2026, 10, 2), kg: 79.9 },
        ]);
        expect(added).toBe(2);
        expect(merged.map((l) => [l.date, l.weight])).toEqual([
            [at(2026, 10, 2), 79.9],
            [at(2026, 10, 1, 21), 80.7],
        ]);
    });

    it('never replaces a day the user already logged; re-import adds nothing', () => {
        const manual: BodyLog[] = [{ id: 1, date: at(2026, 10, 1, 12), weight: 82, notes: 'manual' }];
        const records = [{ time: at(2026, 10, 1, 7), kg: 80 }, { time: at(2026, 10, 3), kg: 79 }];
        const first = mergeHealthWeights(manual, records);
        expect(first.added).toBe(1);
        expect(first.merged.find((l) => l.notes === 'manual')?.weight).toBe(82);
        const second = mergeHealthWeights(first.merged, records);
        expect(second.added).toBe(0);
        expect(second.merged).toBe(first.merged);
    });

    it('drops implausible values', () => {
        expect(mergeHealthWeights([], [{ time: at(2026, 10, 1), kg: 5 }, { time: at(2026, 10, 2), kg: 900 }, { time: NaN, kg: 80 }]).added).toBe(0);
    });
});

describe('U9: toHealthWorkout', () => {
    const base = { id: 42, name: 'Push A', startTime: 1_000_000, endTime: 4_600_000, duration: 3600, exercises: [{ sets: [{ completed: true }, { completed: true, skipped: true }, { completed: false }] }] } as any;

    it('maps the log to an idempotent session payload', () => {
        expect(toHealthWorkout(base)).toEqual({ id: '42', startMs: 1_000_000, endMs: 4_600_000, title: 'Push A', notes: 'GainsLab · 1 sets' });
    });

    it('falls back to duration; rejects logs without a valid range', () => {
        expect(toHealthWorkout({ ...base, endTime: undefined })?.endMs).toBe(4_600_000);
        expect(toHealthWorkout({ ...base, endTime: undefined, duration: 0 })).toBeNull();
        expect(toHealthWorkout({ ...base, startTime: 0 })).toBeNull();
    });
});

describe('U9: export + prefs', () => {
    beforeEach(() => localStorage.clear());

    it('prefs default to off and persist', () => {
        expect(getHealthConnectPrefs()).toEqual({ exportWorkouts: false, lastWeightImportAt: 0 });
        setHealthConnectPrefs({ exportWorkouts: true });
        expect(getHealthConnectPrefs().exportWorkouts).toBe(true);
    });

    it('exports only when opted in and never throws', async () => {
        const write = vi.fn(async () => true);
        expect(await maybeExportWorkoutToHealth({} as any, { write })).toBe(false);
        expect(write).not.toHaveBeenCalled();
        setHealthConnectPrefs({ exportWorkouts: true });
        expect(await maybeExportWorkoutToHealth({} as any, { write })).toBe(true);
        write.mockRejectedValueOnce(new Error('denied'));
        expect(await maybeExportWorkoutToHealth({} as any, { write })).toBe(false);
    });

    it('web build: the bridge is never called', async () => {
        const { readHealthWeights, writeHealthWorkout, getHealthConnectStatus } = await import('../../utils/healthConnect');
        expect(await getHealthConnectStatus()).toEqual({ status: 'unsupported', granted: false });
        expect(await readHealthWeights(0)).toEqual([]);
        expect(await writeHealthWorkout({ id: 1, startTime: 1, endTime: 2 } as any)).toBe(false);
    });
});

describe('U9: HealthConnectCard', () => {
    beforeEach(() => localStorage.clear());

    const makeApi = (over: Partial<HealthConnectApi> = {}): HealthConnectApi => ({
        getStatus: vi.fn(async () => ({ status: 'available' as const, granted: true })),
        requestAccess: vi.fn(async () => true),
        openApp: vi.fn(async () => {}),
        readWeights: vi.fn(async () => [{ time: at(2026, 10, 1), kg: 80 }, { time: at(2026, 10, 2), kg: 79.5 }]),
        ...over,
    });

    it('renders nothing on the web', () => {
        const { container } = render(<HealthConnectCard lang="es" bodyLogs={[]} setBodyLogs={vi.fn()} api={makeApi()} isPlatform={() => false} />);
        expect(container.innerHTML).toBe('');
    });

    it('connect flow: denied shows a hint, granted shows the import button', async () => {
        const api = makeApi({
            getStatus: vi.fn(async () => ({ status: 'available' as const, granted: false })),
            requestAccess: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
        });
        render(<HealthConnectCard lang="es" bodyLogs={[]} setBodyLogs={vi.fn()} api={api} isPlatform={() => true} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Conectar' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Sin permiso');
        fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));
        expect(await screen.findByRole('button', { name: 'Importar peso' })).toBeInTheDocument();
    });

    it('import merges into body logs, reports the count and remembers the time', async () => {
        const api = makeApi();
        let logs: BodyLog[] = [{ id: 1, date: at(2026, 10, 2, 12), weight: 81 }];
        const setBodyLogs = vi.fn((u: any) => { logs = typeof u === 'function' ? u(logs) : u; });
        render(<HealthConnectCard lang="es" bodyLogs={logs} setBodyLogs={setBodyLogs} api={api} isPlatform={() => true} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Importar peso' }));
        expect(await screen.findByRole('status')).toHaveTextContent('1 registros de peso importados.');
        expect(logs.map((l) => l.weight)).toEqual([81, 80]);
        expect(getHealthConnectPrefs().lastWeightImportAt).toBeGreaterThan(0);
        // First import looks back one year.
        const since = (api.readWeights as any).mock.calls[0][0];
        expect(Date.now() - since).toBeGreaterThan(360 * 24 * 3600 * 1000);
    });

    it('update required → opens Health Connect; export switch persists', async () => {
        const api = makeApi({ getStatus: vi.fn(async () => ({ status: 'update_required' as const, granted: false })) });
        const { unmount } = render(<HealthConnectCard lang="en" bodyLogs={[]} setBodyLogs={vi.fn()} api={api} isPlatform={() => true} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Install or update Health Connect' }));
        expect(api.openApp).toHaveBeenCalled();
        unmount();

        render(<HealthConnectCard lang="en" bodyLogs={[]} setBodyLogs={vi.fn()} api={makeApi()} isPlatform={() => true} />);
        const toggle = await screen.findByRole('switch', { name: 'Save workouts when finished' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(toggle);
        await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
        expect(getHealthConnectPrefs().exportWorkouts).toBe(true);
    });
});
