
import React, { useMemo, useState, useCallback, useEffect, startTransition, Suspense } from 'react';
import { useApp, useAppConfig, useAppPreferences, useTutorial } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { ExerciseDef, SessionExercise, SetType } from '../types';
import { Sheet } from '../components/ui/Sheet';
import { getTranslated, getMesoStageConfig, getLastLogForExercise } from '../utils';
import { useWorkoutController } from '../hooks/useWorkoutController';
import { SortableExerciseCard } from '../components/workout/SortableExerciseCard';
import { WorkoutTimer } from '../components/workout/WorkoutTimer';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

import { useStore } from '../lib/store';

const ExerciseSelector = React.lazy(() => import('../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ExerciseDetailModal = React.lazy(() => import('../components/ui/ExerciseDetailModal').then(m => ({ default: m.ExerciseDetailModal })));
const WorkoutSortableList = React.lazy(() => import('../components/workout/WorkoutSortableList'));
const FeedbackModal = React.lazy(() => import('../components/ui/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const WarmupModal = React.lazy(() => import('../components/ui/WarmupModal').then(m => ({ default: m.WarmupModal })));
const PRCelebrationOverlay = React.lazy(() => import('../components/ui/PRCelebrationOverlay').then(m => ({ default: m.PRCelebrationOverlay })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

// Module-scope constants — never change at runtime. Previously these maps were
// allocated on every render of the set-type modal IIFE (~12 entries each), and
// the modal can re-render frequently during a workout because `applyToAll`
// state changes per click. Lifting them out drops 24 object allocations and
// 100+ string allocations per render of the modal.
const SET_TYPE_COLORS: Record<string, string> = {
    regular: 'bg-zinc-800 text-zinc-300',
    warmup: 'bg-yellow-500/20 text-yellow-400',
    myorep: 'bg-purple-500/20 text-purple-400',
    giant: 'bg-orange-500/20 text-orange-400',
    top: 'bg-primary-500/20 text-primary-400',
    backoff: 'bg-blue-500/20 text-blue-400',
    cluster: 'bg-emerald-500/20 text-emerald-400',
    emom: 'bg-cyan-500/20 text-cyan-400',
    drop: 'bg-teal-500/20 text-teal-400',
    rest_pause: 'bg-rose-500/20 text-rose-400',
};
const SET_TYPE_ICONS: Record<string, string> = {
    regular: 'Circle', warmup: 'Zap', myorep: 'Repeat',
    giant: 'Layers', top: 'TrendingUp', backoff: 'TrendingDown', cluster: 'Grid3x3',
    emom: 'Timer', drop: 'TrendingDown',
    rest_pause: 'Pause',
};

// Container Component
export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack }) => {
    const { exercises, logs } = useApp();
    const { lang, reducedEffects } = useAppPreferences();
    const { config } = useAppConfig();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];

    // Use the Custom Controller Hook - Pass both callbacks
    const ctrl = useWorkoutController(onFinish, onDiscard);

    // View State for Focus Mode
    const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [reorderMode, setReorderMode] = useState(false);

    // Set type modal: apply-to-all toggle — defaults ON when all sets share the same type
    const [applyToAll, setApplyToAll] = useState(true);
    useEffect(() => {
        if (!ctrl.changingSetType) return;
        const ex = sessionExercises.find(e => e.instanceId === ctrl.changingSetType!.exId);
        const pending = (ex?.sets || []).filter(s => !s.completed);
        setApplyToAll(pending.length > 1 && pending.every(s => s.type === pending[0].type));
        // Intentional: this effect only resets `applyToAll` when the modal opens
        // for a different set, NOT every time sessionExercises changes (which
        // would clobber the user's manual toggle while editing).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctrl.changingSetType]);

    // Derived State — memoized so its reference is stable across keystroke re-renders,
    // otherwise it defeats React.memo on every SortableExerciseCard.
    const stageConfig = useMemo(
        () => activeMeso ? getMesoStageConfig(activeMeso.mesoType || 'hyp_1', activeMeso.week, !!activeMeso.isDeload) : null,
        [activeMeso]
    );
    const sessionExercises = ctrl.sessionExercises as SessionExercise[];
    const isCalisthenicsSession = useMemo(() => 
        sessionExercises.length > 0 && sessionExercises.every(ex => ex.isBodyweight), 
    [sessionExercises]);

    const accentClass = isCalisthenicsSession ? 'bg-violet-600' : 'bg-primary-500';
    const accentTextClass = isCalisthenicsSession ? 'text-violet-400' : 'text-primary-400';
    const accentHoverClass = isCalisthenicsSession ? 'hover:bg-violet-500' : 'hover:bg-primary-600';
    const accentShadowClass = isCalisthenicsSession ? 'shadow-violet-600/30' : 'shadow-primary-500/25';

    const supersetColorIndexes = useMemo(() => {
        const uniqueIds = Array.from(new Set(sessionExercises.map(e => e.supersetId).filter((id): id is string => typeof id === 'string' && !!id)));
        const map: Record<string, number> = {};
        uniqueIds.forEach((id, idx) => { map[id] = idx % 4; });
        return map;
    }, [sessionExercises]);

    const handleSetTypeChange = useCallback((exId: number, setId: number, type: SetType) => {
        ctrl.setChangingSetType({ exId, setId, currentType: type });
        // Intentional: only depend on the setter (stable). Adding `ctrl` would
        // recreate this callback on every controller update and defeat memoization.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctrl.setChangingSetType]);

    // Stable callbacks/values so SortableExerciseCard's React.memo holds across
    // keystroke re-renders — inline arrows here would create new refs every render.
    const handleSubBodyweight = useCallback((id: number, muscle: import('../types').MuscleGroup) => {
        ctrl.setReplaceFilter({ muscle, source: 'nilsson_bw' });
        ctrl.setReplacingExId(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctrl.setReplaceFilter, ctrl.setReplacingExId]);

    const sortableItems = useMemo(() => sessionExercises.map(ex => ex.instanceId), [sessionExercises]);

    // Hoisted ABOVE the early return so React hooks run unconditionally every render.
    const muscleCoverage = useMemo(() => {
        const map: Record<string, number> = {};
        sessionExercises.forEach(ex => {
            const done = (ex.sets || []).filter(s => s.completed && s.type !== 'warmup').length;
            if (done > 0 && ex.muscle) {
                map[ex.muscle] = (map[ex.muscle] || 0) + done;
            }
        });
        return Object.entries(map);
    }, [sessionExercises]);

    if (!activeSession) return null;

    const handleAddExercise = (newExId: string, customDef?: ExerciseDef) => {
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        const safeLogs = Array.isArray(logs) ? logs : [];
        const lastSets = getLastLogForExercise(newExId, safeLogs);

        const newInstanceId = Date.now();
        const initialSets = Array(3).fill(null).map((_, i) => {
            const historySet = lastSets && lastSets[i] ? lastSets[i] : null;
            return {
                id: newInstanceId + i + 1,
                weight: '',
                reps: '',
                rpe: '',
                completed: false,
                type: 'regular',
                hintWeight: historySet ? historySet.weight : undefined,
                hintReps: historySet ? historySet.reps : undefined,
                prevWeight: historySet ? historySet.weight : undefined,
                prevReps: historySet ? historySet.reps : undefined
            };
        });

        ctrl.updateSession(prev => !prev ? null : {
            ...prev,
            exercises: [...(prev.exercises || []), { ...newDef, instanceId: newInstanceId, slotLabel: newDef.muscle, sets: initialSets as any }]
        });
        ctrl.setAddingExercise(false);
    };

    const handleReplace = (newExId: string, customDef?: ExerciseDef) => {
        if (!ctrl.replacingExId) return;
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        const safeLogs = Array.isArray(logs) ? logs : [];
        const lastSets = getLastLogForExercise(newExId, safeLogs);

        ctrl.updateSession(prev => !prev ? null : {
            ...prev,
            exercises: (prev.exercises || []).map(ex => {
                if (ex.instanceId !== ctrl.replacingExId) return ex;

                const resetSets = (ex.sets || []).map((s, i) => {
                    const historySet = lastSets && lastSets[i] ? lastSets[i] : null;
                    return {
                        ...s,
                        weight: '',
                        reps: '',
                        rpe: '',
                        completed: false,
                        hintWeight: historySet ? historySet.weight : undefined,
                        hintReps: historySet ? historySet.reps : undefined,
                        prevWeight: historySet ? historySet.weight : undefined,
                        prevReps: historySet ? historySet.reps : undefined
                    };
                });

                return {
                    ...ex,
                    ...newDef,
                    slotLabel: newDef.muscle, // Explicitly update the slot label to match the new muscle
                    sets: resetSets
                };
            })
        });
        ctrl.setReplacingExId(null);
        ctrl.setReplaceFilter(null);
        ctrl.setOpenMenuId(null);
    };

    const workoutStats = useMemo(() => {
        let completedSets = 0;
        let completedWorkingSets = 0;
        let totalWorkingSets = 0;

        sessionExercises.forEach((exercise) => {
            (exercise.sets || []).forEach((set) => {
                if (set.completed) completedSets += 1;
                if (set.type !== 'warmup') {
                    totalWorkingSets += 1;
                    if (set.completed) completedWorkingSets += 1;
                }
            });
        });

        return {
            completedSets,
            totalWorkingSets,
            remainingSets: totalWorkingSets - completedWorkingSets,
            progressPct: totalWorkingSets > 0 ? (completedWorkingSets / totalWorkingSets) * 100 : 0,
        };
    }, [sessionExercises]);

    const { completedSets, totalWorkingSets, remainingSets, progressPct } = workoutStats;
    // muscleCoverage is computed above the early-return guard (rules-of-hooks)

    const focusedExercise = sessionExercises[focusedIndex];
    const goToNext = () => setFocusedIndex(prev => Math.min(prev + 1, sessionExercises.length - 1));
    const goToPrev = () => setFocusedIndex(prev => Math.max(prev - 1, 0));
    const quickAccessExercise = useMemo(() => {
        if (viewMode === 'focus') return focusedExercise || null;
        return sessionExercises.find(ex => ex.sets.some(set => !set.completed && set.type !== 'warmup')) || sessionExercises[0] || null;
    }, [focusedExercise, sessionExercises, viewMode]);

    const toggleViewMode = () => {
        if (!reducedEffects && (document as any).startViewTransition) {
            (document as any).startViewTransition(() => {
                startTransition(() => {
                    setViewMode(prev => prev === 'list' ? 'focus' : 'list');
                    setReorderMode(false);
                });
            });
        } else {
            startTransition(() => {
                setViewMode(prev => prev === 'list' ? 'focus' : 'list');
                setReorderMode(false);
            });
        }
    };

    const showStageInfo = stageConfig && (config.showRIR || stageConfig.label === 'recovery');

    const workoutTutorialSteps = [
        {
            targetId: 'tut-exercise-list',
            title: t.tutorial.workout[0].title,
            text: t.tutorial.workout[0].text,
            position: 'bottom' as const
        },
        {
            targetId: 'tut-view-toggle',
            title: lang === 'en' ? "Focus Mode" : "Modo Enfoque",
            text: lang === 'en'
                ? "Tap here to toggle between List View and Focus Mode (One exercise at a time)."
                : "Toca aquí para cambiar entre Vista de Lista y Modo Enfoque (una tarjeta a la vez).",
            position: 'bottom' as const
        },
        {
            targetId: 'tut-set-type',
            title: "Set Types",
            text: lang === 'en'
                ? "Tap this icon to change the set type (Warmup, Myo-reps, Dropset, etc)."
                : "Toca este icono para cambiar el tipo de serie (Calentamiento, Myo-reps, Dropset, etc).",
            position: 'bottom' as const
        },
        {
            targetId: 'tut-warmup-btn',
            title: t.warmup,
            text: lang === 'en'
                ? "Smart Warmup Calc. IMPORTANT: You must enter the weight for your first working set (Set 1) BEFORE tapping this."
                : "Calc. Calentamiento. IMPORTANTE: Debes ingresar el peso en tu primera serie efectiva (Set 1) ANTES de tocar aquí.",
            position: 'bottom' as const
        },
        {
            targetId: 'tut-finish-btn',
            title: t.tutorial.workout[3].title,
            text: t.tutorial.workout[3].text,
            position: 'top' as const
        }
    ];

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-black font-sans" onClick={() => ctrl.setOpenMenuId(null)}>

            {/* --- Minimalist Header --- */}
            <div className="glass z-30 border-b border-white/5 pt-safe bg-black/90">
                {/* Top Actions Row */}
                <div className="flex h-14 items-center justify-between px-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-800 transition-colors text-zinc-400 hover:text-white" aria-label="Previous"> <Icon name="ChevronLeft" size={24} strokeWidth={2.5} />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
                            <WorkoutTimer startTime={activeSession.startTime} />
                        </div>
                        {totalWorkingSets > 0 && (
                            <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tabular-nums transition-colors ${remainingSets === 0 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-300'}`}>
                                {remainingSets === 0 ? '✓' : `${remainingSets} left`}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            id="tut-view-toggle"
                            onClick={(e) => { e.stopPropagation(); toggleViewMode(); }}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${viewMode === 'focus' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                            title={viewMode === 'focus' ? 'List View' : 'Focus Mode'}
                        >
                            <Icon name={viewMode === 'focus' ? 'Layout' : 'Eye'} size={20} />
                        </button>
                        {viewMode === 'list' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReorderMode(prev => !prev);
                                    ctrl.setOpenMenuId(null);
                                }}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${reorderMode ? 'bg-primary-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                                title={lang === 'en' ? 'Reorder exercises' : 'Reordenar ejercicios'}
                            >
                                <Icon name="GripVertical" size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Title & Stage Info Row */}
                <div className="px-4 pb-5">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-200">
                        <Icon name="TrendingUp" size={14} className="text-zinc-300" />
                        <span>{lang === 'es' ? 'Progreso' : 'Progress'}</span>
                    </div>
                    <h1 className="mb-1 truncate text-[2.35rem] font-black leading-[0.95] tracking-[-0.05em] text-white">
                        {isCalisthenicsSession ? `🤸 Calisthenics Session` : activeSession.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Week Indicator — omit for freestyle sessions (week < 1) */}
                        {activeSession.week >= 1 && (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <Icon name="Calendar" size={12} className="text-zinc-400" />
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                        {t.week} {activeSession.week}
                                    </span>
                                </div>
                                {/* Separator only makes sense when week is shown */}
                                <span className="text-zinc-700 font-light">•</span>
                            </>
                        )}

                        {/* RIR Target / Deload Pill */}
                        {showStageInfo && (
                            <div className={`
                                inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest
                                ${stageConfig.label === 'recovery'
                                    ? 'bg-blue-900/30 text-blue-400'
                                    : `bg-primary-900/20 ${accentTextClass}`}
                            `}>
                                {stageConfig.label === 'recovery' ? (
                                    <>DELOAD PHASE</>
                                ) : (
                                    <>{t.target}: {stageConfig.rir} RIR</>
                                )}
                            </div>
                        )}

                        {/* Muscle Coverage Pills */}
                        {muscleCoverage.length > 0 && (
                            <>
                                <span className="text-zinc-700 font-light">•</span>
                                <div className="flex flex-wrap gap-1">
                                    {muscleCoverage.map(([muscle, count]) => (
                                        <span key={muscle} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                                            {muscle} <span className="text-zinc-500">{count}</span>
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Session Progress Bar --- */}
            <div className="relative h-1.5 overflow-hidden bg-zinc-900">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${isCalisthenicsSession ? 'from-violet-600 to-indigo-500' : 'from-primary-400 to-primary-600'} transition-all duration-500 ease-out`}
                    style={{ width: `${progressPct}%` }}
                />
            </div>


            {/* --- Linking Banner --- */}
            {ctrl.linkingId && (
                <div className="z-20 mx-4 mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/12 p-3 text-center text-xs font-bold text-cyan-100 animate-in slide-in-from-top">
                    {t.selectToLink}
                    <button onClick={() => ctrl.setLinkingId(null)} className="ml-4 underline opacity-80 hover:opacity-100">{t.cancel}</button>
                </div>
            )}

            {/* --- Main Content --- */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {viewMode === 'list' ? (
                    <div id="tut-exercise-list" className="flex-1 overflow-y-auto scroll-container px-4 pb-32 pt-5 space-y-5">
                        {reorderMode ? (
                            <Suspense fallback={null}>
                                <WorkoutSortableList
                                    itemIds={sortableItems}
                                    onReorder={ctrl.reorderSessionExercises}
                                >
                                    {sessionExercises.map((ex, idx) => {
                                        const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                        const isLinkingTarget = ctrl.linkingId && ctrl.linkingId !== ex.instanceId;

                                        return (
                                            <SortableExerciseCard
                                                key={ex.instanceId}
                                                exercise={ex}
                                                onSetUpdate={ctrl.handleSetUpdate}
                                                onSetComplete={ctrl.toggleSetComplete}
                                                onSetTypeChange={handleSetTypeChange}
                                                onAddSet={ctrl.handleAddSet}
                                                onDeleteSet={ctrl.handleDeleteSet}
                                                onOpenDetail={ctrl.setDetailExercise}
                                                onLink={ctrl.setLinkingId}
                                                onReplace={ctrl.setReplacingExId}
                                                onEditMuscle={ctrl.setEditingMuscleId}
                                                onUpdateSession={ctrl.updateSession}
                                                onOpenWarmup={ctrl.setWarmupExId}
                                                openMenuId={ctrl.openMenuId}
                                                setOpenMenuId={ctrl.setOpenMenuId}
                                                linkingId={ctrl.linkingId}
                                                t={t}
                                                lang={lang}
                                                supersetColorIndex={supersetColorIndex}
                                                isLinkingTarget={!!isLinkingTarget}
                                                config={config}
                                                stageConfig={stageConfig}
                                                viewMode="list"
                                                dragEnabled={true}
                                                logs={logs}
                                                tutorialId={idx === 0 ? "tut-set-type" : undefined}
                                                reducedEffects={reducedEffects}
                                            />
                                        );
                                    })}
                                </WorkoutSortableList>
                            </Suspense>
                        ) : (
                            <>
                                {sessionExercises.map((ex, idx) => {
                                    const supersetColorIndex = ex.supersetId ? supersetColorIndexes[ex.supersetId] : undefined;
                                    const isLinkingTarget = ctrl.linkingId && ctrl.linkingId !== ex.instanceId;

                                    return (
                                        <SortableExerciseCard
                                            key={ex.instanceId}
                                            exercise={ex}
                                            onSetUpdate={ctrl.handleSetUpdate}
                                            onSetComplete={ctrl.toggleSetComplete}
                                            onSetTypeChange={handleSetTypeChange}
                                            onAddSet={ctrl.handleAddSet}
                                            onDeleteSet={ctrl.handleDeleteSet}
                                            onOpenDetail={ctrl.setDetailExercise}
                                            onLink={ctrl.setLinkingId}
                                            onReplace={ctrl.setReplacingExId}
                                            onEditMuscle={ctrl.setEditingMuscleId}
                                            onUpdateSession={ctrl.updateSession}
                                            onOpenWarmup={ctrl.setWarmupExId}
                                            openMenuId={ctrl.openMenuId}
                                            setOpenMenuId={ctrl.setOpenMenuId}
                                            linkingId={ctrl.linkingId}
                                            t={t}
                                            lang={lang}
                                            supersetColorIndex={supersetColorIndex}
                                            isLinkingTarget={!!isLinkingTarget}
                                            config={config}
                                            stageConfig={stageConfig}
                                            viewMode="list"
                                            dragEnabled={false}
                                            logs={logs}
                                            tutorialId={idx === 0 ? "tut-set-type" : undefined}
                                            reducedEffects={reducedEffects}
                                        />
                                    );
                                })}
                            </>
                        )}

                        {/* Spacer to prevent fixed footer overlap */}
                        <div className="h-28" />
                    </div>
                ) : (
                    // Focus Mode (with bottom safe spacer)
                    <div className="flex-1 flex flex-col p-4 pb-36 h-full relative">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            {sessionExercises.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${idx === focusedIndex ? (isCalisthenicsSession ? 'bg-violet-600' : 'bg-primary-600') : idx < focusedIndex ? (isCalisthenicsSession ? 'bg-violet-900/30' : 'bg-primary-900/30') : 'bg-zinc-800'}`}
                                ></div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <button
                                onClick={goToPrev}
                                disabled={focusedIndex === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                             aria-label="Previous"> <Icon name="ChevronLeft" size={20} />
                            </button>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                {focusedIndex + 1} / {sessionExercises.length}
                            </span>
                            <button
                                onClick={goToNext}
                                disabled={focusedIndex === sessionExercises.length - 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                             aria-label="Next"> <Icon name="ChevronRight" size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {focusedExercise ? (
                                <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300" key={focusedExercise.instanceId}>
                                    <SortableExerciseCard
                                        exercise={focusedExercise}
                                        onSetUpdate={ctrl.handleSetUpdate}
                                        onSetComplete={ctrl.toggleSetComplete}
                                        onSetTypeChange={handleSetTypeChange}
                                        onAddSet={ctrl.handleAddSet}
                                        onDeleteSet={ctrl.handleDeleteSet}
                                        onOpenDetail={ctrl.setDetailExercise}
                                        onLink={ctrl.setLinkingId}
                                        onReplace={ctrl.setReplacingExId}
                                        onEditMuscle={ctrl.setEditingMuscleId}
                                        onUpdateSession={ctrl.updateSession}
                                        onOpenWarmup={ctrl.setWarmupExId}
                                        openMenuId={ctrl.openMenuId}
                                        setOpenMenuId={ctrl.setOpenMenuId}
                                        linkingId={ctrl.linkingId}
                                        t={t}
                                        lang={lang}
                                        supersetColorIndex={focusedExercise.supersetId ? supersetColorIndexes[focusedExercise.supersetId] : undefined}
                                        isLinkingTarget={false}
                                        config={config}
                                        stageConfig={stageConfig}
                                        viewMode="focus"
                                        dragEnabled={false}
                                        logs={logs}
                                        tutorialId={focusedIndex === 0 ? "tut-set-type" : undefined}
                                        reducedEffects={reducedEffects}
                                    />

                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                    <p>{t.emptySession}</p>
                                    <Button onClick={() => ctrl.setAddingExercise(true)} className="mt-4">{t.addExercise}</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Actions Bar (Reachable, one-handed) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pb-safe pt-8 px-6 pointer-events-none">
                <div className="max-w-md mx-auto flex items-center gap-3 pb-5 pointer-events-auto">
                    {/* Add Exercise Button (Thumb reach) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); ctrl.setAddingExercise(true); }}
                        className="w-[58px] h-[58px] rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition-transform shadow-lg hover:text-white"
                        title={t.addExercise}
                    >
                        <Icon name="Plus" size={24} strokeWidth={2.5} />
                    </button>

                    {/* Finish Workout Primary Button */}
                    <button
                        id="tut-finish-btn"
                        onClick={(e) => { e.stopPropagation(); ctrl.setShowFinishModal(true); }}
                        className={`flex-1 h-[58px] rounded-2xl bg-gradient-to-r ${isCalisthenicsSession ? 'from-violet-600 to-indigo-600 shadow-violet-600/30' : 'from-primary-500 to-primary-600 shadow-primary-500/30'} text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_8px_24px_-4px]`}
                    >
                        <Icon name="CheckCircle" size={20} strokeWidth={2.5} />
                        <span className="uppercase tracking-wide text-xs">{t.finishWorkout}</span>
                    </button>

                    {/* Quick context action (Warmup or Technique) */}
                    {(() => {
                        if (!quickAccessExercise) return null;
                        const isBw = quickAccessExercise.isBodyweight;
                        return (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isBw) {
                                        ctrl.setDetailExercise(quickAccessExercise);
                                    } else {
                                        ctrl.setWarmupExId(quickAccessExercise.instanceId);
                                    }
                                }}
                                className="w-[58px] h-[58px] rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition-transform shadow-lg hover:text-white"
                                title={isBw ? (lang === 'en' ? 'Technique' : 'Técnica') : t.warmup}
                            >
                                <Icon name={isBw ? 'Info' : 'Zap'} size={22} />
                            </button>
                        );
                    })()}
                </div>
            </div>

            {/* TUTORIAL OVERLAY HOOK */}
            <Suspense fallback={null}>
                <TutorialOverlay
                    steps={workoutTutorialSteps}
                    isActive={!tutorialProgress.workout}
                    onComplete={() => markTutorialSeen('workout')}
                />
            </Suspense>

            {/* Modals remain the same... */}
            {ctrl.detailExercise && (
                <Suspense fallback={null}>
                    <ExerciseDetailModal
                        exercise={ctrl.detailExercise}
                        onClose={() => ctrl.setDetailExercise(null)}
                    />
                </Suspense>
            )}

            {ctrl.changingSetType && (() => {
                const colors = SET_TYPE_COLORS;
                const icons = SET_TYPE_ICONS;
                const exForModal = sessionExercises.find(e => e.instanceId === ctrl.changingSetType!.exId);
                const pendingSets = (exForModal?.sets || []).filter(s => !s.completed);
                const hasMultipleSets = pendingSets.length > 1;
                return (
                    <Sheet
                        open={!!ctrl.changingSetType}
                        onOpenChange={(open) => !open && ctrl.setChangingSetType(null)}
                        title={t.setType}
                        accent="primary"
                    >
                        {hasMultipleSets && (
                            <button
                                onClick={() => setApplyToAll(v => !v)}
                                className="w-full flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="text-xs font-bold text-zinc-300">
                                    {lang === 'es' ? 'Aplicar a todas las series' : 'Apply to all sets'}
                                </span>
                                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${applyToAll ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-zinc-600'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${applyToAll ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>
                        )}
                        <div className="p-4 grid grid-cols-1 gap-1.5 max-h-[60vh] overflow-y-auto">
                            {(['regular', 'warmup', 'drop', 'myorep', 'giant', 'top', 'backoff', 'cluster', 'emom', 'rest_pause'] as SetType[]).map(type => {
                                const isSelected = ctrl.changingSetType?.currentType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (applyToAll && hasMultipleSets) {
                                                ctrl.handleSetTypeAll(ctrl.changingSetType!.exId, type);
                                            } else {
                                                ctrl.handleSetUpdate(ctrl.changingSetType!.exId, ctrl.changingSetType!.setId, 'type', type);
                                            }
                                            ctrl.setChangingSetType(null);
                                        }}
                                        className={`p-3 border rounded-xl flex items-center gap-3 text-left transition-all active:scale-98 ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                                    >
                                        <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors[type] || 'bg-zinc-800 text-zinc-400'}`}>
                                            <Icon name={icons[type] as any || 'Circle'} size={18} />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t.types[type]}</div>
                                            <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{t.typeDesc[type]}</div>
                                        </div>
                                        {isSelected && <Icon name="CheckCircle" size={16} className="text-primary-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Sheet>
                );
            })()}

            {ctrl.showFinishModal && (
                <Sheet
                    open={ctrl.showFinishModal}
                    onOpenChange={(open) => !open && ctrl.setShowFinishModal(false)}
                    title={completedSets > 0 ? t.finishWorkout : t.emptyWorkoutTitle}
                    accent="primary"
                    footer={
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" onClick={() => ctrl.setShowFinishModal(false)}>{t.cancel}</Button>
                                <Button variant="primary" onClick={ctrl.handleConfirmFinish}>{t.finishWorkout}</Button>
                            </div>
                            {/* Discard Session Option */}
                            <div className="text-center pt-1">
                                <button
                                    onClick={() => {
                                        ctrl.setShowFinishModal(false);
                                        ctrl.setShowDiscardConfirm(true);
                                    }}
                                    className="text-xs font-bold text-primary-500 hover:text-primary-400 transition-colors uppercase tracking-widest"
                                >
                                    {t.resetSession || "Discard / Reset"}
                                </button>
                            </div>
                        </div>
                    }
                >
                    <div className="p-5 space-y-5">
                        {/* Update Template Option */}
                        {completedSets > 0 && (
                            <div 
                                className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3 cursor-pointer hover:bg-white/10 transition-colors" 
                                onClick={() => ctrl.setUpdateTemplate(!ctrl.updateTemplate)}
                            >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors ${ctrl.updateTemplate ? 'bg-primary-500 border-primary-500' : 'border-zinc-700'}`}>
                                    {ctrl.updateTemplate && <Icon name="Check" size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">{t.updateRoutine}</p>
                                    <p className="text-xs text-zinc-400 leading-tight mt-0.5">{t.updateRoutineDesc}</p>
                                </div>
                            </div>
                        )}

                        {/* Session Journal Note */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-1">{lang === 'es' ? 'Nota de sesión' : 'Session note'}</label>
                            <textarea
                                placeholder="..."
                                value={activeSession.note || ''}
                                onChange={e => ctrl.updateSession(prev => prev ? { ...prev, note: e.target.value } : null)}
                                rows={3}
                                className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none resize-none focus:border-white/20 transition-all"
                            />
                        </div>
                    </div>
                </Sheet>
            )}

            {/* NEW: Discard Confirmation Modal */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={ctrl.showDiscardConfirm}
                    title={t.discardSession || "Discard Session"}
                    description={t.discardConfirm || "Discard current session data? This cannot be undone."}
                    confirmText={t.delete}
                    cancelText={t.cancel}
                    onConfirm={ctrl.handleDiscardSession}
                    onCancel={() => ctrl.setShowDiscardConfirm(false)}
                    variant="danger"
                />
            </Suspense>

            {ctrl.showPRSuccess && (
                <Suspense fallback={null}>
                    <PRCelebrationOverlay onDismiss={ctrl.dismissPRSuccess} />
                </Suspense>
            )}

            {ctrl.showFeedbackModal && activeSession && (
                <Suspense fallback={null}>
                    <FeedbackModal muscles={sessionExercises.map(e => e?.muscle || 'CHEST')} onCancel={() => ctrl.setShowFeedbackModal(false)} onConfirm={ctrl.handleSaveFeedback} />
                </Suspense>
            )}
            {ctrl.replacingExId && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleReplace} onClose={() => { ctrl.setReplacingExId(null); ctrl.setReplaceFilter(null); }} presetMuscle={ctrl.replaceFilter?.muscle} sourceFilter={ctrl.replaceFilter?.source} />
                </Suspense>
            )}
            {ctrl.addingExercise && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleAddExercise} onClose={() => ctrl.setAddingExercise(false)} />
                </Suspense>
            )}
            {ctrl.warmupExId && activeSession && (
                <Suspense fallback={null}>
                    <WarmupModal targetWeight={Number(sessionExercises.find(e => e.instanceId === ctrl.warmupExId)?.sets?.[0]?.weight || 0)} exerciseName={getTranslated(sessionExercises.find(e => e.instanceId === ctrl.warmupExId)?.name, lang)} onClose={() => ctrl.setWarmupExId(null)} />
                </Suspense>
            )}
        </div>
    );
};
