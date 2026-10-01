import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';

// Mock dependencies before importing AppProvider
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
        // Return isLoading = false so AppProvider does not block on loading
        return [state, setState, false];
    },
}));

import { AppProvider, useApp, useSyncMeta } from '../../context/AppContext';

describe('R2: Decouple localLastUpdated from AppContext', () => {
    it('does not re-render useApp consumers when sync meta updates', async () => {
        let appConsumerRenderCount = 0;
        let syncMetaConsumerRenderCount = 0;
        let triggerSyncUpdate: ((val: number) => void) | null = null;

        const AppConsumer: React.FC = () => {
            const { logs } = useApp();
            appConsumerRenderCount++;
            return <div data-testid="app-consumer">logs:{logs.length}</div>;
        };

        const SyncMetaConsumer: React.FC = () => {
            const { localLastUpdated, setLocalLastUpdated } = useSyncMeta();
            syncMetaConsumerRenderCount++;
            triggerSyncUpdate = (val: number) => setLocalLastUpdated(val);
            return <div data-testid="sync-consumer">{localLastUpdated}</div>;
        };

        const { findByTestId } = render(
            <AppProvider>
                <AppConsumer />
                <SyncMetaConsumer />
            </AppProvider>
        );

        const appEl = await findByTestId('app-consumer');
        const syncEl = await findByTestId('sync-consumer');

        expect(appEl.textContent).toBe('logs:0');
        expect(syncEl.textContent).toBe('0');

        const initialAppRenders = appConsumerRenderCount;
        const initialSyncRenders = syncMetaConsumerRenderCount;

        expect(initialAppRenders).toBeGreaterThanOrEqual(1);
        expect(initialSyncRenders).toBeGreaterThanOrEqual(1);

        // Update localLastUpdated via SyncMetaContext
        act(() => {
            triggerSyncUpdate!(123456789);
        });

        // SyncMetaConsumer should re-render and reflect the new timestamp
        expect(syncEl.textContent).toBe('123456789');
        expect(syncMetaConsumerRenderCount).toBe(initialSyncRenders + 1);

        // AppConsumer should NOT have re-rendered!
        expect(appConsumerRenderCount).toBe(initialAppRenders);
    });
});
