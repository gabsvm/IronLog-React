import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const { mockState, calcOverviewSpy } = vi.hoisted(() => ({
    mockState: { logs: [] as any[], activeMeso: null as any, exercises: [] as any[], tutorial: {} },
    calcOverviewSpy: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null, subscription: { isPro: true } }),
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        logs: mockState.logs,
        lang: 'es',
        exercises: mockState.exercises,
        tutorialProgress: mockState.tutorial,
        markTutorialSeen: vi.fn(),
        userProfile: null,
    }),
    useAppPreferences: () => ({ lang: 'es' }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: mockState.activeMeso }),
}));

vi.mock('../../hooks/useStatsWorker', () => ({
    useStatsWorker: () => ({
        isWorkerReady: true,
        calculateOverview: calcOverviewSpy,
        calculateChartData: async () => [],
        calculateAllBest1RMs: async () => new Map(),
    }),
}));

vi.mock('react-chartjs-2', () => ({
    Doughnut: ({ data }: any) => (
        <div data-testid="doughnut">{JSON.stringify(data?.datasets?.[0]?.data ?? [])}</div>
    ),
    Radar: () => <div data-testid="radar" />,
}));

import { StatsView } from '../../views/StatsView';
import { computeOverview } from '../../utils/statsOverview';
import { statsCache } from '../../services/statsCache';
import { db } from '../../utils/db';

const sets = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: i + 1, completed: true, skipped: false }));

const seedTwoMesos = () => {
    mockState.activeMeso = { id: 202, week: 1, mesoType: 'hypertrophy' };
    mockState.logs = [
        {
            id: 1, dayIdx: 0, name: 'A1', startTime: 1, endTime: 2, duration: 1,
            skipped: false, mesoId: 101, week: 1,
            exercises: [{ id: 'e-back', muscle: 'BACK', sets: sets(6) }],
        },
        {
            id: 2, dayIdx: 1, name: 'A2', startTime: 3, endTime: 4, duration: 1,
            skipped: false, mesoId: 101, week: 2,
            exercises: [{ id: 'e-back', muscle: 'BACK', sets: sets(6) }],
        },
        {
            id: 3, dayIdx: 0, name: 'B1', startTime: 5, endTime: 6, duration: 1,
            skipped: false, mesoId: 202, week: 1,
            exercises: [{ id: 'e-sh', muscle: 'SHOULDERS', sets: sets(4) }],
        },
    ];
};

const sectionTab = (name: string) =>
    within(screen.getByRole('tablist', { name: 'Secciones de estadísticas' }))
        .getByRole('tab', { name });

const scopeTablist = () => screen.getByRole('tablist', { name: 'Alcance' });
const scopeTab = (name: string) => within(scopeTablist()).getByRole('tab', { name });

const heatCellCount = (muscleLabel: string): string | null => {
    const label = screen.getByText(muscleLabel);
    return label.parentElement?.textContent ?? null;
};

describe('L2: single scope control in the Stats wrapper', () => {
    beforeEach(async () => {
        (Element.prototype as any).scrollIntoView = vi.fn();
        await db.clear();
        calcOverviewSpy.mockReset();
        calcOverviewSpy.mockImplementation(async (logs: any[], mesoId?: number) =>
            computeOverview(logs, mesoId ?? null),
        );
        seedTwoMesos();
    });

    it('shows the scope selector in all three sections', async () => {
        render(<StatsView />);
        expect(scopeTablist()).toBeTruthy();
        fireEvent.click(sectionTab('Progreso'));
        await waitFor(() => expect(scopeTablist()).toBeTruthy());
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(scopeTablist()).toBeTruthy());
        fireEvent.click(sectionTab('Resumen'));
        await waitFor(() => expect(scopeTablist()).toBeTruthy());
    });

    it('defaults to this plan when a meso is active', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true');
        expect(calcOverviewSpy.mock.calls[0][1]).toBe(202);
        // Plan scope: only meso B (1 week) → Hombros 4, Espalda 0.
        await waitFor(() => expect(heatCellCount('Hombros')).toContain('4'));
        expect(heatCellCount('Espalda')).toContain('0');
    });

    it('ignores the stale v1 persisted value', async () => {
        await db.set('il_stats_scope_v1', 'history');
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true');
        expect(calcOverviewSpy.mock.calls[0][1]).toBe(202);
    });

    it('switching scope updates every surface at once', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        fireEvent.click(scopeTab('Todo el historial'));
        await waitFor(() =>
            expect(calcOverviewSpy.mock.calls.some((c) => c[1] === undefined)).toBe(true),
        );
        // History scope: 3 real weeks → Espalda 12/3=4, Hombros 4/3≈1.
        await waitFor(() => expect(heatCellCount('Espalda')).toContain('4'));
        expect(heatCellCount('Hombros')).toContain('1');
        expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true');
        // Same selection is visible after switching sections (single state).
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() =>
            expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'),
        );
    });

    it('does not persist the default scope', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        await waitFor(() => expect(heatCellCount('Hombros')).toContain('4'));
        expect(await statsCache.readSelectedScopeV2()).toBeNull();
    });

    it('persists only explicit changes and applies them on mount', async () => {
        const { unmount } = render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        fireEvent.click(scopeTab('Todo el historial'));
        await waitFor(() => expect(statsCache.readSelectedScopeV2()).resolves.toBe('history'));
        unmount();
        calcOverviewSpy.mockClear();
        render(<StatsView />);
        await waitFor(() =>
            expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'),
        );
        await waitFor(() =>
            expect(calcOverviewSpy.mock.calls.some((c) => c[1] === undefined)).toBe(true),
        );
    });
});
