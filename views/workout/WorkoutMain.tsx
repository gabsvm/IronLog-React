// S6: header + exercise list, moved verbatim from views/WorkoutViewImpl.tsx.
// Phase 4: focused mode — exercise rail (horizontal mobile / lateral desktop)
// governed by the existing activeExerciseId; a single main panel reusing the
// current cards/set-rows; docked rest reusing TimerContext.
import React, { Suspense, useMemo, useRef } from 'react';
import { Icon } from '../../components/ui/Icon';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { WorkoutExerciseRail } from '../../components/workout/WorkoutExerciseRail';
import type { WorkoutRailItem } from '../../components/workout/WorkoutExerciseRail';
import { WorkoutRestDock } from '../../components/workout/WorkoutRestDock';
import { WorkoutTimer } from '../../components/workout/WorkoutTimer';
import { getTranslated } from '../../utils';
import { isWorkingSet } from '../../utils/workoutProgress';
import type { WorkoutViewState } from './useWorkoutViewState';

const WorkoutSortableList = React.lazy(() => import('../../components/workout/WorkoutSortableList'));

export const WorkoutMain: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const { onBack, onOpenReorder, sessionExercises, openMenuId, setOpenMenuId, setShowFinishModal, setReplacingExId, setAddingExercise, linkingId, setLinkingId, setEditingMuscleId, setWarmupExId, setDetailExercise, handleSetUpdate, handleAddSet, handleDeleteSet, updateSession, exercises, logs, lang, config, activeSession, t, w, stageConfig, isCalisthenicsSession, supersetColorIndexes, handleSetTypeChange, sortableItems, activeExerciseId, setActiveExerciseId, handleToggleExpand, handleSetComplete, handleReorder, remainingSets, progressPct, completedWorkingSets, totalWorkingSets, quickAccessExercise } = state;
    const panelRef = useRef<HTMLDivElement>(null);

    const focusedId = useMemo(() => {
        if (activeExerciseId !== null && sessionExercises.some((ex) => ex.instanceId === activeExerciseId)) {
            return activeExerciseId;
        }
        return quickAccessExercise?.instanceId ?? sessionExercises[0]?.instanceId ?? null;
    }, [activeExerciseId, quickAccessExercise?.instanceId, sessionExercises]);
    const focusedIdx = useMemo(
        () => sessionExercises.findIndex((ex) => ex.instanceId === focusedId),
        [sessionExercises, focusedId],
    );
    const focusedExercise = focusedIdx >= 0 ? sessionExercises[focusedIdx] : null;
    const railItems: WorkoutRailItem[] = useMemo(() => sessionExercises.map((ex) => {
        const working = (ex.sets || []).filter(isWorkingSet);
        const done = working.filter((s) => s.completed).length;
        return {
            instanceId: ex.instanceId,
            label: String(getTranslated(ex.name, lang)),
            done,
            total: working.length,
            superset: Boolean(ex.supersetId),
            complete: working.length > 0 && done >= working.length,
        };
    }), [sessionExercises, lang]);
    const partnerExercise = useMemo(() => {
        if (!focusedExercise?.supersetId) return null;
        return sessionExercises.find((ex) => ex.supersetId === focusedExercise.supersetId && ex.instanceId !== focusedExercise.instanceId) || null;
    }, [sessionExercises, focusedExercise]);

    if (!activeSession) return null;

    const scrollPanelIntoView = () => {
        panelRef.current?.scrollIntoView({ block: 'start' });
    };
    const selectExercise = (instanceId: number) => {
        setActiveExerciseId(instanceId);
        // Let the newly focused card mount its expanded view first.
        requestAnimationFrame(scrollPanelIntoView);
    };
    const goPrev = () => {
        if (focusedIdx > 0) selectExercise(sessionExercises[focusedIdx - 1].instanceId);
    };
    const goNext = () => {
        if (focusedIdx >= 0 && focusedIdx < sessionExercises.length - 1) {
            selectExercise(sessionExercises[focusedIdx + 1].instanceId);
        }
    };

    return (
        <>
            {/* --- Reference-driven Compact Header --- */}
            <div className="z-30 border-b border-border-subtle pt-safe bg-surface-base/95 backdrop-blur-md">
                <div className="flex h-14 items-center justify-between gap-2.5 px-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="relative flex h-11 w-11 after:absolute after:-inset-1 after:content-[''] shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors active:bg-surface-raised hover:text-white"
                        aria-label={t.back}
                    >
                        <Icon name="ChevronLeft" size={22} strokeWidth={2.5} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="truncate text-sm sm:text-base font-bold leading-tight text-white">
                            {isCalisthenicsSession
                                ? t.calisthenicsSession
                                : (activeSession.week >= 1
                                    ? activeSession.name.replace(new RegExp(`^${activeSession.week}\\s*[•·-]\\s*`), '')
                                    : activeSession.name)}
                        </h1>
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="min-w-0 truncate text-xs text-muted">
                            {activeSession.week >= 1 ? `${t.week} ${activeSession.week} · ` : ''}
                            {remainingSets === 0
                                ? t.allDone
                                : `${remainingSets} ${t.setsLeft}`}
                        </div>
                        </div>
                    </div>

                    

                    {onOpenReorder && sessionExercises.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenReorder();
                            }}
                            className="relative flex h-11 w-11 after:absolute after:-inset-1.5 after:content-[''] shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white active:bg-surface-raised"
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
                        className="relative flex h-11 w-11 after:absolute after:-inset-1.5 after:content-[''] shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white active:bg-surface-raised"
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
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div id="tut-exercise-list" className="flex-1 overflow-y-auto scroll-container px-3 space-y-2.5" style={{ paddingTop: 'calc(1rem + var(--rest-pill-top-offset, 0px))', paddingBottom: 'calc(3rem + var(--safe-area-bottom) + var(--rest-pill-height, 0px) + 16px)' }}>
                    <section aria-label={t.yourSession} className="tonal-3 flex items-center gap-4 rounded-3xl border border-border-subtle px-4 py-3.5">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-normal text-[rgb(var(--text-muted))]">{t.yourSession}</p>
                            <WorkoutTimer startTime={activeSession.startTime} className="text-3xl font-black leading-tight text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-right text-xs font-semibold tabular-nums text-secondary">
                                <span className="text-sm text-white">{completedWorkingSets}</span> {t.setsDoneOf} {totalWorkingSets} {t.sets.toLowerCase()}
                            </p>
                            <div role="progressbar" aria-label={t.yourSession} aria-valuemin={0} aria-valuemax={totalWorkingSets || 1} aria-valuenow={completedWorkingSets} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                                <div className="h-full rounded-full bg-primary-500 transition-[width] duration-300 ease-natural effects-reduced:transition-none" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
                            </div>
                        </div>
                    </section>

                    <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start lg:gap-4">
                        <WorkoutExerciseRail
                            items={railItems}
                            activeId={focusedId}
                            onSelect={selectExercise}
                            navLabel={w.exerciseNav}
                            setsOfWord={t.timer.ofWord}
                        />

                        <div ref={panelRef} className="min-w-0 scroll-mt-24 space-y-2.5">
                            {focusedExercise && sessionExercises.length > 1 && (
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        disabled={focusedIdx <= 0}
                                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle bg-surface-raised/40 px-3 text-xs font-bold text-muted transition-colors hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label={w.prevExercise}
                                        title={w.prevExercise}
                                    >
                                        <Icon name="ChevronLeft" size={16} strokeWidth={2.5} />
                                    </button>
                                    <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold tabular-nums text-muted" aria-live="polite">
                                        {focusedIdx + 1} {t.timer.ofWord} {sessionExercises.length}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={focusedIdx < 0 || focusedIdx >= sessionExercises.length - 1}
                                        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 justify-center rounded-full border border-border-subtle bg-surface-raised/40 px-3 text-xs font-bold text-muted transition-colors hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label={t.timer.nextExercise}
                                        title={t.timer.nextExercise}
                                    >
                                        <span className="hidden sm:inline">{t.timer.nextExercise}</span>
                                        <Icon name="ChevronRight" size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}

                            {partnerExercise && (
                                <button
                                    type="button"
                                    onClick={() => selectExercise(partnerExercise.instanceId)}
                                    className="flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-left transition-colors hover:bg-violet-500/15 active:scale-[0.99]"
                                >
                                    <Icon name="Link" size={14} className="shrink-0 text-violet-300" />
                                    <span className="min-w-0 flex-1 truncate text-xs text-white">
                                        <span className="font-bold uppercase tracking-wider text-violet-200">{t.timer.nextInSuperset} · </span>
                                        <span className="font-semibold">{String(getTranslated(partnerExercise.name, lang))}</span>
                                    </span>
                                </button>
                            )}

                            <Suspense fallback={null}>
                                <WorkoutSortableList itemIds={sortableItems} onReorder={handleReorder}>
                                    {sessionExercises.map((ex) => {
                                        const isActive = ex.instanceId === focusedId;
                                        const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                        const isLinkingTarget = !!linkingId && linkingId !== ex.instanceId;

                                        return (
                                            <div key={ex.instanceId} className={isActive ? undefined : 'hidden'} aria-hidden={isActive ? undefined : true}>
                                                <SortableExerciseCard
                                                    exercise={ex}
                                                    isExpanded={ex.instanceId === focusedId}
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
                                                    dragEnabled={false}
                                                    logs={logs}
                                                    library={exercises}
                                                    tutorialId={isActive ? 'tut-set-type' : undefined}
                                                />
                                            </div>
                                        );
                                    })}
                                </WorkoutSortableList>
                            </Suspense>

                            <WorkoutRestDock />
                        </div>
                    </div>

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
