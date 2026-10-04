
import React, { useMemo, useState, useCallback, useEffect, useRef, Suspense } from 'react';
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
import { useTimerActions, useTimerState } from '../context/TimerContext';
import { formatSeconds } from '../utils';
import {
    countWorkingSets,
    isTemplateUpdateEligible,
    resolveInitialActiveExerciseId,
    toggleExerciseCardExpansion,
    advanceActiveExerciseOnCompletion
} from '../utils/workoutProgress';
import { resolveWeightUnit } from '../utils/units';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
    onOpenReorder?: () => void;
}

import { useStore } from '../lib/store';
import { scheduleWhenIdle } from '../lib/idle';

const ExerciseSelector = React.lazy(() => import('../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ExerciseDetailModal = React.lazy(() => import('../components/ui/ExerciseDetailModal').then(m => ({ default: m.ExerciseDetailModal })));
const WorkoutSortableList = React.lazy(() => import('../components/workout/WorkoutSortableList'));
const FeedbackModal = React.lazy(() => import('../components/ui/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const WarmupModal = React.lazy(() => import('../components/ui/WarmupModal').then(m => ({ default: m.WarmupModal })));
const PRCelebrationOverlay = React.lazy(() => import('../components/ui/PRCelebrationOverlay').then(m => ({ default: m.PRCelebrationOverlay })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const TutorialOverlay = React.lazy(() => import('../components/ui/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));

// Module-scope constants never change at runtime. Previously these maps were
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
const CORE_SET_TYPES: SetType[] = ['regular', 'warmup', 'drop', 'myorep', 'top', 'backoff'];
const ADVANCED_SET_TYPES: SetType[] = ['giant', 'cluster', 'emom', 'rest_pause'];
const MANUAL_REST_PRESETS = [60, 90, 120, 180] as const;

const RestTimerControl: React.FC<{
    preset: number;
    onStart: (duration: number) => void;
    onStop: () => void;
    onCyclePreset: () => void;
    lang: 'en' | 'es';
}> = React.memo(({ preset, onStart, onStop, onCyclePreset, lang }) => {
    const restTimer = useTimerState();
    const t = TRANSLATIONS[lang];

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    if (restTimer.active) onStop();
                    else onStart(preset);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                    restTimer.active ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-900 text-zinc-400'
                }`}
                title={restTimer.active
                    ? t.stopRest
                    : `${t.startRest} (${preset}s)`}
            >
                <Icon name="Timer" size={11} />
                {restTimer.active ? formatSeconds(restTimer.timeLeft) : `${preset}s`}
            </button>
            {!restTimer.active && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onCyclePreset();
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-white"
                    title={lang === 'es' ? 'Cambiar preset de descanso' : 'Change rest preset'}
                >
                    <Icon name="RotateCcw" size={11} />
                </button>
            )}
        </>
    );
});

// Container Component
export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack, onOpenReorder }) => {
    const { exercises, logs } = useApp();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { setRestTimer } = useTimerActions();
    const t = TRANSLATIONS[lang];

    // Use the Custom Controller Hook - Pass both callbacks
    const ctrl = useWorkoutController(onFinish, onDiscard);
    const {
        sessionExercises,
        openMenuId, setOpenMenuId,
        showFinishModal, setShowFinishModal,
        showFeedbackModal, setShowFeedbackModal,
        replacingExId, setReplacingExId,
        replaceFilter, setReplaceFilter,
        addingExercise, setAddingExercise,
        linkingId, setLinkingId,
        editingMuscleId, setEditingMuscleId,
        warmupExId, setWarmupExId,
        changingSetType, setChangingSetType,
        showPRSuccess, dismissPRSuccess,
        detailExercise, setDetailExercise,
        handleSetUpdate,
        handleSetTypeAll,
        handleAddSet,
        handleDeleteSet,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleDiscardSession,
        showDiscardConfirm, setShowDiscardConfirm,
        handleSaveFeedback,
        reorderSessionExercises,
        updateSession,
        updateTemplate, setUpdateTemplate
    } = ctrl;

    const [showAdvancedSetTypes, setShowAdvancedSetTypes] = useState(false);
    const [manualRestPreset, setManualRestPreset] = useState<number>(90);
    const [kongSubPrompt, setKongSubPrompt] = useState<{ slotId: string; exId: string } | null>(null);
    const [kongReorderPrompt, setKongReorderPrompt] = useState<{ oldIndex: number; newIndex: number } | null>(null);
    useEffect(() => {
        const recommended = activeSession?.exercises?.find((exercise) => exercise.recommendedRestSeconds)?.recommendedRestSeconds;
        if (recommended) setManualRestPreset(recommended);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.id]);

    useEffect(() => {
        const cancel = scheduleWhenIdle(() => {
            void import('../components/ui/ExerciseSelector');
            void import('../components/ui/WarmupModal');
            void import('../components/ui/ExerciseDetailModal');
            void import('../components/ui/FeedbackModal');
            void import('../components/ui/PRCelebrationOverlay');
        });
        return cancel;
    }, []);

    // Set type modal: apply-to-all toggle defaults ON when all sets share the same type
    const [applyToAll, setApplyToAll] = useState(true);
    useEffect(() => {
        if (!changingSetType) return;
        const ex = sessionExercises.find(e => e.instanceId === changingSetType.exId);
        const pending = (ex?.sets || []).filter(s => !s.completed);
        setApplyToAll(pending.length > 1 && pending.every(s => s.type === pending[0].type));
        setShowAdvancedSetTypes(false);
        // Intentional: this effect only resets `applyToAll` when the modal opens
        // for a different set, NOT every time sessionExercises changes (which
        // would clobber the user's manual toggle while editing).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changingSetType]);

    // Hide lazy-import latency behind the finish confirmation. By the time the
    // user confirms (or dismisses a PR), both destination overlays are already
    // in the browser module cache instead of showing a blank transition.
    useEffect(() => {
        if (!showFinishModal) return;
        void import('../components/ui/PRCelebrationOverlay');
        void import('./SessionSummaryView');
    }, [showFinishModal]);

    // Derived State - memoized so its reference is stable across keystroke re-renders,
    // otherwise it defeats React.memo on every SortableExerciseCard.
    const stageConfig = useMemo(
        () => activeMeso ? getMesoStageConfig(activeMeso.mesoType || 'hyp_1', activeMeso.week, !!activeMeso.isDeload) : null,
        [activeMeso]
    );
    const isCalisthenicsSession = useMemo(() => 
        sessionExercises.length > 0 && sessionExercises.every(ex => ex.isBodyweight), 
    [sessionExercises]);

    const accentTextClass = isCalisthenicsSession ? 'text-violet-400' : 'text-primary-400';

    const supersetSignature = useMemo(() => {
        return sessionExercises.map(e => `${e.instanceId}:${e.supersetId || ''}`).join(';');
    }, [sessionExercises]);

    const supersetColorIndexes = useMemo(() => {
        const uniqueIds = Array.from(new Set(sessionExercises.map(e => e.supersetId).filter((id): id is string => typeof id === 'string' && !!id)));
        const map: Record<string, number> = {};
        uniqueIds.forEach((id, idx) => { map[id] = idx % 4; });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supersetSignature]);

    const handleSetTypeChange = useCallback((exId: number, setId: number, type: SetType) => {
        setChangingSetType({ exId, setId, currentType: type });
    }, [setChangingSetType]);
    const sortableItems = useMemo(() => sessionExercises.map(ex => ex.instanceId), [sessionExercises]);

    const initialResolvedRef = useRef(sessionExercises.length > 0);

    const [activeExerciseId, setActiveExerciseId] = useState<number | null>(() => {
        return resolveInitialActiveExerciseId(sessionExercises);
    });

    useEffect(() => {
        if (!initialResolvedRef.current && sessionExercises.length > 0) {
            initialResolvedRef.current = true;
            setActiveExerciseId(resolveInitialActiveExerciseId(sessionExercises));
            return;
        }

        if (activeExerciseId !== null && !sessionExercises.some(e => e.instanceId === activeExerciseId)) {
            setActiveExerciseId(resolveInitialActiveExerciseId(sessionExercises));
        }
    }, [sessionExercises, activeExerciseId]);

    const handleToggleExpand = useCallback((instanceId: number) => {
        setActiveExerciseId(prev => toggleExerciseCardExpansion(prev, instanceId));
    }, []);

    const handleSetComplete = useCallback((exInstanceId: number, setId: number) => {
        const session = useStore.getState().activeSession;
        const currentExercises = session?.exercises || [];
        const ex = currentExercises.find(e => e.instanceId === exInstanceId);
        const thisSet = ex?.sets?.find(s => s.id === setId);
        const isCompleting = thisSet && !thisSet.completed;

        toggleSetComplete(exInstanceId, setId);

        if (isCompleting && ex) {
            const otherPending = (ex.sets || []).filter(s => s.id !== setId && !s.completed);
            if (otherPending.length === 0) {
                const nextEx = currentExercises.find(e => e.instanceId !== exInstanceId && (e.sets || []).some(s => !s.completed));
                if (nextEx) {
                    setActiveExerciseId(prev => (prev !== null ? nextEx.instanceId : null));
                }
            }
        }
    }, [toggleSetComplete]);

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

        updateSession(prev => !prev ? null : {
            ...prev,
            exercises: [...(prev.exercises || []), { ...newDef, instanceId: newInstanceId, slotLabel: newDef.muscle, sets: initialSets as any }]
        });
        setAddingExercise(false);
        setActiveExerciseId(newInstanceId);
    };

    const handleReplace = (newExId: string, customDef?: ExerciseDef) => {
        if (!replacingExId) return;
        const newDef = customDef || exercises.find(e => e.id === newExId);
        if (!newDef) return;

        const safeLogs = Array.isArray(logs) ? logs : [];
        const lastSets = getLastLogForExercise(newExId, safeLogs);

        let replacedSlotId: string | undefined;
        updateSession(prev => !prev ? null : {
            ...prev,
            exercises: (prev.exercises || []).map(ex => {
                if (ex.instanceId !== replacingExId) return ex;
                replacedSlotId = ex.programSlotId;

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
        if (activeMeso?.programSystem?.systemId === 'kong_4day' && replacedSlotId) {
            setKongSubPrompt({ slotId: replacedSlotId, exId: newExId });
        }
        setReplacingExId(null);
        setReplaceFilter(null);
        setOpenMenuId(null);
    };

    const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
        if (activeMeso?.programSystem?.systemId === 'kong_4day') {
            setKongReorderPrompt({ oldIndex, newIndex });
            return;
        }
        reorderSessionExercises(oldIndex, newIndex);
    }, [activeMeso?.programSystem?.systemId, reorderSessionExercises]);

    const workoutStats = useMemo(() => {
        return countWorkingSets(sessionExercises);
    }, [sessionExercises]);

    const hasWorkoutProgress = useMemo(() => {
        if ((activeSession?.note || '').trim().length > 0) return true;

        return sessionExercises.some(exercise =>
            (exercise.sets || []).some(set =>
                set.completed ||
                !!String(set.weight || '').trim() ||
                !!String(set.reps || '').trim() ||
                !!String(set.rpe || '').trim() ||
                !!String(set.duration || '').trim() ||
                !!String(set.distance || '').trim()
            )
        );
    }, [activeSession?.note, sessionExercises]);

    const { completedWorkingSets, totalWorkingSets, remainingWorkingSets: remainingSets, progressPct } = workoutStats;
    const quickAccessExercise = useMemo(() => {
        return sessionExercises.find(ex => ex.sets.some(set => !set.completed && set.type !== 'warmup')) || sessionExercises[0] || null;
    }, [sessionExercises]);
    const startManualRest = useCallback((duration = manualRestPreset) => {
        setRestTimer({
            active: true,
            duration,
            timeLeft: duration,
            endAt: Date.now() + duration * 1000,
        });
    }, [manualRestPreset, setRestTimer]);
    const stopRest = useCallback(() => {
        setRestTimer(prev => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
    }, [setRestTimer]);
    const cycleManualRestPreset = useCallback(() => {
        setManualRestPreset((prev) => {
            const currentIndex = MANUAL_REST_PRESETS.indexOf(prev as typeof MANUAL_REST_PRESETS[number]);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % MANUAL_REST_PRESETS.length : 0;
            return MANUAL_REST_PRESETS[nextIndex];
        });
    }, []);

    const showStageInfo = stageConfig && (config.showRIR || stageConfig.label === 'recovery');

    const workoutTutorialSteps = [
        {
            targetId: 'tut-exercise-list',
            title: t.tutorial.workout[0].title,
            text: t.tutorial.workout[0].text,
            position: 'bottom' as const
        },
        {
            targetId: 'tut-set-type',
            title: (t.tutorial as any)?.setTypesTitle || "Set Types",
            text: (t.tutorial as any)?.setTypesText || (lang === 'en'
                ? "Tap this icon to change the set type (Warmup, Myo-reps, Dropset, etc)."
                : "Toca este icono para cambiar el tipo de serie (Calentamiento, Myo-reps, Dropset, etc)."),
            position: 'bottom' as const
        },
        {
            targetId: 'tut-warmup-btn',
            title: t.warmup,
            text: (t.tutorial as any)?.smartWarmupText || (lang === 'en'
                ? "Smart Warmup Calc. Automatically calculates progressive warmup sets based on Set 1 weight."
                : "Calc. Calentamiento Inteligente. Calcula automáticamente las series de aproximación según el peso del Set 1."),
            position: 'bottom' as const
        },
        {
            targetId: 'tut-finish-btn',
            title: t.tutorial.workout[3].title,
            text: t.tutorial.workout[3].text,
            position: 'bottom' as const
        }
    ];

    useEffect(() => {
        if (!hasWorkoutProgress) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasWorkoutProgress]);

    if (!activeSession) return null;

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface-app font-sans" onClick={() => setOpenMenuId(null)}>

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
                        {t.finish || (lang === 'es' ? 'Terminar' : 'Finish')}
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

            {/* TUTORIAL OVERLAY HOOK */}
            <Suspense fallback={null}>
                <TutorialOverlay
                    steps={workoutTutorialSteps}
                    isActive={!tutorialProgress.workout}
                    onComplete={() => markTutorialSeen('workout')}
                />
            </Suspense>

            {/* Modals remain the same... */}
            {detailExercise && (
                <Suspense fallback={null}>
                    <ExerciseDetailModal
                        exercise={detailExercise}
                        onClose={() => setDetailExercise(null)}
                    />
                </Suspense>
            )}

            {changingSetType && (() => {
                const colors = SET_TYPE_COLORS;
                const icons = SET_TYPE_ICONS;
                const exForModal = sessionExercises.find(e => e.instanceId === changingSetType.exId);
                const pendingSets = (exForModal?.sets || []).filter(s => !s.completed);
                const hasMultipleSets = pendingSets.length > 1;
                return (
                    <Sheet
                        open={!!changingSetType}
                        onOpenChange={(open) => !open && setChangingSetType(null)}
                        title={t.setType}
                        accent="primary"
                    >
                        {hasMultipleSets && (
                            <button
                                type="button"
                                role="switch"
                                aria-checked={applyToAll}
                                onClick={() => setApplyToAll(v => !v)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setApplyToAll(v => !v);
                                    }
                                }}
                                className="w-full flex items-center justify-between border-b border-white/5 bg-zinc-950 px-5 py-3 hover:bg-zinc-900 transition-colors"
                            >
                                <span className="text-xs font-bold text-zinc-300">
                                    {t.applyToAllSets}
                                </span>
                                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${applyToAll ? 'bg-primary-500 shadow-[0_2px_8px] shadow-primary-500/30' : 'bg-zinc-600'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${applyToAll ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>
                        )}
                        <div className="p-4 grid grid-cols-1 gap-1.5 max-h-[60vh] overflow-y-auto">
                            {CORE_SET_TYPES.map(type => {
                                const isSelected = changingSetType?.currentType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (applyToAll && hasMultipleSets) {
                                                handleSetTypeAll(changingSetType.exId, type);
                                            } else {
                                                handleSetUpdate(changingSetType.exId, changingSetType.setId, 'type', type);
                                            }
                                            setChangingSetType(null);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-98 ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'}`}
                                    >
                                        <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors[type] || 'bg-zinc-800 text-zinc-400'}`}>
                                            <Icon name={icons[type] as any || 'Circle'} size={18} />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t.types[type]}</div>
                                            <div className="text-xs text-muted leading-tight mt-0.5">{t.typeDesc[type]}</div>
                                        </div>
                                        {isSelected && <Icon name="CheckCircle" size={16} className="text-primary-500 shrink-0" />}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setShowAdvancedSetTypes(v => !v)}
                                className="mt-1 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                            >
                                <span>{t.advancedProtocols}</span>
                                <Icon name={showAdvancedSetTypes ? 'ChevronUp' : 'ChevronDown'} size={16} />
                            </button>

                            {showAdvancedSetTypes && ADVANCED_SET_TYPES.map(type => {
                                const isSelected = changingSetType?.currentType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (applyToAll && hasMultipleSets) {
                                                handleSetTypeAll(changingSetType.exId, type);
                                            } else {
                                                handleSetUpdate(changingSetType.exId, changingSetType.setId, 'type', type);
                                            }
                                            setChangingSetType(null);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-98 ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'}`}
                                    >
                                        <span className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg ${colors[type] || 'bg-zinc-800 text-zinc-400'}`}>
                                            <Icon name={icons[type] as any || 'Circle'} size={18} />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t.types[type]}</div>
                                            <div className="text-xs text-muted leading-tight mt-0.5">{t.typeDesc[type]}</div>
                                        </div>
                                        {isSelected && <Icon name="CheckCircle" size={16} className="text-primary-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Sheet>
                );
            })()}

            {showFinishModal && (() => {
                const elapsedSecs = activeSession.startTime ? Math.max(0, Math.floor((Date.now() - activeSession.startTime) / 1000)) : 0;
                const canUpdateTemplate = isTemplateUpdateEligible(activeSession, activeMeso);

                return (
                    <Sheet
                        open={showFinishModal}
                        onOpenChange={(open) => !open && setShowFinishModal(false)}
                        title={t.finishSession}
                        accent="primary"
                    >
                        <div className="p-4 space-y-3.5">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-muted">{t.duration}</div>
                                    <div className="text-xl font-semibold text-white mt-0.5 tabular-nums">
                                        {formatSeconds(elapsedSecs)}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
                                    <div className="text-xs text-muted">{t.sets}</div>
                                    <div className="text-xl font-semibold text-white mt-0.5 tabular-nums">
                                        {completedWorkingSets} / {totalWorkingSets}
                                    </div>
                                </div>
                            </div>

                            {/* Update Template Switch (Protected for KONG) */}
                            {canUpdateTemplate && (
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={updateTemplate}
                                    aria-label={t.updateRoutine}
                                    className="w-full card-reference p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-500 transition-colors text-left"
                                    onClick={() => setUpdateTemplate(!updateTemplate)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setUpdateTemplate(!updateTemplate);
                                        }
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white">{t.updateRoutine}</div>
                                        <div className="text-xs text-muted mt-0.5">
                                            {t.saveRoutineDesc}
                                        </div>
                                    </div>
                                    <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${updateTemplate ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}>
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${updateTemplate ? 'left-[22px] bg-zinc-950' : 'left-0.5 bg-zinc-400'}`} />
                                    </div>
                                </button>
                            )}

                            {/* Session Note */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1 px-0.5">
                                    {t.sessionNote}
                                </label>
                                <textarea
                                    placeholder={t.sessionNotePlaceholder}
                                    value={activeSession.note || ''}
                                    onChange={e => updateSession(prev => prev ? { ...prev, note: e.target.value } : null)}
                                    rows={3}
                                    className="w-full rounded-xl border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none resize-none transition-all focus:border-zinc-600"
                                />
                            </div>

                            {/* Primary & Secondary Actions */}
                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleConfirmFinish}
                                    className="w-full h-11 rounded-xl bg-primary-500 text-zinc-950 font-semibold text-sm hover:bg-primary-400 active:scale-98 transition-all shadow-sm"
                                >
                                    {t.saveAndFinish}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFinishModal(false)}
                                    className="w-full h-11 rounded-xl bg-surface-elevated text-zinc-200 font-semibold text-sm hover:bg-zinc-800 active:scale-98 transition-all"
                                >
                                    {t.continueTraining}
                                </button>
                            </div>

                            {/* Destructive Discard Session */}
                            <div className="text-center pt-3 border-t border-border-subtle mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFinishModal(false);
                                        setShowDiscardConfirm(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider active:scale-95"
                                >
                                    <Icon name="Trash2" size={13} />
                                    {t.discardSession}
                                </button>
                            </div>
                        </div>
                    </Sheet>
                );
            })()}

            {/* NEW: Discard Confirmation Modal */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={showDiscardConfirm}
                    title={t.discardSession || "Discard Session"}
                    description={t.discardConfirm || "Discard current session data? This cannot be undone."}
                    confirmText={t.delete}
                    cancelText={t.cancel}
                    onConfirm={handleDiscardSession}
                    onCancel={() => setShowDiscardConfirm(false)}
                    variant="danger"
                />
            </Suspense>

            {/* KONG Substitution Persistence Modal */}
            {kongSubPrompt && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.kongSubTitle}
                        description={lang === 'es'
                            ? '¿Deseas mantener este reemplazo durante todo el programa KONG o aplicarlo solo para la sesión de hoy?'
                            : 'Keep this replacement for all of KONG, or apply it only for today?'}
                        confirmText={t.allKong}
                        cancelText={t.todayOnly}
                        onConfirm={() => {
                            setActiveMeso(prev => prev?.programSystem ? {
                                ...prev,
                                programSystem: {
                                    ...prev.programSystem,
                                    substitutions: { ...prev.programSystem.substitutions, [kongSubPrompt.slotId]: kongSubPrompt.exId },
                                },
                            } : prev);
                            setKongSubPrompt(null);
                        }}
                        onCancel={() => setKongSubPrompt(null)}
                    />
                </Suspense>
            )}

            {/* KONG Reorder Warning Modal */}
            {kongReorderPrompt && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.reorderKongTitle}
                        description={lang === 'es'
                            ? 'El orden de ejercicios forma parte de la metodología KONG. Weak Points First y Fatigued Strength dependen del orden. ¿Reordenar solo para la sesión de hoy?'
                            : 'Exercise order is part of KONG methodology. Weak Points First and Fatigued Strength depend on order. Reorder for today only?'}
                        confirmText={t.reorderToday}
                        cancelText={t.cancel}
                        onConfirm={() => {
                            reorderSessionExercises(kongReorderPrompt.oldIndex, kongReorderPrompt.newIndex);
                            setKongReorderPrompt(null);
                        }}
                        onCancel={() => setKongReorderPrompt(null)}
                    />
                </Suspense>
            )}

            {showPRSuccess && (
                <Suspense fallback={null}>
                    <PRCelebrationOverlay onDismiss={dismissPRSuccess} />
                </Suspense>
            )}

            {showFeedbackModal && activeSession && (
                <Suspense fallback={null}>
                    <FeedbackModal muscles={sessionExercises.map(e => e?.muscle || 'CHEST')} onCancel={() => setShowFeedbackModal(false)} onConfirm={handleSaveFeedback} />
                </Suspense>
            )}
            {replacingExId && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleReplace} onClose={() => { setReplacingExId(null); setReplaceFilter(null); }} presetMuscle={replaceFilter?.muscle} sourceFilter={replaceFilter?.source} />
                </Suspense>
            )}
            {addingExercise && (
                <Suspense fallback={null}>
                    <ExerciseSelector onSelect={handleAddExercise} onClose={() => setAddingExercise(false)} />
                </Suspense>
            )}
            {warmupExId && activeSession && (
                <Suspense fallback={null}>
                    <WarmupModal targetWeight={Number(sessionExercises.find(e => e.instanceId === warmupExId)?.sets?.[0]?.weight || 0)} exerciseName={getTranslated(sessionExercises.find(e => e.instanceId === warmupExId)?.name, lang)} onClose={() => setWarmupExId(null)} unit={resolveWeightUnit(config)} />
                </Suspense>
            )}
        </div>
    );
};

