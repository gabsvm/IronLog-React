import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const { mockState, calcOverviewSpy, calcChartSpy } = vi.hoisted(() => ({
    mockState: { logs: [] as any[], activeMeso: null as any, exercises: [] as any[], tutorial: {} },
    calcOverviewSpy: vi.fn(),
    calcChartSpy: vi.fn(),
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
        calculateChartData: calcChartSpy,
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
import { TRANSLATIONS } from '../../constants';
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

// Both the heatmap grid and the volume list render these 12 muscles
// (neither surface renders NECK; the volume list also has a CARDIO row).
const MUSCLE_LABELS_ES_12 = Object.entries(TRANSLATIONS.es.muscle)
    .filter(([key]) => key !== 'CARDIO' && key !== 'NECK')
    .map(([, label]) => label);

const cardValue = (label: string): number => {
    // Header cards live in the wrapper <section>; the doughnut center reuses
    // the "Series" label inside the tab panel.
    const labelEl = screen.getAllByText(label).find((el) => el.closest('section'));
    const card = labelEl?.parentElement;
    return Number((card?.textContent ?? '').replace(label, ''));
};

const donutTotal = (): number => {
    const data = JSON.parse(screen.getByTestId('doughnut').textContent ?? '[]') as number[];
    return data.reduce((a, b) => a + b, 0);
};

/** Muscles whose rendered count is > 0 (heatmap cells or volume rows). */
const positiveMuscleCount = (): number =>
    MUSCLE_LABELS_ES_12.filter((label) => {
        const row = screen.getByText(label).parentElement;
        const raw = (row?.textContent ?? '').replace(label, '').replace(',', '.');
        return Number(raw) > 0;
    }).length;

describe('L2: single scope control in the Stats wrapper', () => {
    beforeEach(async () => {
        (Element.prototype as any).scrollIntoView = vi.fn();
        await db.clear();
        calcOverviewSpy.mockReset();
        calcOverviewSpy.mockImplementation(async (logs: any[], mesoId?: number) =>
            computeOverview(logs, mesoId ?? null),
        );
        calcChartSpy.mockReset();
        calcChartSpy.mockImplementation(async () => []);
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

    it('L3: plan scope cards match the doughnut, heatmap and volume list', async () => {
        render(<StatsView />);
        await waitFor(() => expect(donutTotal()).toBe(4));
        expect(cardValue('Sesiones')).toBe(1);
        expect(cardValue('Ejercicios')).toBe(1);
        expect(cardValue('Series')).toBe(4);
        expect(cardValue('Músculos')).toBe(1);
        await waitFor(() => expect(cardValue('Series')).toBe(donutTotal()));
        await waitFor(() => expect(cardValue('Músculos')).toBe(positiveMuscleCount()));
        expect(screen.getByRole('heading', { name: 'Estadísticas' })).toBeTruthy();
        expect(screen.getByText(/Plan actual/)).toBeTruthy();
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(positiveMuscleCount()).toBe(1));
    });

    it('L3: history scope cards match the doughnut, heatmap and volume list', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        fireEvent.click(scopeTab('Todo el historial'));
        await waitFor(() => expect(cardValue('Series')).toBe(16));
        expect(cardValue('Sesiones')).toBe(3);
        expect(cardValue('Ejercicios')).toBe(2);
        expect(cardValue('Músculos')).toBe(2);
        await waitFor(() => expect(cardValue('Series')).toBe(donutTotal()));
        await waitFor(() => expect(positiveMuscleCount()).toBe(2));
        // Scope tab + header label under the title.
        expect(screen.getAllByText('Todo el historial')).toHaveLength(2);
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(positiveMuscleCount()).toBe(2));
    });

    it('L4: volume caption shows the weeks behind the average in each scope', async () => {
        render(<StatsView />);
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(screen.getByText('Esta semana · Este plan')).toBeTruthy());
        fireEvent.click(scopeTab('Todo el historial'));
        await waitFor(() => expect(screen.getByText('Promedio sobre 3 semanas · Todo el historial')).toBeTruthy());
    });

    it('M1: without a stored choice, overview and volume default to plan, progress to history', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true');
        expect(cardValue('Series')).toBe(4);
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true'));
        fireEvent.click(sectionTab('Progreso'));
        await waitFor(() => expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'));
        // Cards follow the visible tab: history totals in progress.
        expect(cardValue('Series')).toBe(16);
        expect(cardValue('Sesiones')).toBe(3);
        // The progress graph queries history scope (4th arg = null meso).
        await waitFor(() =>
            expect(calcChartSpy.mock.calls.some((c) => c[3] == null)).toBe(true),
        );
    });

    it('M1: an explicit choice wins in every tab', async () => {
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        fireEvent.click(sectionTab('Progreso'));
        await waitFor(() => expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'));
        fireEvent.click(scopeTab('Este plan'));
        await waitFor(() => expect(calcChartSpy.mock.calls.some((c) => c[3] === 202)).toBe(true));
        expect(cardValue('Series')).toBe(4);
        fireEvent.click(sectionTab('Resumen'));
        await waitFor(() => expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true'));
        expect(await statsCache.readSelectedScopeV2()).toBe('plan');
    });

    it('M1: a stored v2 choice applies on mount in all tabs', async () => {
        await db.set('il_stats_scope_v2', 'plan');
        render(<StatsView />);
        fireEvent.click(sectionTab('Progreso'));
        await waitFor(() => expect(scopeTab('Este plan').getAttribute('aria-selected')).toBe('true'));
        await waitFor(() => expect(calcChartSpy.mock.calls.some((c) => c[3] === 202)).toBe(true));
    });

    it('M1: without an active meso every tab defaults to history', async () => {
        mockState.activeMeso = null;
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true');
        expect(cardValue('Series')).toBe(16);
        fireEvent.click(sectionTab('Progreso'));
        await waitFor(() => expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'));
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(scopeTab('Todo el historial').getAttribute('aria-selected')).toBe('true'));
    });

    it('M2: the muscles contract holds with sparse data (no rounding to zero)', async () => {
        // Same two mesos plus a single TRICEPS set: history averages drop to
        // BACK 4, SHOULDERS 1.3, TRICEPS 0.3 — every muscle stays above zero.
        mockState.logs = [
            ...mockState.logs.slice(0, 2),
            {
                ...mockState.logs[2],
                exercises: [
                    { id: 'e-sh', muscle: 'SHOULDERS', sets: sets(4) },
                    { id: 'e-tri', muscle: 'TRICEPS', sets: sets(1) },
                ],
            },
        ];
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        // Plan scope first: 2 muscles above zero.
        expect(cardValue('Músculos')).toBe(2);
        await waitFor(() => expect(positiveMuscleCount()).toBe(2));
        fireEvent.click(scopeTab('Todo el historial'));
        await waitFor(() => expect(cardValue('Músculos')).toBe(3));
        await waitFor(() => expect(positiveMuscleCount()).toBe(3));
        // The fractional average renders localized.
        expect(heatCellCount('Hombros')).toContain('1,3');
        expect(heatCellCount('Tríceps')).toContain('0,3');
        fireEvent.click(sectionTab('Volumen'));
        await waitFor(() => expect(positiveMuscleCount()).toBe(3));
    });

    it('M3: header card, progress counter and picker draw from one exercises definition', async () => {
        // Empty and skipped-only exercises must not count anywhere.
        mockState.logs = [
            {
                ...mockState.logs[0],
                exercises: [
                    ...mockState.logs[0].exercises,
                    { id: 'e-skip', muscle: 'BACK', sets: [{ id: 99, completed: true, skipped: true }] },
                ],
            },
            mockState.logs[1],
            {
                ...mockState.logs[2],
                exercises: [
                    ...mockState.logs[2].exercises,
                    { id: 'e-empty', muscle: 'CHEST', sets: [{ id: 98, completed: false, skipped: false }] },
                ],
            },
        ];
        render(<StatsView />);
        await waitFor(() => expect(calcOverviewSpy).toHaveBeenCalled());
        // Plan scope (overview default): only e-sh counts.
        expect(cardValue('Ejercicios')).toBe(1);
        fireEvent.click(sectionTab('Progreso'));
        // History scope: e-back + e-sh; the empty and skipped-only ones are out.
        await waitFor(() => expect(screen.getByText('2 ejercicios con historial')).toBeTruthy());
        expect(cardValue('Ejercicios')).toBe(2);
        fireEvent.click(scopeTab('Este plan'));
        await waitFor(() => expect(screen.getByText('1 ejercicios con historial')).toBeTruthy());
        expect(cardValue('Ejercicios')).toBe(1);
    });

    it('M1: cards, doughnut and heatmap agree per tab with its effective scope', async () => {
        render(<StatsView />);
        // Overview (plan default): cards match the plan doughnut.
        await waitFor(() => expect(cardValue('Series')).toBe(donutTotal()));
        expect(cardValue('Series')).toBe(4);
        fireEvent.click(sectionTab('Progreso'));
        // Progress (history default): header cards switch to history totals.
        await waitFor(() => expect(cardValue('Series')).toBe(16));
        expect(cardValue('Músculos')).toBe(2);
        fireEvent.click(sectionTab('Volumen'));
        // Volume (plan default): one muscle above zero, matching the plan cards.
        await waitFor(() => expect(cardValue('Series')).toBe(4));
        await waitFor(() => expect(positiveMuscleCount()).toBe(1));
        expect(cardValue('Músculos')).toBe(positiveMuscleCount());
    });
});
