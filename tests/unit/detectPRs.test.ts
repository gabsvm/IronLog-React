import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutController } from '../../hooks/useWorkoutController';
import { useStore } from '../../lib/store';

const mockLogs = [
    {
        id: 'log_1',
        exerciseId: 'bench_press',
        sets: [{ weight: 100, reps: 5, completed: true }]
    }
];

// Mock AppContext
vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        setProgram: vi.fn(),
        exercises: [],
        rpFeedback: {},
        setRpFeedback: vi.fn(),
        config: { rpEnabled: false },
        logs: mockLogs,
        userProfile: { bodyWeight: 80 }
    })
}));

// Mock TimerContext
vi.mock('../../context/TimerContext', () => ({
    useTimerActions: () => ({
        setRestTimer: vi.fn()
    })
}));

// Mock useStatsWorker
let resolver: ((val: Map<string, number>) => void) | null = null;
const mockCalculateAllBest1RMs = vi.fn().mockImplementation(() => {
    return new Promise<Map<string, number>>((resolve) => {
        resolver = resolve;
    });
});

vi.mock('../../hooks/useStatsWorker', () => ({
    useStatsWorker: () => ({
        calculateAllBest1RMs: mockCalculateAllBest1RMs
    })
}));

describe('detectPRs historicalReady guard (D6)', () => {
    beforeEach(() => {
        resolver = null;
        mockCalculateAllBest1RMs.mockClear();
        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Chest Day',
                exercises: [
                    {
                        id: 'bench_press',
                        instanceId: 10,
                        name: 'Bench Press',
                        muscle: 'CHEST',
                        sets: [
                            { id: 1, weight: 110, reps: 5, completed: true, type: 'regular', rpe: 9 }
                        ]
                    }
                ]
            } as any,
            activeMeso: null,
            isStoreLoading: false
        });
    });

    it('returns false when historical best 1RM index is not yet ready', () => {
        const { result } = renderHook(() => useWorkoutController(vi.fn(), vi.fn()));

        // Before stats worker promise resolves
        expect(result.current.historicalReady).toBe(false);
        // detectPRs should guard against false PRs while historicalReady is false
        expect(result.current.detectPRs()).toBe(false);
    });

    it('detects PR accurately once historical data is ready', async () => {
        const { result } = renderHook(() => useWorkoutController(vi.fn(), vi.fn()));

        expect(result.current.historicalReady).toBe(false);

        // Resolve historical best 1RM map (historical best was 100x5 = ~116 e1RM, current is 110x5 = ~128 e1RM)
        const historicalMap = new Map<string, number>();
        historicalMap.set('bench_press', 116);

        await act(async () => {
            resolver!(historicalMap);
        });

        expect(result.current.historicalReady).toBe(true);
        expect(result.current.detectPRs()).toBe(true);
    });
});
