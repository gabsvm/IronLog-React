import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { triggerHaptic } from '../../utils/audio';

interface WorkoutSortableListProps {
    itemIds: number[];
    onReorder: (oldIndex: number, newIndex: number) => void;
    children: React.ReactNode;
}

const WorkoutSortableListComponent: React.FC<WorkoutSortableListProps> = ({
    itemIds,
    onReorder,
    children,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = React.useCallback((_event: DragStartEvent) => {
        triggerHaptic('light');
    }, []);

    const handleDragEnd = React.useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = itemIds.findIndex((id) => id === active.id);
        const newIndex = itemIds.findIndex((id) => id === over.id);

        if (oldIndex >= 0 && newIndex >= 0) {
            onReorder(oldIndex, newIndex);
        }
    }, [itemIds, onReorder]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="workout-sortable-stack space-y-2.5">
                    {children}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default WorkoutSortableListComponent;
