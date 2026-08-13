import React, { useEffect, useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SessionExercise } from '../../types';
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

interface ReorderExercisesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercises: SessionExercise[];
    lang: 'en' | 'es';
    onCommit: (exercises: SessionExercise[]) => void;
}

interface SortableExerciseRowProps {
    exercise: SessionExercise;
    index: number;
    lang: 'en' | 'es';
}

const SortableExerciseRow: React.FC<SortableExerciseRowProps> = ({ exercise, index, lang }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: exercise.instanceId });

    const completed = (exercise.sets || []).filter(set => set.completed && !set.skipped).length;
    const total = (exercise.sets || []).filter(set => set.type !== 'avt_hop').length;

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                zIndex: isDragging ? 20 : 1,
            }}
            className={`flex min-h-[72px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition-shadow ${
                isDragging
                    ? 'border-primary-500/40 bg-[rgb(var(--surface-elevated))] shadow-xl shadow-black/20'
                    : 'border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-raised)/0.72)]'
            }`}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--surface-elevated))] text-xs font-black tabular-nums text-zinc-500">
                {index + 1}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black tracking-tight text-zinc-950 dark:text-white">
                    {getTranslated(exercise.name, lang)}
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    <span className="truncate">{String(exercise.slotLabel || exercise.muscle || '')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0 normal-case tracking-normal">
                        {completed}/{total} {lang === 'es' ? 'series' : 'sets'}
                    </span>
                </div>
            </div>

            <button
                type="button"
                {...attributes}
                {...listeners}
                className="flex h-12 w-12 shrink-0 touch-none items-center justify-center rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-zinc-500 shadow-sm transition-colors active:text-primary-500 dark:text-zinc-300"
                aria-label={lang === 'es'
                    ? `Mover ${getTranslated(exercise.name, lang)}`
                    : `Move ${getTranslated(exercise.name, lang)}`}
            >
                <Icon name="GripVertical" size={22} strokeWidth={2.5} />
            </button>
        </div>
    );
};

export const ReorderExercisesSheet: React.FC<ReorderExercisesSheetProps> = ({
    open,
    onOpenChange,
    exercises,
    lang,
    onCommit,
}) => {
    const [draft, setDraft] = useState<SessionExercise[]>(exercises);

    useEffect(() => {
        if (open) setDraft(exercises);
    }, [open, exercises]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const ids = useMemo(() => draft.map(exercise => exercise.instanceId), [draft]);

    const handleDragStart = (_event: DragStartEvent) => {
        triggerHaptic('light');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setDraft(current => {
            const oldIndex = current.findIndex(exercise => exercise.instanceId === active.id);
            const newIndex = current.findIndex(exercise => exercise.instanceId === over.id);
            if (oldIndex < 0 || newIndex < 0) return current;
            return arrayMove(current, oldIndex, newIndex);
        });
        triggerHaptic('medium');
    };

    const save = () => {
        onCommit(draft);
        triggerHaptic('success');
        onOpenChange(false);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={lang === 'es' ? 'Ordenar ejercicios' : 'Reorder exercises'}
            description={lang === 'es'
                ? 'Arrastra el asa de la derecha para cambiar el orden del entrenamiento.'
                : 'Drag the handle on the right to change workout order.'}
            accent="primary"
            footer={(
                <button
                    type="button"
                    onClick={save}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 font-black text-black transition-transform active:scale-[0.98]"
                >
                    <Icon name="Check" size={18} strokeWidth={2.5} />
                    {lang === 'es' ? 'Guardar orden' : 'Save order'}
                </button>
            )}
        >
            <div className="px-4 pb-8 pt-2">
                <div className="mb-4 rounded-2xl bg-primary-500/8 px-4 py-3 text-xs font-medium leading-relaxed text-zinc-500">
                    {lang === 'es'
                        ? 'Mantén el asa ≡ y arrastra cada ejercicio a su nueva posición. Los pesos, series y superseries no cambian.'
                        : 'Hold the ≡ handle and drag each exercise to its new position. Weights, sets and supersets stay unchanged.'}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {draft.map((exercise, index) => (
                                <SortableExerciseRow
                                    key={exercise.instanceId}
                                    exercise={exercise}
                                    index={index}
                                    lang={lang}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </Sheet>
    );
};
