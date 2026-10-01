
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTimerActions } from '../context/TimerContext';
import { SessionExercise, ExerciseDef, SetType, Log, WorkoutSet } from '../types';
import { triggerHaptic } from '../utils/audio';
import { getLastLogForExercise, uid, estimate1RM } from '../utils';
import { useStatsWorker } from './useStatsWorker';
import { getEffectiveSetLoad } from '../utils/trainingMetrics';
import { isTemplateUpdateEligible } from '../utils/workoutProgress';

import { useStore } from '../lib/store';

const TEMPLATE_SET_TYPES = new Set<SetType>([
    'regular',
    'warmup',
    'drop',
    'myorep',
    'cluster',
    'giant',
    'top',
    'backoff',
    'emom',
    'rest_pause',
]);

const normalizeTemplateSetType = (sets: WorkoutSet[]): SetType => {
    const firstWorkingSet = sets.find(set => set.type !== 'warmup');
    if (!firstWorkingSet) return 'regular';
    return TEMPLATE_SET_TYPES.has(firstWorkingSet.type) ? firstWorkingSet.type : 'regular';
};

const reorderList = <T,>(items: T[], from: number, to: number): T[] => {
    if (from === to) return items;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
};

export const useWorkoutController = (onFinishCallback: () => void, onDiscardCallback: () => void) => {
    const { setProgram, exercises, rpFeedback, setRpFeedback, config, logs, userProfile } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { setRestTimer } = useTimerActions();
    const { calculateAllBest1RMs } = useStatsWorker();

    // Local UI State
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [replacingExId, setReplacingExId] = useState<number | null>(null);
    const [replaceFilter, setReplaceFilter] = useState<{ muscle?: import('../types').MuscleGroup; source?: 'nilsson_bw' } | null>(null);
    const [addingExercise, setAddingExercise] = useState(false);
    const [linkingId, setLinkingId] = useState<number | null>(null);
    const [editingMuscleId, setEditingMuscleId] = useState<number | null>(null);
    const [warmupExId, setWarmupExId] = useState<number | null>(null);
    const [changingSetType, setChangingSetType] = useState<{ exId: number, setId: number, currentType: SetType } | null>(null);
    const [detailExercise, setDetailExercise] = useState<SessionExercise | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // NEW

    // Feature: Update Template
    const [updateTemplate, setUpdateTemplate] = useState(false);

    // PR Logic
    const [hasNewPR, setHasNewPR] = useState(false);
    const [showPRSuccess, setShowPRSuccess] = useState(false);

    const sessionExercises = useMemo(() =>
        (activeSession?.exercises || []).filter((e): e is SessionExercise => !!e),
        [activeSession?.exercises]);

    const normalizedTemplateSlots = useMemo(() => sessionExercises.map(ex => {
        const workingSetCount = ex.sets.filter(set => set.type !== 'warmup').length;
        return {
            muscle: ex.muscle,
            setTarget: Math.max(1, workingSetCount || ex.sets.length || 1),
            exerciseId: ex.id,
            reps: ex.targetReps,
            setType: normalizeTemplateSetType(ex.sets),
            supersetId: ex.supersetId,
            label: ex.slotLabel && ex.slotLabel !== ex.muscle ? ex.slotLabel : undefined,
            notes: ex.note?.trim() || undefined,
        };
    }), [sessionExercises]);

    const normalizedTemplatePlan = useMemo(
        () => sessionExercises.map(ex => ex.id),
        [sessionExercises]
    );

    // Pre-built best-1RM index from full history — O(total_history) computed once
    // when logs change, not on every call to detectPRs.
    const [historicalBest1RM, setHistoricalBest1RM] = useState<Map<string, number>>(new Map());
    const [historicalReady, setHistoricalReady] = useState(false);

    useEffect(() => {
        if (!logs || logs.length === 0) {
            setHistoricalReady(true);
            return;
        }
        setHistoricalReady(false);
        let cancelled = false;
        calculateAllBest1RMs(logs).then((resultMap) => {
            if (!cancelled) {
                setHistoricalBest1RM(resultMap);
                setHistoricalReady(true);
            }
        }).catch(() => {
            if (!cancelled) {
                setHistoricalReady(true);
            }
        });
        return () => { cancelled = true; };
    }, [logs, calculateAllBest1RMs]);

    // Data Mutations
    const handleSetUpdate = useCallback((exInstanceId: number, setId: number, field: keyof WorkoutSet, value: any) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return {
                        ...ex,
                        sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s)
                    };
                })
            };
        });
    }, [setActiveSession]);

    // Implement Logic for Add Set
    const handleAddSet = useCallback((exInstanceId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;

                    const sets = ex.sets || [];
                    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

                    // Drop sets: auto-suggest ~80% of previous weight
                    const isDropSet = lastSet?.type === 'drop';
                    const dropWeight = isDropSet && lastSet?.weight
                        ? String(Math.round(Number(lastSet.weight) * 0.8 * 2) / 2) // round to nearest 0.5
                        : lastSet?.weight;

                    const newSet: WorkoutSet = {
                        id: uid(),
                        weight: isDropSet ? dropWeight : (lastSet ? lastSet.weight : ''),
                        reps: lastSet ? lastSet.reps : '',
                        rpe: '',
                        completed: false,
                        type: lastSet ? lastSet.type : 'regular',
                        // Preserve cardio values if applicable
                        duration: lastSet?.duration,
                        distance: lastSet?.distance,
                        workSeconds: lastSet?.workSeconds,
                        restSeconds: lastSet?.restSeconds
                    };

                    return { ...ex, sets: [...sets, newSet] };
                })
            };
        });
    }, [setActiveSession]);

    // Implement Logic for Delete Set
    const handleDeleteSet = useCallback((exInstanceId: number, setId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) };
                })
            };
        });
    }, [setActiveSession]);

    const handleNoteUpdate = useCallback((exInstanceId: number, note: string) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => ex.instanceId === exInstanceId ? { ...ex, note } : ex)
            };
        });
    }, [setActiveSession]);

    const toggleSetComplete = useCallback((exInstanceId: number, setId: number) => {
        const state = useStore.getState();
        const currentSession = state.activeSession;
        const currentMeso = state.activeMeso;
        if (!currentSession) return;

        const ex = (currentSession.exercises || []).find(e => e.instanceId === exInstanceId);
        const set = ex?.sets?.find(s => s.id === setId);
        // Guard: skipped sets must not trigger the rest timer (the state mutation
        // already returns early above, but sessionExercises here is still pre-mutation).
        if (!set || set.skipped) return;

        const willComplete = !set.completed;

        setActiveSession(prev => {
            if (!prev) return null;

            const targetEx = (prev.exercises || []).find(e => e.instanceId === exInstanceId);
            const targetSet = targetEx?.sets?.find(s => s.id === setId);
            if (!targetSet || targetSet.skipped) return prev;

            const completing = !targetSet.completed;

            let startTime = prev.startTime;
            if (completing && !startTime) startTime = Date.now();

            return {
                ...prev,
                startTime,
                exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? {
                    ...e,
                    sets: (e.sets || []).map(s => s.id === setId ? { ...s, completed: completing } : s)
                } : e)
            };
        });

        if (willComplete) {
            triggerHaptic('success');
            const isMetabolite = currentMeso?.mesoType === 'metabolite';
            let dur = isMetabolite ? 60 : 120;

            // Per-exercise custom rest preset takes highest priority
            if (ex?.defaultRestSeconds && ex.defaultRestSeconds > 0) {
                dur = ex.defaultRestSeconds;
            } else {
                // Calisthenics Specific Durations
                if (ex?.isIsometric) {
                    dur = 150; // CNS heavy skills need more rest (~2.5m)
                } else if (ex?.isBodyweight) {
                    dur = isMetabolite ? 45 : 90;
                }

                if (set.type === 'myorep' || set.type === 'myorep_match' || set.type === 'giant') dur = 30;
                if (set.type === 'cluster') dur = 15;
                if (set.type === 'drop') dur = 0; // Drop sets have no rest — skip timer
                if (set.type === 'rest_pause') dur = 20;     // Nilsson 2-Block: 20s between rest-pause mini-sets
                if (set.type === 'time_volume') dur = 10;    // Nilsson 2-Block: starts at 10s (escalates manually per protocol)
                if (set.type === 'triple_add') dur = 10;     // Nilsson 2-Block: 10s between fiber-type drops within Triple Add

                // Interval cardio: use the set's programmed rest, or protocol default
                if (ex?.cardioType === 'tabata') dur = 10;
                else if (ex?.cardioType === 'hiit') dur = set.restSeconds || 60;
            }

            // EMOM self-regulates rest via minute intervals — skip auto rest timer
            if (set.type === 'emom') return;
            // Drop sets: no rest between drops
            if (set.type === 'drop' && !ex?.defaultRestSeconds) return;

            // Superset: only start rest timer after BOTH sides of the superset complete
            // the same round (i.e. both have the same number of completed working sets).
            if (ex?.supersetId) {
                const currentExercises = currentSession.exercises || [];
                const partners = currentExercises.filter(e => e.supersetId === ex.supersetId && e.instanceId !== exInstanceId);
                if (partners.length > 0) {
                    // How many working sets will this exercise have completed after this one?
                    const thisCompletedAfter = (ex.sets || []).filter(s => s.type !== 'warmup' && s.type !== 'avt_hop' && s.completed).length + 1;
                    // If any partner hasn't reached the same count yet → hold the timer
                    const allPartnersInSync = partners.every(p => {
                        const pCompleted = (p.sets || []).filter(s => s.type !== 'warmup' && s.type !== 'avt_hop' && s.completed).length;
                        return pCompleted >= thisCompletedAfter;
                    });
                    if (!allPartnersInSync) return;
                }
            }

            // Let the completed-set state paint before mounting the animated
            // rest sheet. This prevents both updates competing for the same
            // frame on lower-end devices.
            requestAnimationFrame(() => {
                setRestTimer({
                    active: true,
                    duration: dur,
                    timeLeft: dur,
                    endAt: Date.now() + (dur * 1000),
                    source: {
                        exerciseInstanceId: exInstanceId,
                        setId,
                    },
                });
            });
        } else {
            triggerHaptic('light');
            setRestTimer(prev => {
                if (prev.active && prev.source?.exerciseInstanceId === exInstanceId && prev.source?.setId === setId) {
                    return { ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined };
                }
                return prev;
            });
        }

    }, [setActiveSession, setRestTimer]);

    const detectPRs = useCallback((): boolean => {
        if (!historicalReady) return false;
        const currentExercises = useStore.getState().activeSession?.exercises || [];
        for (const ex of currentExercises) {
            let currentBest1RM = 0;
            for (const s of (ex.sets || [])) {
                if (s.completed && (s.weight || s.weight === 0 || s.weight === '0') && s.reps) {
                    const effectiveLoad = getEffectiveSetLoad(s, ex, userProfile?.bodyWeight);
                    const e1rm = estimate1RM(effectiveLoad, Number(s.reps));
                    if (e1rm > currentBest1RM) currentBest1RM = e1rm;
                }
            }
            if (currentBest1RM > 0 && currentBest1RM > (historicalBest1RM.get(ex.id) ?? 0)) {
                return true;
            }
        }
        return false;
    }, [historicalReady, historicalBest1RM, userProfile]);

    const fireConfetti = useCallback(async () => {
        try {
            const confettiModule = await import('canvas-confetti');
            const confetti = (confettiModule.default || confettiModule) as any;

            const count = 200;
            const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
            function fire(particleRatio: number, opts: any) {
                confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
            }
            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } catch (e) { console.warn("Confetti failed", e); }
    }, []);

    const handleConfirmFinish = useCallback(() => {
        triggerHaptic('medium');
        setShowFinishModal(false);

        const currentActiveSession = useStore.getState().activeSession;
        const currentActiveMeso = useStore.getState().activeMeso;

        // --- UPDATE TEMPLATE LOGIC ---
        if (updateTemplate && currentActiveMeso && currentActiveSession && isTemplateUpdateEligible(currentActiveSession, currentActiveMeso)) {
            // 2. Update Global Program
            setProgram(prev => {
                const newProg = [...prev];
                if (newProg[currentActiveSession.dayIdx]) {
                    newProg[currentActiveSession.dayIdx] = {
                        ...newProg[currentActiveSession.dayIdx],
                        slots: normalizedTemplateSlots
                    };
                }
                return newProg;
            });

            // 3. Update Active Meso Plan (IDs only)
            setActiveMeso(prev => {
                if (!prev) return null;
                const newPlan = [...(prev.plan || [])];
                newPlan[currentActiveSession.dayIdx] = normalizedTemplatePlan;
                return { ...prev, plan: newPlan };
            });
        }
        // -----------------------------

        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Fix timer leak

        const isPR = detectPRs();
        setHasNewPR(isPR);

        if (config?.rpEnabled) {
            setShowFeedbackModal(true);
        } else {
            if (isPR) {
                setShowPRSuccess(true);
                fireConfetti();
            } else {
                onFinishCallback();
            }
        }
    }, [onFinishCallback, config, detectPRs, fireConfetti, updateTemplate, normalizedTemplateSlots, normalizedTemplatePlan, setProgram, setActiveMeso, setRestTimer]);

    // --- NEW: Handle Discard/Reset Session ---
    const handleDiscardSession = useCallback(() => {
        triggerHaptic('warning');
        // Clear internal timer logic state
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });

        // Close modals
        setShowFinishModal(false);
        setShowDiscardConfirm(false);

        // Invoke specific discard callback (handled in App.tsx)
        onDiscardCallback();
    }, [setRestTimer, onDiscardCallback]);

    const handleSaveFeedback = useCallback((feedbackData: Record<string, any>) => {
        const session = useStore.getState().activeSession;
        if (!session) return;
        triggerHaptic('success');

        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Fix timer leak (failsafe)

        const { mesoId, week } = session;
        setRpFeedback(prev => {
            const newFb = { ...prev };
            if (!newFb[mesoId]) newFb[mesoId] = {};
            if (!newFb[mesoId][week]) newFb[mesoId][week] = {};
            Object.keys(feedbackData).forEach(m => {
                newFb[mesoId][week][m] = feedbackData[m];
            });
            return newFb;
        });

        setShowFeedbackModal(false);

        if (hasNewPR) {
            setShowPRSuccess(true);
            fireConfetti();
        } else {
            onFinishCallback();
        }
    }, [setRpFeedback, onFinishCallback, hasNewPR, fireConfetti, setRestTimer]);

    const dismissPRSuccess = useCallback(() => {
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Extra failsafe
        setShowPRSuccess(false);
        onFinishCallback();
    }, [onFinishCallback, setRestTimer]);

    const reorderSessionExercises = useCallback((oldIndex: number, newIndex: number) => {
        triggerHaptic('medium');
        setActiveSession(prev => {
            if (!prev?.exercises) return prev;
            const newExercises = reorderList(prev.exercises, oldIndex, newIndex);
            return { ...prev, exercises: newExercises };
        });
    }, [setActiveSession]);

    const handleSetTypeAll = useCallback((exInstanceId: number, type: SetType) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: (prev.exercises || []).map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return {
                        ...ex,
                        sets: (ex.sets || []).map(s =>
                            (s.completed || s.type === 'avt_hop') ? s : { ...s, type }
                        )
                    };
                })
            };
        });
        triggerHaptic('success');
    }, [setActiveSession]);

    return useMemo(() => ({
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
        historicalReady,
        detectPRs,
        handleSetUpdate,
        handleSetTypeAll,
        handleAddSet,
        handleDeleteSet,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleDiscardSession, // EXPORTED
        showDiscardConfirm, setShowDiscardConfirm, // EXPORTED
        handleSaveFeedback,
        reorderSessionExercises,
        updateSession: setActiveSession,
        exercisesLibrary: exercises,
        activeSession,
        updateTemplate, setUpdateTemplate
    }), [
        sessionExercises,
        openMenuId,
        showFinishModal,
        showFeedbackModal,
        replacingExId,
        replaceFilter,
        addingExercise,
        linkingId,
        editingMuscleId,
        warmupExId,
        changingSetType,
        showPRSuccess, dismissPRSuccess,
        detailExercise,
        historicalReady,
        detectPRs,
        handleSetUpdate,
        handleSetTypeAll,
        handleAddSet,
        handleDeleteSet,
        handleNoteUpdate,
        toggleSetComplete,
        handleConfirmFinish,
        handleDiscardSession,
        showDiscardConfirm,
        handleSaveFeedback,
        reorderSessionExercises,
        setActiveSession,
        exercises,
        activeSession,
        updateTemplate
    ]);
};
