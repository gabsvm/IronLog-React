import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockState, calcOverviewSpy, calcChartSpy } = vi.hoisted(() => ({
    mockState: {
        logs: [] as any[],
        activeMeso: null as any,
        exercises: [] as any[],
        tutorial: {},
        weightUnit: 'kg' as 'kg' | 'lb',
        userProfile: null as any,
    },
    calcOverviewSpy: vi.fn(async () => ({
        volumeData: [['CHEST', 6]],
        exerciseFrequency: { custom_1: 2, bp_bar: 3 },
        weeks: 1,
    })),
    calcChartSpy: vi.fn(async () => [
        { date: 1000, value: 63.3, weight: 50, reps: 8 },
        { date: 2000, value: 70, weight: 60, reps: 5 },
    ]),
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
        userProfile: mockState.userProfile,
        config: { weightUnit: mockState.weightUnit },
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
    }),
}));

vi.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid="progress-line" />,
    Doughnut: () => <div data-testid="doughnut" />,
    Radar: () => <div data-testid="radar" />,
}));

import { StatsView } from '../../views/StatsViewImpl';

const set = (id: number, weight: string, reps: string) => ({
    id, weight, reps, completed: true, type: 'regular',
});

/** custom_1 holds 60x5 (best e1RM); bp_bar holds 50x8. */
const seedLogs = () => {
    mockState.logs = [
        {
            id: 2, dayIdx: 0, name: 'B', startTime: 1500, endTime: 2000, duration: 60,
            skipped: false, mesoId: 1, week: 1,
            exercises: [
                { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', sets: [set(1, '60', '5')] },
            ],
        },
        {
            id: 1, dayIdx: 0, name: 'A', startTime: 500, endTime: 1000, duration: 60,
            skipped: false, mesoId: 1, week: 1,
            exercises: [
                { id: 'bp_bar', name: 'Press Banca Barra', muscle: 'CHEST', sets: [set(2, '50', '8')] },
            ],
        },
    ];
};

const seedLibrary = (merged: boolean) => {
    mockState.exercises = [
        { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
        merged
            ? { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', isCustom: true, mergedInto: 'bp_bar' }
            : { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', isCustom: true },
    ];
};

describe('Q14: Stats reads follow merges', () => {
    beforeEach(() => {
        mockState.weightUnit = 'kg';
        mockState.userProfile = null;
        mockState.activeMeso = null;
        calcOverviewSpy.mockClear();
        calcChartSpy.mockClear();
        seedLogs();
    });

    it('aggregates picker count, chart query, insight volume and PRs under the survivor', async () => {
        seedLibrary(true);
        render(<StatsView scope="history" onScopeChange={() => {}} />);

        // Picker aggregates both ids into one canonical option.
        await waitFor(() => expect(screen.getByText('1 ejercicios con historial')).toBeTruthy());
        // Ejercicios pill matches the aggregated count.
        expect(screen.getByText('Ejercicios').parentElement?.textContent).toBe('Ejercicios1');

        // Chart query spans the whole canonical group.
        await waitFor(() => expect(calcChartSpy).toHaveBeenCalled());
        const firstChartCall = calcChartSpy.mock.calls[0] as unknown as any[];
        expect(firstChartCall[1]).toEqual(['bp_bar', 'custom_1']);

        // Insight volume sums both logs: 60x5 + 50x8 = 700 kg.
        await waitFor(() => expect(
            screen.getByText((_, el) => el?.textContent === '700 kg')
        ).toBeTruthy());

        // Single PR row under the survivor's name with the best set (60x5).
        // 'Press Banca Barra' appears twice: picker button + the one PR row.
        // (The picker briefly shows the loading label while the overview
        // effect re-runs after selection, so wait for the settled count.)
        await waitFor(() => expect(screen.getAllByText('Press Banca Barra')).toHaveLength(2));
        expect(screen.queryByText('Press Banca')).toBeNull();
        expect(screen.getByText((_, el) => el?.textContent === '60kg')).toBeTruthy();
    });

    it('keeps separate rows without a merge (legacy behavior)', async () => {
        seedLibrary(false);
        render(<StatsView scope="history" onScopeChange={() => {}} />);

        await waitFor(() => expect(screen.getByText('2 ejercicios con historial')).toBeTruthy());
        expect(screen.getByText('Ejercicios').parentElement?.textContent).toBe('Ejercicios2');

        await waitFor(() => expect(calcChartSpy).toHaveBeenCalled());
        // bp_bar wins by count (3 > 2) and queries alone.
        const firstChartCall = calcChartSpy.mock.calls[0] as unknown as any[];
        expect(firstChartCall[1]).toEqual(['bp_bar']);

        // Insight covers only the selected exercise: 50x8 = 400 kg.
        await waitFor(() => expect(
            screen.getByText((_, el) => el?.textContent === '400 kg')
        ).toBeTruthy());

        // Two PR rows, one per exercise.
        await waitFor(() => expect(screen.getAllByText('Press Banca Barra')).toHaveLength(2));
        expect(screen.getAllByText('Press Banca')).toHaveLength(1);
    });
});
