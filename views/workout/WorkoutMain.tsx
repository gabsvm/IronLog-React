// S6: header + exercise list, moved verbatim from views/WorkoutViewImpl.tsx.
import React, { Suspense, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { WorkoutTimer } from '../../components/workout/WorkoutTimer';
import { useStore } from '../../lib/store';
import { useTimerState } from '../../context/TimerContext';
import { pickLang } from '../../utils/i18n';
import type { WorkoutViewState } from './useWorkoutViewState';

const WorkoutSortableList = React.lazy(() => import('../../components/workout/WorkoutSortableList'));

export const WorkoutMain: React.FC<{ state: WorkoutViewState }> = ({ state }) => {
    const {
        onBack, onOpenReorder, sessionExercises, openMenuId, setOpenMenuId,
        setShowFinishModal, setReplacingExId, setAddingExercise, linkingId, setLinkingId,
        setEditingMuscleId, setWarmupExId, setDetailExercise, handleSetUpdate, handleAddSet,
        handleDeleteSet, updateSession, exercises, logs, lang, config, activeSession,
        t, w, stageConfig, isCalisthenicsSession, supersetColorIndexes, handleSetTypeChange,
        sortableItems, activeExerciseId, handleToggleExpand, handleSetComplete, handleReorder,
        ctrl
    } = state;

    const activeMeso = useStore(state => state.activeMeso);
    const restTimer = useTimerState();
    const [showCalendarDrawer, setShowCalendarDrawer] = useState(false);
    const [showSessionMenu, setShowSessionMenu] = useState(false);

    if (!activeSession) return null;

    const dayName = isCalisthenicsSession
        ? t.calisthenicsSession
        : (activeSession.week >= 1
            ? activeSession.name.replace(new RegExp(`^${activeSession.week}\\s*[•·-]\\s*`), '')
            : activeSession.name);

    const mesoTitle = (activeMeso as any)?.title || activeMeso?.name || '';
    const totalWeeks = activeMeso?.targetWeeks || activeMeso?.duration || 1;
    const calendarAria = pickLang(lang, { es: 'Semanas y días', en: 'Weeks and days' });

    return (
        <>
            {/* Accessible back button for test runners */}
            {onBack && (
                <button type="button" onClick={onBack} aria-label={t.back} className="sr-only">
                    {t.back}
                </button>
            )}

            {/* --- 1:1 RP Sticky Top Header --- */}
            <div className="z-30 border-b border-border-subtle pt-safe bg-surface-app">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    {/* Left side */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center whitespace-nowrap">
                            {(activeSession as any).isFreestyle ? (
                                <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-white">FREESTYLE</span>
                            ) : (
                                <>
                                    <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-white">
                                        {pickLang(lang, { es: 'SEMANA', en: 'WEEK' })} {activeSession.week}
                                    </span>
                                    <span className="text-[19px] sm:text-[22px] font-black uppercase tracking-tight text-zinc-500 ml-1.5">
                                        {pickLang(lang, { es: 'DÍA', en: 'DAY' })} {(activeSession.dayIdx ?? 0) + 1}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 truncate">
                            <span className="truncate">{dayName}{mesoTitle ? ` · ${mesoTitle}` : ''}</span>
                            <span className="font-mono text-[11px] text-primary-400 flex items-center gap-1 shrink-0">
                                · <WorkoutTimer startTime={activeSession.startTime} />
                            </span>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Rest timer badge */}
                        {restTimer?.active && (
                            <div className="flex items-center gap-1 rounded-full bg-primary-500/15 px-2 py-0.5 text-[11px] font-mono font-bold text-primary-400 border border-primary-500/30">
                                <Icon name="Timer" size={12} />
                                <span>{Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, '0')}</span>
                            </div>
                        )}

                        {/* Calendar button */}
                        <button
                            type="button"
                            onClick={() => setShowCalendarDrawer(true)}
                            aria-label={calendarAria}
                            title={calendarAria}
                            className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-95 transition-all"
                        >
                            <Icon name="Calendar" size={19} />
                        </button>

                        {/* Finish Check / Button */}
                        <button
                            id="tut-finish-btn"
                            data-testid="workout-finish-btn"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFinishModal(true);
                            }}
                            className="relative flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] bg-primary-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-all hover:bg-primary-400 active:scale-95 shadow-sm"
                        >
                            <Icon name="Check" size={14} strokeWidth={3} />
                            <span>{t.finish}</span>
                        </button>

                        {/* More options menu */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSessionMenu(prev => !prev);
                                }}
                                aria-label={(w as any)?.sessionOptionsAria || pickLang(lang, { es: 'Opciones de sesión', en: 'Session options' })}
                                className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-95 transition-all"
                            >
                                <Icon name="MoreVertical" size={18} />
                            </button>
                            {showSessionMenu && (
                                <div
                                    className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border-subtle bg-surface-base p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            setAddingExercise(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                    >
                                        <Icon name="Plus" size={14} />
                                        <span>{t.addExercise}</span>
                                    </button>
                                    {onOpenReorder && sessionExercises.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowSessionMenu(false);
                                                onOpenReorder();
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-surface-raised hover:text-white transition-colors"
                                        >
                                            <Icon name="ArrowUpDown" size={14} />
                                            <span>{t.reorderExercises}</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            setShowFinishModal(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-primary-400 hover:bg-primary-500/10 transition-colors"
                                    >
                                        <Icon name="Check" size={14} />
                                        <span>{t.finishWorkout || t.finish}</span>
                                    </button>
                                    <div className="my-1 border-t border-border-subtle/50" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSessionMenu(false);
                                            ctrl.setShowDiscardConfirm(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Icon name="Trash2" size={14} />
                                        <span>{t.discardSession || 'Descartar sesión'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar / Weeks & Days Drawer */}
            {showCalendarDrawer && activeMeso && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowCalendarDrawer(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-t-[20px] border-t border-border-subtle bg-surface-base p-4 pb-safe animate-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
                        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                            <div>
                                <h3 className="text-base font-bold text-white">{activeMeso.name || 'Mesocycle'}</h3>
                                <p className="text-xs text-muted">
                                    {pickLang(lang, {
                                        es: `Semana ${activeSession.week} de ${totalWeeks}`,
                                        en: `Week ${activeSession.week} of ${totalWeeks}`,
                                    })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCalendarDrawer(false)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:text-white"
                                aria-label={t.cancel}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="py-3">
                            <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                                {pickLang(lang, { es: 'Semanas', en: 'Weeks' })}
                            </p>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wNum) => (
                                    <div
                                        key={wNum}
                                        className={`flex h-8 min-w-[36px] px-2 items-center justify-center rounded-[6px] text-xs font-bold ${
                                            wNum === activeSession.week
                                                ? 'bg-primary-500 text-zinc-950 font-black'
                                                : 'bg-surface-raised text-zinc-400 border border-border-subtle'
                                        }`}
                                    >
                                        W{wNum}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {Array.isArray(activeMeso.plan) && (
                            <div className="py-2 space-y-1.5 max-h-56 overflow-y-auto">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    {pickLang(lang, { es: 'Días del plan', en: 'Plan Days' })}
                                </p>
                                {activeMeso.plan.map((dayPlan: any, dIdx: number) => (
                                    <div
                                        key={dIdx}
                                        className={`flex items-center justify-between rounded-[6px] p-2 text-xs border ${
                                            dIdx === activeSession.dayIdx
                                                ? 'border-primary-500 bg-primary-500/10'
                                                : 'border-border-subtle bg-surface-raised/40'
                                        }`}
                                    >
                                        <span className="font-bold text-white">
                                            {pickLang(lang, { es: `Día ${dIdx + 1}`, en: `Day ${dIdx + 1}` })}
                                        </span>
                                        <span className="text-muted">
                                            {Array.isArray(dayPlan) ? `${dayPlan.length} ${pickLang(lang, { es: 'ejercicios', en: 'exercises' })}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
                <div
                    id="tut-exercise-list"
                    data-testid="workout-main"
                    className="flex-1 overflow-y-auto scroll-container px-3 space-y-2.5 pt-3 pb-8"
                >
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
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] border border-dashed border-border-strong bg-surface-raised/40 text-xs font-semibold text-muted hover:text-white hover:border-zinc-500 transition-colors active:scale-98"
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
