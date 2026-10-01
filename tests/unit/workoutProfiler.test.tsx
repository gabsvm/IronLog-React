import React, { Profiler } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { useWorkoutController } from '../../hooks/useWorkoutController';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
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

interface ProfilerHit {
    id: string;
    phase: 'mount' | 'update';
    actualDuration: number;
    baseDuration: number;
}

describe('F9: workout re-render profile (React.Profiler, real controller + real cards)', () => {
    // NOTE on Profiler semantics (verified empirically on React 18): onRender
    // fires even when a memoized subtree bails out, so commit COUNT is not the
    // isolation signal — actualDuration is (~0 on bailout, real cost on render).
    // Deterministic render-count isolation is proven separately in
    // workoutRenderIsolation.test.tsx; this test measures real render cost.
    const hits: ProfilerHit[] = [];
    const onRender = (id: string, phase: 'mount' | 'update', actualDuration: number, baseDuration: number) => {
        hits.push({ id, phase, actualDuration, baseDuration });
    };

    const makeExercise = (instanceId: number, name: string): SessionExercise => ({
        id: `ex_${instanceId}`,
        instanceId,
        name,
        muscle: 'CHEST',
        sets: [1, 2, 3, 4].map(n => ({
            id: instanceId * 100 + n,
            weight: '80',
            reps: '10',
            rpe: '8',
            completed: false,
            type: 'regular' as const,
        })),
    });

    const noop = () => {};
    // Stable prop identities, mirroring the real WorkoutView (context values
    // keep their references across session edits). Fresh literals here would
    // defeat memo and fake extra commits.
    const STABLE_CONFIG = {};
    const STABLE_STAGE_CONFIG = {};
    const STABLE_LOGS: never[] = [];
    let capturedCtrl: ReturnType<typeof useWorkoutController> | null = null;

    const Harness: React.FC = () => {
        const ctrl = useWorkoutController(noop, noop);
        capturedCtrl = ctrl;
        const exercises = useStore((s) => s.activeSession?.exercises ?? []);
        return (
            <Profiler id="workout-list" onRender={onRender}>
                <div>
                    {exercises.map((exercise, index) => (
                        <Profiler key={exercise.instanceId} id={`card-${exercise.instanceId}`} onRender={onRender}>
                            <SortableExerciseCard
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
                                t={TRANSLATIONS.es as any}
                                lang="es"
                                supersetColorIndex={undefined}
                                isLinkingTarget={false}
                                config={STABLE_CONFIG as any}
                                stageConfig={STABLE_STAGE_CONFIG as any}
                                dragEnabled={true}
                                logs={STABLE_LOGS}
                            />
                        </Profiler>
                    ))}
                </div>
            </Profiler>
        );
    };

    const updateCommits = (id: string) => hits.filter(h => h.id === id && h.phase === 'update');
    const updateMs = (id: string) => updateCommits(id).reduce((sum, h) => sum + h.actualDuration, 0);

    const logSummary = (scenario: string) => {
        if (process.env.IRONLOG_PROFILER_LOG !== '1') return;
        // eslint-disable-next-line no-console
        console.log(
            `[profiler] ${scenario} | ` +
            [1, 2, 3, 4].map(i => `card-${i}: ${updateCommits(`card-${i}`).length} visits/${updateMs(`card-${i}`).toFixed(2)}ms`).join(' | ') +
            ` | list: ${updateCommits('workout-list').length} visits/${updateMs('workout-list').toFixed(2)}ms`
        );
    };

    beforeEach(() => {
        hits.length = 0;
        capturedCtrl = null;
        useStore.setState({ isStoreLoading: false, activeMeso: null } as any);
        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Profiler Session',
                startTime: Date.now(),
                dayIdx: 0,
                mesoId: 1,
                week: 1,
                exercises: [
                    makeExercise(1, 'Bench Press'),
                    makeExercise(2, 'Incline Dumbbell'),
                    makeExercise(3, 'Overhead Press'),
                    makeExercise(4, 'Lateral Raise'),
                ],
            } as any,
        });
    });

    it('Caso A: editing a set commits only the edited card', async () => {
        render(
            <AppProvider>
                <Harness />
            </AppProvider>
        );
        await waitFor(() => expect(capturedCtrl).not.toBeNull());
        hits.length = 0;

        // Flush late post-mount effects so the window only measures the edits.
        await act(async () => {});
        hits.length = 0;

        // Repeat the edit so scheduling noise averages out: totals compare
        // ~5 real renders against ~5 memo bailouts instead of single samples.
        for (let i = 0; i < 5; i++) {
            act(() => {
                capturedCtrl!.handleSetUpdate(1, 101, 'weight', String(85 + i));
            });
        }

        expect(useStore.getState().activeSession?.exercises?.[0]?.sets?.[0]?.weight).toBe('89');

        // The edited card did real render work; siblings only paid memo-bailout
        // overhead (visits with ~zero duration, no subtree render). Relative
        // assertions only: absolute timings flake under parallel-suite load.
        expect(updateCommits('card-1').length).toBeGreaterThanOrEqual(1);
        expect(updateMs('card-1')).toBeGreaterThan(0);
        for (const id of ['card-2', 'card-3', 'card-4']) {
            expect(updateMs(id)).toBeLessThan(updateMs('card-1'));
        }
        logSummary('caso A (edit weight card-1 x5)');
    });

    it('Caso B: completing a set commits only the completed card', async () => {
        render(
            <AppProvider>
                <Harness />
            </AppProvider>
        );
        await waitFor(() => expect(capturedCtrl).not.toBeNull());
        // Flush late post-mount effects so the window only measures the toggles.
        await act(async () => {});
        hits.length = 0;

        // Repeat the toggle so scheduling noise averages out (odd count ends
        // on completed=true).
        for (let i = 0; i < 5; i++) {
            act(() => {
                capturedCtrl!.toggleSetComplete(1, 101);
            });
        }

        expect(useStore.getState().activeSession?.exercises?.[0]?.sets?.[0]?.completed).toBe(true);

        expect(updateCommits('card-1').length).toBeGreaterThanOrEqual(1);
        expect(updateMs('card-1')).toBeGreaterThan(0);
        for (const id of ['card-2', 'card-3', 'card-4']) {
            expect(updateMs(id)).toBeLessThan(updateMs('card-1'));
        }
        logSummary('caso B (toggle complete card-1 x5)');
    });
});
