import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { SessionExercise, WorkoutSet } from '../../types';
import { SortableExerciseRow } from '../../components/workout/ReorderExercisesSheet';

// jsdom ships no Tailwind, so mirror the two utilities the row may carry.
// If the row regresses to `transition-all`, the computed value becomes 'all'.
const TRANSITION_MIRROR = `
.transition-all { transition-property: all; transition-duration: 150ms; }
.transition-shadow { transition-property: box-shadow; transition-duration: 150ms; }
`;

const makeExercise = (instanceId: number): SessionExercise => ({
    id: `ex_${instanceId}`,
    instanceId,
    name: `Exercise ${instanceId}`,
    muscle: 'CHEST',
    sets: [
        { id: 1, type: 'regular', weight: 80, reps: 10, completed: false },
        { id: 2, type: 'regular', weight: 80, reps: 10, completed: true },
    ] as WorkoutSet[],
});

const Harness: React.FC<{ onDragStart?: () => void }> = ({ onDragStart }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
    );
    const exercises = [makeExercise(1), makeExercise(2), makeExercise(3)];
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart}>
            <SortableContext
                items={exercises.map(e => e.instanceId)}
                strategy={verticalListSortingStrategy}
            >
                <div>
                    {exercises.map((exercise, index) => (
                        <SortableExerciseRow
                            key={exercise.instanceId}
                            exercise={exercise}
                            index={index}
                            lang="en"
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

describe('K1: reorder drag does not fight CSS transitions', () => {
    beforeEach(() => {
        const style = document.createElement('style');
        style.textContent = TRANSITION_MIRROR;
        document.head.appendChild(style);
    });

    it('active row computed transition-property is NOT all during a real pointer drag', () => {
        const onDragStart = vi.fn();
        render(<Harness onDragStart={onDragStart} />);

        const handle = screen.getByRole('button', { name: 'Move Exercise 2' });
        const row = handle.parentElement as HTMLElement;
        expect(row).not.toBeNull();

        // At rest the row already avoids transition-all.
        expect(getComputedStyle(row).transitionProperty).not.toBe('all');

        // Real dnd-kit activation: pointer down on the handle, then move past
        // the 4px distance constraint.
        fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, button: 0, isPrimary: true });
        act(() => {
            fireEvent.pointerMove(handle, { clientX: 100, clientY: 120, isPrimary: true });
        });

        // The drag genuinely activated through dnd-kit's sensor pipeline.
        expect(onDragStart).toHaveBeenCalledTimes(1);
        // ...and the row must not animate `all` while dnd-kit drives transform.
        // (jsdom has no layout, so useSortable yields no inline transform here;
        // isDragging is what toggles the active styling.)
        expect(getComputedStyle(row).transitionProperty).not.toBe('all');
        expect(getComputedStyle(row).transitionProperty).toBe('box-shadow');

        act(() => {
            fireEvent.pointerUp(handle, { clientX: 100, clientY: 120 });
        });
    });
});
