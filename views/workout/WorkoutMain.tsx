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
import { pickLang } from '../../utils/i18n';
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

    const focusedRailItem = focusedIdx >= 0 ? railItems[focusedIdx] : null;
    // Next unfinished exercise after the focused one, wrapping to earlier skipped ones.
    const nextExercise = focusedIdx >= 0
        ? [...railItems.slice(focusedIdx + 1), ...railItems.slice(0, focusedIdx)].find((item) => !item.complete) ?? null
        : null;

    const scrollPanelIntoView = () => {
        panelRef.current?.scrollIntoView({ block: 'start' });
    };
    const selectExercise = (instanceId: number) => {
        setActiveExerciseId(instanceId);
        // Let the newly focused card mount its expanded view first.
        requestAnimationFrame(scrollPanelIntoView);
    };
    const goNext = () => {
        if (nextExercise) selectExercise(nextExercise.instanceId);
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
                        <WorkoutTimer startTime={activeSession.startTime} className="block text-xs font-medium tabular-nums text-muted" />
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
                        className={`${remainingSets === 0 ? 'gl-primary' : 'gl-quiet'} relative !min-h-[40px] shrink-0 !px-3.5 text-xs font-semibold active:scale-95`}
                    >
                        {t.finish}
                    </button>
                </div>
                <div role="progressbar" aria-label={t.yourSession} aria-valuemin={0} aria-valuemax={totalWorkingSets || 1} aria-valuenow={completedWorkingSets} className="h-1 w-full bg-surface-elevated">
                    <div className="h-full bg-primary-500 transition-[width] duration-300 ease-natural effects-reduced:transition-none" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div id="tut-exercise-list" className="flex-1 overflow-y-auto scroll-container px-3 space-y-2.5" style={{ paddingTop: 'calc(1rem + var(--rest-pill-top-offset, 0px))', paddingBottom: 'calc(3rem + var(--safe-area-bottom) + var(--rest-pill-height, 0px) + 16px)' }}>
                    <div className="lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start lg:gap-4">
                        <WorkoutExerciseRail
                            items={railItems}
                            activeId={focusedId}
                            onSelect={selectExercise}
                            navLabel={w.exerciseNav}
                            setsOfWord={t.timer.ofWord}
                        />

                        <div ref={panelRef} className="min-w-0 scroll-mt-24 space-y-2.5">
                            {linkingId && (
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-3 text-cyan-200 shadow-lg backdrop-blur-md">
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <Icon name="Link" size={16} className="text-cyan-400 shrink-0" />
                                        <span>{pickLang(lang, { es: 'Toca "Unir aquí" en el ejercicio a emparejar', en: 'Tap "Pair here" on the exercise to link' })}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLinkingId(null)}
                                        className="shrink-0 rounded-full border border-cyan-500/30 bg-surface-base px-3 py-1 text-xs font-bold text-white hover:bg-surface-elevated transition-colors"
                                    >
                                        {t.cancel || pickLang(lang, { es: 'Cancelar', en: 'Cancel' })}
                                    </button>
                                </div>
                            )}

                            {partnerExercise && !linkingId && (
                                <button
                                    type="button"
                                    onClick={() => selectExercise(partnerExercise.instanceId)}
                                    className="flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-left transition-colors hover:bg-violet-500/15 active:scale-[0.99]"
                                >
                                    <Icon name="Link" size={14} className="shrink-0 text-violet-300" />
                                    <span className="min-w-0 flex-1 truncate text-xs text-white">
                                        <span className="font-medium text-violet-200">{t.timer.nextInSuperset} · </span>
                                        <span className="font-semibold">{String(getTranslated(partnerExercise.name, lang))}</span>
                                    </span>
                                </button>
                            )}

                            <Suspense fallback={null}>
                                <WorkoutSortableList itemIds={sortableItems} onReorder={handleReorder}>
                                    {sessionExercises.map((ex) => {
                                        const isLinkingMode = !!linkingId;
                                        const isActive = ex.instanceId === focusedId;
                                        const isVisible = isLinkingMode || isActive;
                                        const isExpanded = isLinkingMode ? ex.instanceId === linkingId : isActive;
                                        const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                        const isLinkingTarget = isLinkingMode && linkingId !== ex.instanceId;

                                        return (
                                            <div key={ex.instanceId} className={isVisible ? undefined : 'hidden'} aria-hidden={isVisible ? undefined : true}>
                                                <SortableExerciseCard
                                                    exercise={ex}
                                                    isExpanded={isExpanded}
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

                            {/* Once the focused exercise is complete, the next step becomes the primary action. */}
                            {focusedRailItem?.complete && (nextExercise ? (
                                <button type="button" onClick={goNext} className="gl-primary w-full !min-h-[52px] text-[15px]" aria-label={`${t.timer.nextExercise}: ${nextExercise.label}`}>
                                    <span className="min-w-0 truncate">{t.timer.nextExercise} · {nextExercise.label}</span>
                                    <Icon name="ArrowRight" size={18} />
                                </button>
                            ) : remainingSets === 0 && (
                                <button type="button" onClick={() => setShowFinishModal(true)} className="gl-primary w-full !min-h-[52px] text-[15px]">
                                    {t.finishSession}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setAddingExercise(true)}
                        className="w-full lg:mx-auto lg:max-w-5xl flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-border-strong bg-surface-raised/40 text-xs font-semibold text-muted hover:text-white hover:border-zinc-500 transition-colors active:scale-98"
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
