import React, { Profiler } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
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

const renderImplSpy = vi.fn();
vi.mock('../../components/workout/SortableExerciseCardImpl', () => ({
    SortableExerciseCard: (props: any) => {
        renderImplSpy(props.exercise.instanceId);
        return <div data-testid={`card-${props.exercise.instanceId}`}>{props.exercise.name}</div>;
    },
}));

describe('R1: Workout Render Isolation', () => {
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

    it('does not re-render exercise card B when set in exercise card A is edited', () => {
        renderImplSpy.mockClear();

        const exA = makeExercise(1, 'Bench Press');
        const exB = makeExercise(2, 'Incline Dumbbell');

        const stableHandlers = {
            onSetUpdate: vi.fn(),
            onSetComplete: vi.fn(),
            onSetTypeChange: vi.fn(),
            onAddSet: vi.fn(),
            onDeleteSet: vi.fn(),
            onToggleExpand: vi.fn(),
            onOpenDetail: vi.fn(),
            onLink: vi.fn(),
            onReplace: vi.fn(),
            onEditMuscle: vi.fn(),
            onUpdateSession: vi.fn(),
            onOpenWarmup: vi.fn(),
            openMenuId: null,
            setOpenMenuId: vi.fn(),
            linkingId: null,
            t: { types: {}, typeDesc: {} },
            lang: 'es' as const,
            supersetColorIndex: undefined,
            isLinkingTarget: false,
            config: { showRIR: true },
            stageConfig: null,
            dragEnabled: true,
            logs: [],
        };

        const TestHarness: React.FC<{ exerciseA: SessionExercise; exerciseB: SessionExercise }> = ({
            exerciseA,
            exerciseB,
        }) => (
            <div>
                <SortableExerciseCard
                    {...stableHandlers}
                    exercise={exerciseA}
                    isExpanded={true}
                />
                <SortableExerciseCard
                    {...stableHandlers}
                    exercise={exerciseB}
                    isExpanded={false}
                />
            </div>
        );

        const { rerender } = render(<TestHarness exerciseA={exA} exerciseB={exB} />);

        // Both cards render on initial mount
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 1)).toHaveLength(1);
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 2)).toHaveLength(1);

        // Simulate updating Set 1 of Exercise A (e.g. typing 85kg)
        // Exercise A gets a new object reference; Exercise B stays identical.
        const updatedExA: SessionExercise = {
            ...exA,
            sets: [
                { ...exA.sets[0], weight: '85' },
                exA.sets[1],
            ],
        };

        rerender(<TestHarness exerciseA={updatedExA} exerciseB={exB} />);

        // Card A re-renders because its data changed
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 1)).toHaveLength(2);
        // Card B MUST NOT re-render because its props and handlers are stable
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 2)).toHaveLength(1);
    });

    it('demonstrates that unstable handlers would break memoization for Card B', () => {
        renderImplSpy.mockClear();

        const exA = makeExercise(1, 'Bench Press');
        const exB = makeExercise(2, 'Incline Dumbbell');

        let onSetCompleteCallCount = 0;
        const createUnstableHandlers = () => ({
            onSetUpdate: vi.fn(),
            onSetComplete: () => { onSetCompleteCallCount++; }, // New function reference every render
            onSetTypeChange: vi.fn(),
            onAddSet: vi.fn(),
            onDeleteSet: vi.fn(),
            onToggleExpand: vi.fn(),
            onOpenDetail: vi.fn(),
            onLink: vi.fn(),
            onReplace: vi.fn(),
            onEditMuscle: vi.fn(),
            onUpdateSession: vi.fn(),
            onOpenWarmup: vi.fn(),
            openMenuId: null,
            setOpenMenuId: vi.fn(),
            linkingId: null,
            t: { types: {}, typeDesc: {} },
            lang: 'es' as const,
            supersetColorIndex: undefined,
            isLinkingTarget: false,
            config: { showRIR: true },
            stageConfig: null,
            dragEnabled: true,
            logs: [],
        });

        const UnstableHarness: React.FC<{ exerciseA: SessionExercise; exerciseB: SessionExercise }> = ({
            exerciseA,
            exerciseB,
        }) => {
            const handlers = createUnstableHandlers();
            return (
                <div>
                    <SortableExerciseCard {...handlers} exercise={exerciseA} isExpanded={true} />
                    <SortableExerciseCard {...handlers} exercise={exerciseB} isExpanded={false} />
                </div>
            );
        };

        const { rerender } = render(<UnstableHarness exerciseA={exA} exerciseB={exB} />);
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 2)).toHaveLength(1);

        // When parent re-renders with new unstable handler references, Card B is forced to re-render
        rerender(<UnstableHarness exerciseA={{ ...exA }} exerciseB={exB} />);
        expect(renderImplSpy.mock.calls.filter(c => c[0] === 2)).toHaveLength(2);
    });
});
