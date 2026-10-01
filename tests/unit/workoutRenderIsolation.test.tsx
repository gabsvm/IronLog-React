import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { useWorkoutController } from '../../hooks/useWorkoutController';
import { useStore } from '../../lib/store';
import type { SessionExercise } from '../../types';

// Mock dnd-kit so SortableExerciseCard can render in jsdom without DOM measurement errors
vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

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

import { AppProvider } from '../../context/AppContext';

const renderImplSpy = vi.fn();
vi.mock('../../components/workout/SortableExerciseCardImpl', () => ({
    SortableExerciseCard: (props: any) => {
        renderImplSpy(props.exercise.instanceId);
        return <div data-testid={`card-${props.exercise.instanceId}`}>{props.exercise.name}</div>;
    },
}));

const EMPTY_LOGS: never[] = [];
const STABLE_T = { types: {}, typeDesc: {} };
const STABLE_CONFIG = { showRIR: true };
const noop = () => {};

describe('R1: Workout Render Isolation (real controller + real store)', () => {
    const makeExercise = (instanceId: number, name: string): SessionExercise => ({
        id: `ex_${instanceId}`,
        instanceId,
        name,
        muscle: 'CHEST',
        sets: [
            { id: 101, weight: '80', reps: '10', rpe: '8', completed: false, type: 'regular' },
            { id: 102, weight: '80', reps: '10', rpe: '8', completed: false, type: 'regular' },
        ],
    });

    let capturedCtrl: ReturnType<typeof useWorkoutController> | null = null;

    const Harness: React.FC = () => {
        const ctrl = useWorkoutController(noop, noop);
        capturedCtrl = ctrl;
        const exercises = useStore((s) => s.activeSession?.exercises ?? []);
        return (
            <div>
                {exercises.map((exercise, index) => (
                    <SortableExerciseCard
                        key={exercise.instanceId}
                        exercise={exercise}
                        isExpanded={index === 0}
                        onSetUpdate={ctrl.handleSetUpdate}
                        onSetComplete={ctrl.toggleSetComplete}
                        onSetTypeChange={noop}
                        onAddSet={ctrl.handleAddSet}
                        onDeleteSet={ctrl.handleDeleteSet}
                        onToggleExpand={noop}
                        onOpenDetail={noop}
                        onLink={noop}
                        onReplace={noop}
                        onEditMuscle={noop}
                        onUpdateSession={noop}
                        onOpenWarmup={noop}
                        openMenuId={null}
                        setOpenMenuId={noop}
                        linkingId={null}
                        t={STABLE_T}
                        lang="es"
                        supersetColorIndex={undefined}
                        isLinkingTarget={false}
                        config={STABLE_CONFIG}
                        stageConfig={null}
                        dragEnabled={true}
                        logs={EMPTY_LOGS}
                    />
                ))}
            </div>
        );
    };

    beforeEach(() => {
        renderImplSpy.mockClear();
        capturedCtrl = null;
        useStore.setState({ isStoreLoading: false, activeMeso: null } as any);
    });

    it('does not re-render exercise card B when a set in card A is edited via the real handler', async () => {
        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Isolation Session',
                startTime: Date.now(),
                dayIdx: 0,
                mesoId: 1,
                week: 1,
                exercises: [makeExercise(1, 'Bench Press'), makeExercise(2, 'Incline Dumbbell')],
            } as any,
        });

        render(
            <AppProvider>
                <Harness />
            </AppProvider>
        );
        await waitFor(() => expect(capturedCtrl).not.toBeNull());
        await waitFor(() => expect(renderImplSpy.mock.calls.filter((c) => c[0] === 2)).toHaveLength(1));

        const cardACount = renderImplSpy.mock.calls.filter((c) => c[0] === 1).length;
        expect(cardACount).toBeGreaterThanOrEqual(1);
        const baselineA = renderImplSpy.mock.calls.filter((c) => c[0] === 1).length;

        // Edit Set 1 of Exercise A through the REAL controller handler (typing 85kg).
        act(() => {
            capturedCtrl!.handleSetUpdate(1, 101, 'weight', '85');
        });

        // The store really updated…
        const session = useStore.getState().activeSession;
        expect(session?.exercises?.[0]?.sets?.[0]?.weight).toBe('85');
        // …Card A re-rendered with the new data…
        expect(renderImplSpy.mock.calls.filter((c) => c[0] === 1).length).toBe(baselineA + 1);
        // …and Card B MUST NOT have re-rendered (stable handlers + unchanged reference).
        expect(renderImplSpy.mock.calls.filter((c) => c[0] === 2)).toHaveLength(1);
    });

    it('keeps card B stable when a set in card A is toggled complete via the real handler', async () => {
        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Isolation Session',
                startTime: Date.now(),
                dayIdx: 0,
                mesoId: 1,
                week: 1,
                exercises: [makeExercise(1, 'Bench Press'), makeExercise(2, 'Incline Dumbbell')],
            } as any,
        });

        render(
            <AppProvider>
                <Harness />
            </AppProvider>
        );
        await waitFor(() => expect(capturedCtrl).not.toBeNull());
        await waitFor(() => expect(renderImplSpy.mock.calls.filter((c) => c[0] === 2)).toHaveLength(1));
        const baselineA = renderImplSpy.mock.calls.filter((c) => c[0] === 1).length;

        act(() => {
            capturedCtrl!.toggleSetComplete(1, 101);
        });

        const session = useStore.getState().activeSession;
        expect(session?.exercises?.[0]?.sets?.[0]?.completed).toBe(true);
        expect(renderImplSpy.mock.calls.filter((c) => c[0] === 1).length).toBe(baselineA + 1);
        expect(renderImplSpy.mock.calls.filter((c) => c[0] === 2)).toHaveLength(1);
    });
});
