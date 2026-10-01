import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkoutController } from '../../hooks/useWorkoutController';
import { useStore } from '../../lib/store';

const { mockSetRestTimer } = vi.hoisted(() => ({ mockSetRestTimer: vi.fn() }));

vi.mock('../../context/TimerContext', () => ({
    TimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTimerActions: () => ({ setRestTimer: mockSetRestTimer }),
    useTimerState: () => ({ active: false, timeLeft: 0 }),
}));

vi.mock('../../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        user: null,
        subscription: { isPro: false },
        logout: vi.fn(),
    }),
}));

vi.mock('../../services/syncService', () => ({
    syncService: {
        flushQueue: vi.fn(),
        downloadState: vi.fn(),
        uploadState: vi.fn(),
        uploadSessionOnly: vi.fn(),
        uploadUserIdentity: vi.fn(),
    },
}));

vi.mock('../../services/dirtySyncState', () => ({
    dirtySyncState: {
        list: vi.fn().mockResolvedValue([]),
        mark: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../services/offlineSyncQueue', () => ({
    offlineSyncQueue: {
        count: vi.fn().mockResolvedValue(0),
    },
}));

vi.mock('../../lib/idle', () => ({
    scheduleWhenIdle: (cb: () => void) => {
        cb();
        return () => {};
    },
}));

vi.mock('../../data/defaultLibrary', () => ({
    DEFAULT_LIBRARY: [],
    DEFAULT_TEMPLATE: [],
    INITIAL_TEMPLATES: [],
}));

vi.mock('../../hooks/usePersistedState', () => ({
    usePersistedState: (key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);
        return [state, setState, false];
    },
}));

import { AppProvider, useSyncStatus } from '../../context/AppContext';

describe('F4: useWorkoutController handler identity stability', () => {
    const noop = () => {};

    const sessionFixture: any = {
        id: 1,
        name: 'Identity Session',
        startTime: Date.now(),
        dayIdx: 0,
        mesoId: 1,
        week: 1,
        exercises: [
            {
                id: 'ex-1',
                instanceId: 1,
                name: 'Bench Press',
                sets: [{ id: 101, weight: '100', reps: '8', completed: false }],
            },
        ],
    };

    let observedSync: { isOnline: boolean; pending: number } | null = null;

    const SyncProbe: React.FC = () => {
        const { isOnline, syncStatus } = useSyncStatus();
        observedSync = { isOnline, pending: syncStatus.pending };
        return null;
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider>
            <SyncProbe />
            {children}
        </AppProvider>
    );

    beforeEach(() => {
        observedSync = null;
        useStore.setState({ isStoreLoading: false, activeSession: null, activeMeso: null } as any);
    });

    it('keeps handleSetUpdate and toggleSetComplete referentially stable across activeSession and syncStatus changes', async () => {
        const { result } = renderHook(() => useWorkoutController(noop, noop), { wrapper });
        await waitFor(() => expect(result.current).not.toBeNull());

        const firstUpdate = result.current.handleSetUpdate;
        const firstToggle = result.current.toggleSetComplete;
        expect(typeof firstUpdate).toBe('function');
        expect(typeof firstToggle).toBe('function');
        expect(result.current.sessionExercises).toHaveLength(0);

        // 1. Change activeSession through the real store: the hook re-renders
        // (it subscribes to the session) but the callbacks must keep identity.
        act(() => {
            useStore.getState().setActiveSession(sessionFixture);
        });
        expect(result.current.sessionExercises).toHaveLength(1);
        expect(result.current.handleSetUpdate).toBe(firstUpdate);
        expect(result.current.toggleSetComplete).toBe(firstToggle);

        // 2. Change sync status through the real provider event: identities hold.
        expect(observedSync?.isOnline).toBe(true);
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(observedSync?.isOnline).toBe(false);
        expect(result.current.handleSetUpdate).toBe(firstUpdate);
        expect(result.current.toggleSetComplete).toBe(firstToggle);

        // Hygiene for subsequent tests in this file.
        act(() => {
            window.dispatchEvent(new Event('online'));
            useStore.getState().setActiveSession(null);
        });
    });
});
