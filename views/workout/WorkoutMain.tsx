// S6: header + exercise list, moved verbatim from views/WorkoutViewImpl.tsx.
import React, { Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { WorkoutTimer } from '../../components/workout/WorkoutTimer';
import type { WorkoutViewState } from './useWorkoutViewState';

const WorkoutSortableList = React.lazy(() => import('../../components/workout/WorkoutSortableList'));

export const WorkoutMain: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const { onBack, onOpenReorder, sessionExercises, openMenuId, setOpenMenuId, setShowFinishModal, setReplacingExId, setAddingExercise, linkingId, setLinkingId, setEditingMuscleId, setWarmupExId, setDetailExercise, handleSetUpdate, handleAddSet, handleDeleteSet, updateSession, exercises, logs, lang, config, activeSession, t, w, stageConfig, isCalisthenicsSession, supersetColorIndexes, handleSetTypeChange, sortableItems, activeExerciseId, handleToggleExpand, handleSetComplete, handleReorder, remainingSets, progressPct } = state;
    if (!activeSession) return null;
    return (
        <>
            {/* --- Reference-driven Compact Header --- */}
            <div className="z-30 border-b border-border-subtle pt-safe bg-surface-base/95 backdrop-blur-md">
                <div className="flex h-14 items-center justify-between gap-2.5 px-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="relative flex h-9 w-9 after:absolute after:-inset-1 after:content-[''] shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors active:bg-surface-raised hover:text-white"
                        aria-label={t.back}
                    >
                        <Icon name="ChevronLeft" size={22} strokeWidth={2.5} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="truncate text-base font-semibold leading-tight text-white">
                            {isCalisthenicsSession
                                ? t.calisthenicsSession
                                : activeSession.name}
                        </h1>
                        <div className="truncate text-xs text-muted">
                            {activeSession.week >= 1 ? `${t.week} ${activeSession.week} · ` : ''}
                            {remainingSets === 0
                                ? t.allDone
                                : `${remainingSets} ${t.setsLeft}`}
                        </div>
                    </div>

                    <WorkoutTimer startTime={activeSession.startTime} />

                    {onOpenReorder && sessionExercises.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenReorder();
                            }}
                            className="relative flex h-8 w-8 after:absolute after:-inset-1.5 after:content-[''] shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white active:bg-surface-raised"
                            title={t.reorderExercises}
                            aria-label={t.reorderExercises}
                        >
                            <Icon name="ArrowUpDown" size={16} strokeWidth={2} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddingExercise(true);
                        }}
                        className="relative flex h-8 w-8 after:absolute after:-inset-1.5 after:content-[''] shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white active:bg-surface-raised"
                        title={t.addExercise}
                        aria-label={t.addExercise}
                    >
                        <Icon name="Plus" size={18} strokeWidth={2.5} />
                    </button>

                    <button
                        id="tut-finish-btn"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowFinishModal(true);
                        }}
                        className="relative flex h-8 after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] shrink-0 items-center justify-center rounded-lg bg-primary-500 px-3.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-primary-400 active:scale-95 shadow-sm"
                    >
                        {t.finish}
                    </button>
                </div>

                {/* Progress bar line */}
                <div className="h-[3px] w-full bg-border-subtle">
                    <div
                        className="h-[3px] bg-primary-500 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div id="tut-exercise-list" className="flex-1 overflow-y-auto scroll-container px-3 pt-2.5 space-y-2.5" style={{ paddingBottom: 'calc(3rem + var(--safe-area-bottom) + var(--rest-pill-height, 0px) + 16px)' }}>
                    <Suspense fallback={null}>
                        <WorkoutSortableList itemIds={sortableItems} onReorder={handleReorder}>
                            {sessionExercises.map((ex, idx) => {
                                const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                const isLinkingTarget = !!linkingId && linkingId !== ex.instanceId;

                                return (
                                    <SortableExerciseCard
                                        key={ex.instanceId}
                                        exercise={ex}
                                        isExpanded={ex.instanceId === activeExerciseId}
                                        onToggleExpand={handleToggleExpand}
                                        onSetUpdate={handleSetUpdate}
                                        onSetComplete={handleSetComplete}
                                        onSetTypeChange={handleSetTypeChange}
                                        onAddSet={handleAddSet}
                                        onDeleteSet={handleDeleteSet}
                                        onOpenDetail={setDetailExercise}
                                        onLink={setLinkingId}
                                        onReplace={setReplacingExId}
                                        onEditMuscle={setEditingMuscleId}
                                        onUpdateSession={updateSession}
                                        onOpenWarmup={setWarmupExId}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        linkingId={linkingId}
                                        t={t}
                                        lang={lang}
                                        supersetColorIndex={supersetColorIndex}
                                        isLinkingTarget={!!isLinkingTarget}
                                        config={config}
                                        stageConfig={stageConfig}
                                        dragEnabled={true}
                                        logs={logs}
                                        library={exercises}
                                        tutorialId={idx === 0 ? 'tut-set-type' : undefined}
                                    />
                                );
                            })}
                        </WorkoutSortableList>
                    </Suspense>

                    <button
                        type="button"
                        onClick={() => setAddingExercise(true)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-border-strong bg-surface-raised/40 text-xs font-semibold text-muted hover:text-white hover:border-zinc-500 transition-colors active:scale-98"
                    >
                        <Icon name="Plus" size={15} />
                        {t.addExercise}
                    </button>

                    <div className="h-6" />
                </div>
            </div>
        </>
    );
};
