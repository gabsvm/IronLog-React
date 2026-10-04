import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockState, calcOverviewSpy, calcChartSpy } = vi.hoisted(() => ({
    mockState: {
        logs: [] as any[],
        activeMeso: null as any,
        exercises: [] as any[],
        tutorial: {},
        weightUnit: 'lb' as 'kg' | 'lb',
        userProfile: null as any,
    },
    calcOverviewSpy: vi.fn(async () => ({
        volumeData: [['CHEST', 6]],
        exerciseFrequency: { bench: 1 },
        weeks: 1,
    })),
    calcChartSpy: vi.fn(async () => [
        { date: 1000, value: 116.6667, weight: 100, reps: 5 },
        { date: 2000, value: 120, weight: 102.5, reps: 5 },
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
    Line: ({ data }: any) => (
        <div data-testid="progress-line">
            {data?.datasets?.[0]?.label}|{(data?.datasets?.[0]?.data ?? []).join(',')}
        </div>
    ),
    Doughnut: () => <div data-testid="doughnut" />,
    Radar: () => <div data-testid="radar" />,
}));

import { StatsView } from '../../views/StatsViewImpl';

const seedBenchLog = () => {
    mockState.logs = [
        {
            id: 1, dayIdx: 0, name: 'Pecho', startTime: 1000, endTime: 2000, duration: 60,
            skipped: false, mesoId: 9, week: 1,
            exercises: [
                {
                    id: 'bench', name: 'Press de banca', muscle: 'CHEST',
                    sets: [
                        { id: 1, weight: '100', reps: '5', completed: true, type: 'regular' },
                    ],
                },
            ],
        },
    ];
};

describe('Q11: Stats in lb mode', () => {
    beforeEach(() => {
        mockState.weightUnit = 'lb';
        mockState.userProfile = null;
        mockState.activeMeso = null;
        seedBenchLog();
    });

    it('shows PR rows converted to lb (100 kg → 220.5 lbs, e1RM 116.7 → 257 lbs)', async () => {
        render(<StatsView scope="history" onScopeChange={() => {}} />);
        // Weight and suffix live in separate nodes; match on full text content.
        await waitFor(() => expect(
            screen.getByText((_, el) => el?.textContent === '220.5lbs')
        ).toBeTruthy());
        expect(screen.getByText('257lbs')).toBeTruthy();
    });

    it('converts the progress chart label and data points', async () => {
        render(<StatsView scope="history" onScopeChange={() => {}} />);
        await waitFor(() => expect(screen.getByTestId('progress-line')).toBeTruthy());
        // 116.6667 kg → 257.2 lb; 120 kg → 264.6 lb. The set weight shown in
        // tooltips goes through the same toDisplay path.
        expect(screen.getByTestId('progress-line').textContent)
            .toBe('Est. 1RM (lbs)|257.2,264.6');
    });

    it('kg mode keeps the legacy rendering (golden)', async () => {
        mockState.weightUnit = 'kg';
        render(<StatsView scope="history" onScopeChange={() => {}} />);
        await waitFor(() => expect(
            screen.getByText((_, el) => el?.textContent === '100kg')
        ).toBeTruthy());
        expect(screen.getByText('117kg')).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId('progress-line')).toBeTruthy());
        expect(screen.getByTestId('progress-line').textContent)
            .toBe('Est. 1RM (kg)|116.6667,120');
    });
});
