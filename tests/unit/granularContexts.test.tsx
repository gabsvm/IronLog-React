import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';

vi.mock('../../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        user: null,
        subscription: { isPro: false },
        logout: vi.fn(),
    }),
}));

vi.mock('../../context/TimerContext', () => ({
    TimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
    useTimerState: () => ({ active: false, timeLeft: 0 }),
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

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        isStoreLoading: false,
        activeSession: null,
        activeMeso: null,
        setActiveSession: vi.fn(),
        setActiveMeso: vi.fn(),
    }),
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

import { AppProvider, useApp, useAppPreferences, useSyncStatus } from '../../context/AppContext';

describe('R3: Granular Contexts Isolation', () => {
    it('isolates useAppPreferences consumers from AppContext/logs/sync changes', async () => {
        let prefsRenderCount = 0;
        let syncStatusRenderCount = 0;
        let appRenderCount = 0;
        let setLogsFn: any = null;

        const PrefsConsumer = () => {
            const { lang } = useAppPreferences();
            prefsRenderCount++;
            return <div data-testid="prefs-consumer">{lang}</div>;
        };

        const SyncStatusConsumer = () => {
            const { isOnline, syncStatus } = useSyncStatus();
            syncStatusRenderCount++;
            return <div data-testid="sync-consumer">{isOnline ? 'online' : 'offline'}:{syncStatus.pending}</div>;
        };

        const AppConsumer = () => {
            const { logs, setLogs } = useApp();
            appRenderCount++;
            setLogsFn = setLogs;
            return <div data-testid="app-consumer">logs:{logs.length}</div>;
        };

        const { findByTestId } = render(
            <AppProvider>
                <PrefsConsumer />
                <SyncStatusConsumer />
                <AppConsumer />
            </AppProvider>
        );

        await findByTestId('prefs-consumer');
        await findByTestId('sync-consumer');
        await findByTestId('app-consumer');

        const initialPrefsRenders = prefsRenderCount;
        const initialSyncStatusRenders = syncStatusRenderCount;
        const initialAppRenders = appRenderCount;

        expect(initialPrefsRenders).toBeGreaterThanOrEqual(1);
        expect(initialSyncStatusRenders).toBeGreaterThanOrEqual(1);
        expect(initialAppRenders).toBeGreaterThanOrEqual(1);

        // Update logs in AppContext
        act(() => {
            setLogsFn([{ id: 'log-1', sessionId: 's-1' } as any]);
        });

        // AppConsumer must re-render because it reads logs
        expect(appRenderCount).toBe(initialAppRenders + 1);

        // PrefsConsumer must NOT re-render
        expect(prefsRenderCount).toBe(initialPrefsRenders);

        // SyncStatusConsumer must NOT re-render
        expect(syncStatusRenderCount).toBe(initialSyncStatusRenders);
    });
});
