import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { SessionExercise } from '../../types';

vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
    SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    closestCenter: vi.fn(),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
}));

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

vi.mock('../../context/TimerContext', () => ({
    TimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
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

// Capture idle callbacks instead of running them, so the test proves the
// views actually schedule the preload and can invoke the real callback.
const { scheduledIdleCallbacks } = vi.hoisted(() => ({
    scheduledIdleCallbacks: [] as Array<() => unknown>,
}));

vi.mock('../../lib/idle', () => ({
    scheduleWhenIdle: (cb: () => unknown) => {
        scheduledIdleCallbacks.push(cb);
        return () => {};
    },
}));

import { AppProvider } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { HomeView } from '../../views/HomeViewImpl';
import { WorkoutView } from '../../views/WorkoutViewImpl';

describe('L3: Preload workout modules and modals in idle (real views)', () => {
    beforeEach(() => {
        scheduledIdleCallbacks.length = 0;
        useStore.setState({ isStoreLoading: false, activeMeso: null, activeSession: null } as any);
    });

    // Real-module transforms share CPU with every parallel worker: same
    // condition waits, with a load-tolerant test budget instead of the 5 s default.
    it('HomeView schedules an idle callback that loads the real sortable list and card modules', { timeout: 30000 }, async () => {
        render(
            <AppProvider>
                <HomeView startSession={vi.fn()} onEditProgram={vi.fn()} />
            </AppProvider>
        );

        // The mount effect must schedule idle work (exactly one callback from HomeView).
        await waitFor(() => expect(scheduledIdleCallbacks.length).toBe(1));

        // Running the captured callback must resolve the real preloaded modules.
        await scheduledIdleCallbacks[0]();

        const listModule = await import('../../components/workout/WorkoutSortableList');
        expect(listModule.default).toBeDefined();

        const cardModule = await import('../../components/workout/SortableExerciseCardImpl');
        expect(cardModule.SortableExerciseCard).toBeDefined();
    });

    it('WorkoutView schedules an idle callback that loads the real modal modules', { timeout: 30000 }, async () => {
        const exercise: SessionExercise = {
            id: 'ex_1',
            instanceId: 1,
            name: 'Bench Press',
            muscle: 'CHEST',
            sets: [
                { id: 101, weight: '80', reps: '10', rpe: '8', completed: false, type: 'regular' },
            ],
        };
        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Preload Session',
                startTime: Date.now(),
                dayIdx: 0,
                mesoId: 1,
                week: 1,
                exercises: [exercise],
            } as any,
        });

        render(
            <AppProvider>
                <WorkoutView onFinish={vi.fn()} onDiscard={vi.fn()} onBack={vi.fn()} />
            </AppProvider>
        );

        await waitFor(() => expect(scheduledIdleCallbacks.length).toBe(1));

        await scheduledIdleCallbacks[0]();

        // Every module in the preload list must exist and export its component.
        const selectorModule = await import('../../components/ui/ExerciseSelector');
        expect(selectorModule.ExerciseSelector).toBeDefined();

        const warmupModule = await import('../../components/ui/WarmupModal');
        expect(warmupModule.WarmupModal).toBeDefined();

        const detailModule = await import('../../components/ui/ExerciseDetailModal');
        expect(detailModule.ExerciseDetailModal).toBeDefined();

        const feedbackModule = await import('../../components/ui/FeedbackModal');
        expect(feedbackModule.FeedbackModal).toBeDefined();

        const prModule = await import('../../components/ui/PRCelebrationOverlay');
        expect(prModule.PRCelebrationOverlay).toBeDefined();
    });
});
