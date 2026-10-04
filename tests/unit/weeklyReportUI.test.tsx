import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockState, calcOverviewSpy, calcChartSpy } = vi.hoisted(() => ({
    mockState: {
        logs: [] as any[],
        activeMeso: null as any,
        exercises: [] as any[],
        tutorial: {},
        rpFeedback: {} as any,
    },
    calcOverviewSpy: vi.fn(async () => ({ volumeData: [], exerciseFrequency: {}, weeks: 1 })),
    calcChartSpy: vi.fn(async () => []),
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
        config: { weightUnit: 'kg' },
        rpFeedback: mockState.rpFeedback,
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

let setSeq = 500;
const set = (weight: string, reps: string): any => ({
    id: setSeq++, weight, reps, completed: true, type: 'regular',
});

const log = (id: number, week: number, muscles: Record<string, number>, startTime: number): any => ({
    id, dayIdx: 0, name: `s${id}`, startTime, endTime: startTime + 3600,
    duration: 60, mesoId: 7, week, skipped: false,
    exercises: Object.entries(muscles).map(([muscle, count]) => ({
        id: `ex_${muscle}`, name: muscle, muscle,
        sets: Array.from({ length: count }, () => set('60', '10')),
    })),
});

const seedMeso = (week: number) => {
    mockState.activeMeso = {
        id: 7, mesoType: 'hyp_1', week, duration: 5,
        plan: [[null], [null], [null], [null]],
    };
};

describe('Q15: weekly report card in Stats overview', () => {
    beforeEach(() => {
        calcOverviewSpy.mockClear();
        calcChartSpy.mockClear();
        mockState.rpFeedback = {};
        mockState.exercises = [
            { id: 'ex_CHEST', name: 'Press', muscle: 'CHEST' },
            { id: 'ex_BACK', name: 'Remo', muscle: 'BACK' },
        ];
    });

    it('renders sessions, volume change, zones and week PRs', async () => {
        seedMeso(3);
        mockState.logs = [
            log(31, 3, { CHEST: 8, BACK: 4 }, 30000),
            log(32, 3, { CHEST: 4 }, 31000),
            log(21, 2, { CHEST: 10, BACK: 10 }, 20000),
            log(22, 2, { CHEST: 10 }, 21000),
            log(23, 2, { BACK: 10 }, 22000),
        ];
        render(<StatsView scope="plan" onScopeChange={() => {}} />);

        await waitFor(() => expect(screen.getByText('Reporte semanal')).toBeTruthy());
        expect(screen.getByText('SEMANA 3')).toBeTruthy();
        // 2 of 4 planned sessions.
        expect(screen.getByText('2/4')).toBeTruthy();
        // 16 sets vs 40 last week → -60%.
        expect(screen.getByText('-60%')).toBeTruthy();
        // BACK at 4 sets is under MEV.
        expect(screen.getByText(
            (_, el) => el?.tagName === 'P' && el?.textContent === 'Bajo MEV: Espalda 4',
        )).toBeTruthy();
        // CHEST best (60x10) and BACK best (60x10) were both set this week.
        expect(screen.getByText('Récords').parentElement?.textContent).toContain('2');
    });

    it('suggests a deload on the final week', async () => {
        seedMeso(5);
        mockState.logs = [log(51, 5, { CHEST: 8 }, 50000)];
        render(<StatsView scope="plan" onScopeChange={() => {}} />);

        await waitFor(() => expect(
            screen.getByText('Última semana: programá una descarga.'),
        ).toBeTruthy());
    });

    it('shows an empty state without sessions', async () => {
        seedMeso(3);
        mockState.logs = [log(21, 2, { CHEST: 8 }, 20000)];
        render(<StatsView scope="plan" onScopeChange={() => {}} />);

        await waitFor(() => expect(
            screen.getByText('Todavía no hay sesiones esta semana.'),
        ).toBeTruthy());
    });
});
