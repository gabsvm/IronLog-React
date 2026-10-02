import React, { useEffect, useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
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
import { isWorkingSet } from '../../utils/workoutProgress';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';

interface ReorderExercisesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercises: SessionExercise[];
    lang: 'en' | 'es';
    onCommit: (exercises: SessionExercise[]) => void;
    methodologyWarning?: string;
}

interface SortableExerciseRowProps {
    exercise: SessionExercise;
    index: number;
    lang: 'en' | 'es';
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    supersetLabel?: string;
}

export const SortableExerciseRow: React.FC<SortableExerciseRowProps> = ({
    exercise,
    index,
    lang,
    isFirstInGroup,
    isLastInGroup,
    supersetLabel,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: exercise.instanceId });

    const completed = (exercise.sets || []).filter(set => isWorkingSet(set) && set.completed && !set.skipped).length;
    const total = (exercise.sets || []).filter(set => isWorkingSet(set)).length;

    return (
        <div>
            {isFirstInGroup && supersetLabel && (
                <div className="text-[11px] font-semibold tracking-wider uppercase text-[#afa9ec] px-1 pt-3 pb-1">
                    {supersetLabel}
                </div>
            )}
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    zIndex: isDragging ? 30 : 1,
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 transition-shadow ${
                    exercise.supersetId
                        ? 'border-l-[3px] border-l-[#7f77dd] border-t border-r border-b border-border-subtle bg-surface-raised'
                        : 'card-reference my-1'
                } ${
                    exercise.supersetId
                        ? isFirstInGroup && isLastInGroup
                            ? 'rounded-xl'
                            : isFirstInGroup
                            ? 'rounded-t-xl border-b-0'
                            : isLastInGroup
                            ? 'rounded-b-xl'
                            : 'rounded-none border-b-0'
                        : 'rounded-xl'
                } ${
                    isDragging ? 'opacity-30' : ''
                }`}
            >
                <span className="w-5 text-center text-xs text-muted shrink-0 tabular-nums font-medium">
                    {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                        {getTranslated(exercise.name, lang)}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                        {String(exercise.slotLabel || exercise.muscle || '')}
                    </div>
                </div>

                <span className="text-xs text-muted shrink-0 tabular-nums px-1">
                    {completed}/{total}
                </span>

                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="w-9 h-9 flex items-center justify-center text-muted hover:text-white shrink-0 touch-none active:text-primary-400 rounded-lg hover:bg-surface-elevated/40"
                    aria-label={lang === 'es'
                        ? `Mover ${getTranslated(exercise.name, lang)}`
                        : `Move ${getTranslated(exercise.name, lang)}`}
                >
                    <Icon name="GripVertical" size={18} />
                </button>
            </div>
        </div>
    );
};

export function buildSupersetLetterMap(exercises: SessionExercise[]): Map<string, string> {
    const map = new Map<string, string>();
    let currentCode = 65; // 'A'
    for (const ex of exercises) {
        if (ex.supersetId && !map.has(ex.supersetId)) {
            map.set(ex.supersetId, String.fromCharCode(currentCode));
            currentCode++;
        }
    }
    return map;
}

export function reorderSupersetExercises(
    current: SessionExercise[],
    activeId: number | string,
    overId: number | string
): SessionExercise[] {
    const oldIndex = current.findIndex(exercise => exercise.instanceId === activeId);
    const newIndex = current.findIndex(exercise => exercise.instanceId === overId);
    if (oldIndex < 0 || newIndex < 0) return current;

    const activeItem = current[oldIndex];
    // If the item belongs to a superset, keep that superset contiguous
    if (activeItem.supersetId) {
        const ssId = activeItem.supersetId;
        const ssIndices = current
            .map((ex, idx) => (ex.supersetId === ssId ? idx : -1))
            .filter(idx => idx !== -1);

        const isContiguous = ssIndices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
        if (isContiguous && ssIndices.length > 1) {
            const ssItems = current.filter(ex => ex.supersetId === ssId);
            const remaining = current.filter(ex => ex.supersetId !== ssId);
            let insertIndex = remaining.findIndex(ex => ex.instanceId === overId);
            if (insertIndex < 0) {
                insertIndex = newIndex > oldIndex ? remaining.length : 0;
            } else if (newIndex > oldIndex) {
                insertIndex += 1;
            }
            const next = [...remaining];
            next.splice(insertIndex, 0, ...ssItems);
            return next;
        }
    }

    return arrayMove(current, oldIndex, newIndex);
}

export const ReorderExercisesSheet: React.FC<ReorderExercisesSheetProps> = ({
    open,
    onOpenChange,
    exercises,
    lang,
    onCommit,
    methodologyWarning,
}) => {
    const [draft, setDraft] = useState<SessionExercise[]>(exercises);
    const [activeExercise, setActiveExercise] = useState<SessionExercise | null>(null);

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

    const supersetLetterMap = useMemo(() => buildSupersetLetterMap(draft), [draft]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveExercise(draft.find(exercise => exercise.instanceId === event.active.id) || null);
        triggerHaptic('light');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveExercise(null);
        if (!over || active.id === over.id) return;

        setDraft(current => reorderSupersetExercises(current, active.id, over.id));
        triggerHaptic('medium');
    };

    const handleDragCancel = () => {
        setActiveExercise(null);
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
                ? 'Arrastra desde el asa. Las superseries se mueven juntas.'
                : 'Drag from the handle. Supersets move together.'}
            accent="primary"
            footer={(
                <button
                    type="button"
                    onClick={save}
                    className="w-full h-11 rounded-xl bg-primary-500 font-semibold text-zinc-950 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                    <Icon name="Check" size={18} strokeWidth={2.5} />
                    {lang === 'es' ? 'Guardar orden' : 'Save order'}
                </button>
            )}
        >
            <div className="px-4 pb-8 pt-2">
                {methodologyWarning && (
                    <div className="mb-3 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-300">
                        <Icon name="AlertTriangle" size={16} className="mt-0.5 shrink-0 text-amber-400" />
                        <span>{methodologyWarning}</span>
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1" data-vaul-no-drag>
                            {draft.map((exercise, index) => {
                                const prevEx = draft[index - 1];
                                const nextEx = draft[index + 1];
                                const isFirstInGroup = !prevEx || prevEx.supersetId !== exercise.supersetId;
                                const isLastInGroup = !nextEx || nextEx.supersetId !== exercise.supersetId;
                                const ssLetter = exercise.supersetId ? supersetLetterMap.get(exercise.supersetId) : undefined;
                                const supersetLabel = ssLetter
                                    ? (lang === 'es' ? `Superserie ${ssLetter}` : `Superset ${ssLetter}`)
                                    : undefined;

                                return (
                                    <SortableExerciseRow
                                        key={exercise.instanceId}
                                        exercise={exercise}
                                        index={index}
                                        lang={lang}
                                        isFirstInGroup={isFirstInGroup}
                                        isLastInGroup={isLastInGroup}
                                        supersetLabel={supersetLabel}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                        {activeExercise ? (
                            <div className="card-reference flex items-center gap-2.5 rounded-xl px-3 py-2.5 shadow-2xl shadow-black/60 ring-2 ring-primary-500">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                        {getTranslated(activeExercise.name, lang)}
                                    </div>
                                    <div className="text-xs text-muted truncate mt-0.5">
                                        {(activeExercise.sets || []).filter(set => isWorkingSet(set) && set.completed && !set.skipped).length}
                                        /
                                        {(activeExercise.sets || []).filter(set => isWorkingSet(set)).length}
                                    </div>
                                </div>
                                <Icon name="GripVertical" size={18} className="text-primary-400 shrink-0" />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </Sheet>
    );
};
