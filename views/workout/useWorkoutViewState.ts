// S6: WorkoutView state, effects and handlers, moved verbatim from
// views/WorkoutViewImpl.tsx (the view is now an orchestrator).
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useApp, useAppConfig, useAppPreferences, useTutorial } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef, SetType } from '../../types';
import { getMesoStageConfig, getLastLogForExercise } from '../../utils';
import { useWorkoutController } from '../../hooks/useWorkoutController';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCard';
import { useTimerActions } from '../../context/TimerContext';
import { countWorkingSets, resolveInitialActiveExerciseId, toggleExerciseCardExpansion } from '../../utils/workoutProgress';
import { useStore } from '../../lib/store';
import { scheduleWhenIdle } from '../../lib/idle';
import { MANUAL_REST_PRESETS } from './workoutConstants';

export interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
    onOpenReorder?: () => void;
}

export const useWorkoutViewState = ({ onFinish, onDiscard, onBack, onOpenReorder }: WorkoutViewProps) => {
    const { exercises, logs } = useApp();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const { tutorialProgress, markTutorialSeen } = useTutorial();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { setRestTimer } = useTimerActions();
    const t = TRANSLATIONS[lang];
    const w = t.workoutImpl;

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
            void import('../../components/ui/ExerciseSelector');
            void import('../../components/ui/WarmupModal');
            void import('../../components/ui/ExerciseDetailModal');
            void import('../../components/ui/FeedbackModal');
            void import('../../components/ui/PRCelebrationOverlay');
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
        void import('../../components/ui/PRCelebrationOverlay');
        void import('../SessionSummaryView');
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
        const lastSets = getLastLogForExercise(newExId, safeLogs, exercises);

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
        const lastSets = getLastLogForExercise(newExId, safeLogs, exercises);

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
            title: t.tutorialExtra.setTypesTitle,
            text: t.tutorialExtra.setTypesText,
            position: 'bottom' as const
        },
        {
            targetId: 'tut-warmup-btn',
            title: t.warmup,
            text: t.tutorialExtra.smartWarmupText,
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


    return {
        onFinish,
        onDiscard,
        onBack,
        onOpenReorder,
        sessionExercises,
        openMenuId,
        setOpenMenuId,
        showFinishModal,
        setShowFinishModal,
        showFeedbackModal,
        setShowFeedbackModal,
        replacingExId,
        setReplacingExId,
        replaceFilter,
        setReplaceFilter,
        addingExercise,
        setAddingExercise,
        linkingId,
        setLinkingId,
        editingMuscleId,
        setEditingMuscleId,
        warmupExId,
        setWarmupExId,
        changingSetType,
        setChangingSetType,
        showPRSuccess,
        dismissPRSuccess,
        detailExercise,
        setDetailExercise,
        handleSetUpdate,
        handleSetTypeAll,
        handleAddSet,
        handleDeleteSet,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleDiscardSession,
        showDiscardConfirm,
        setShowDiscardConfirm,
        handleSaveFeedback,
        reorderSessionExercises,
        updateSession,
        updateTemplate,
        setUpdateTemplate,
        exercises,
        logs,
        lang,
        config,
        tutorialProgress,
        markTutorialSeen,
        activeSession,
        activeMeso,
        setActiveMeso,
        setRestTimer,
        t,
        w,
        ctrl,
        showAdvancedSetTypes,
        setShowAdvancedSetTypes,
        manualRestPreset,
        setManualRestPreset,
        kongSubPrompt,
        setKongSubPrompt,
        kongReorderPrompt,
        setKongReorderPrompt,
        applyToAll,
        setApplyToAll,
        stageConfig,
        isCalisthenicsSession,
        accentTextClass,
        supersetSignature,
        supersetColorIndexes,
        handleSetTypeChange,
        sortableItems,
        initialResolvedRef,
        activeExerciseId,
        setActiveExerciseId,
        handleToggleExpand,
        handleSetComplete,
        handleAddExercise,
        handleReplace,
        handleReorder,
        workoutStats,
        hasWorkoutProgress,
        completedWorkingSets,
        totalWorkingSets,
        remainingSets,
        progressPct,
        quickAccessExercise,
        startManualRest,
        stopRest,
        cycleManualRestPreset,
        showStageInfo,
        workoutTutorialSteps,
    };
};

export type WorkoutViewState = ReturnType<typeof useWorkoutViewState>;
