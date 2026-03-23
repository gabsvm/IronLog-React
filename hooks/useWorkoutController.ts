
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTimerContext } from '../context/TimerContext';
import { SessionExercise, ExerciseDef, SetType, Log, WorkoutSet } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { triggerHaptic } from '../utils/audio';
import { getLastLogForExercise } from '../utils';

export const useWorkoutController = (onFinishCallback: () => void, onDiscardCallback: () => void) => {
    const { activeSession, activeMeso, setActiveSession, setActiveMeso, setProgram, exercises, rpFeedback, setRpFeedback, config, logs } = useApp();
    const { setRestTimer } = useTimerContext();

    // Local UI State
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [replacingExId, setReplacingExId] = useState<number | null>(null);
    const [addingExercise, setAddingExercise] = useState(false);
    const [linkingId, setLinkingId] = useState<number | null>(null);
    const [editingMuscleId, setEditingMuscleId] = useState<number | null>(null);
    const [warmupExId, setWarmupExId] = useState<number | null>(null);
    const [configPlateExId, setConfigPlateExId] = useState<number | null>(null);
    const [plateWeightInput, setPlateWeightInput] = useState('');
    const [changingSetType, setChangingSetType] = useState<{ exId: number, setId: number, currentType: SetType } | null>(null);
    const [showPlateCalc, setShowPlateCalc] = useState<{ weight: number } | null>(null);
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

                    const newSet: WorkoutSet = {
                        id: Date.now(),
                        weight: lastSet ? lastSet.weight : '',
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
        setActiveSession(prev => {
            if (!prev) return null;

            const ex = prev.exercises.find(e => e.instanceId === exInstanceId);
            const set = ex?.sets?.find(s => s.id === setId);
            if (!set || set.skipped) return prev;

            const completing = !set.completed;

            let startTime = prev.startTime;
            if (completing && !startTime) startTime = Date.now();

            return {
                ...prev,
                startTime,
                exercises: (prev.exercises || []).map(e => e.instanceId === exInstanceId ? {
                    ...e,
                    sets: (e.sets || []).map(s => s.id === setId ? { ...s, completed: completing } : s)
                } : e)
            }
        });

        const ex = sessionExercises.find(e => e.instanceId === exInstanceId);
        const set = ex?.sets.find(s => s.id === setId);
        if (set) {
            const willComplete = !set.completed;
            if (willComplete) {
                triggerHaptic('success');
                const isMetabolite = activeMeso?.mesoType === 'metabolite';
                let dur = isMetabolite ? 60 : 120;
                if (set.type === 'myorep' || set.type === 'giant') dur = 30;
                setRestTimer({ active: true, duration: dur, timeLeft: dur, endAt: Date.now() + (dur * 1000) });
            } else {
                triggerHaptic('light');
            }
        }

    }, [activeMeso, sessionExercises, setActiveSession, setRestTimer]);

    const detectPRs = useCallback((): boolean => {
        let prFound = false;
        const safeLogs = Array.isArray(logs) ? logs : [];

        for (const ex of sessionExercises) {
            let currentBest1RM = 0;
            (ex.sets || []).forEach(s => {
                if (s.completed && s.weight && s.reps) {
                    const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                    if (e1rm > currentBest1RM) currentBest1RM = e1rm;
                }
            });

            if (currentBest1RM > 0) {
                let historicalBest1RM = 0;
                safeLogs.forEach(l => {
                    const oldEx = l.exercises?.find(e => e.id === ex.id);
                    if (oldEx) {
                        (oldEx.sets || []).forEach(s => {
                            if (s.completed && s.weight && s.reps) {
                                const e1rm = Number(s.weight) * (1 + Number(s.reps) / 30);
                                if (e1rm > historicalBest1RM) historicalBest1RM = e1rm;
                            }
                        });
                    }
                });

                if (currentBest1RM > historicalBest1RM) {
                    prFound = true;
                    break;
                }
            }
        }
        return prFound;
    }, [sessionExercises, logs]);

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

        // --- UPDATE TEMPLATE LOGIC ---
        if (updateTemplate && activeMeso && activeSession) {
            // 1. Construct new Slots for Program (Base Template)
            const newSlots = sessionExercises.map(ex => {
                // Determine preferred set type from the first set
                const firstSetType = ex.sets && ex.sets.length > 0 ? ex.sets[0].type : undefined;

                return {
                    muscle: ex.muscle,
                    setTarget: ex.sets.length, // Persist set count
                    exerciseId: ex.id,
                    reps: ex.targetReps, // Persist target reps
                    setType: firstSetType // Persist Set Type preference
                };
            });

            // 2. Update Global Program
            setProgram(prev => {
                const newProg = [...prev];
                if (newProg[activeSession.dayIdx]) {
                    newProg[activeSession.dayIdx] = {
                        ...newProg[activeSession.dayIdx],
                        slots: newSlots
                    };
                }
                return newProg;
            });

            // 3. Update Active Meso Plan (IDs only)
            setActiveMeso(prev => {
                if (!prev) return null;
                const newPlan = [...(prev.plan || [])];
                newPlan[activeSession.dayIdx] = sessionExercises.map(e => e.id);
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
    }, [onFinishCallback, config, detectPRs, fireConfetti, updateTemplate, activeMeso, activeSession, sessionExercises, setProgram, setActiveMeso]);

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
        if (!activeSession) return;
        triggerHaptic('success');

        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Fix timer leak (failsafe)

        const { mesoId, week } = activeSession;
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
    }, [activeSession, setRpFeedback, onFinishCallback, hasNewPR, fireConfetti]);

    const dismissPRSuccess = useCallback(() => {
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 }); // Extra failsafe
        setShowPRSuccess(false);
        onFinishCallback();
    }, [onFinishCallback, setRestTimer]);

    const reorderSessionExercises = useCallback((oldIndex: number, newIndex: number) => {
        triggerHaptic('medium');
        if (!activeSession?.exercises) return;
        const newExercises = arrayMove(activeSession.exercises, oldIndex, newIndex);
        setActiveSession(prev => prev ? { ...prev, exercises: newExercises } : null);
    }, [activeSession, setActiveSession]);

    const handleAddAVTRound = useCallback((exInstanceId: number) => {
        const roundId = Date.now();
        // Un round AVT empieza con 4 hops vacíos (peso incremental, mismas reps)
        // El usuario va completando hop a hop y marca cuál fue el fallo
        const initialHops: WorkoutSet[] = Array.from({ length: 4 }, (_, i) => ({
            id: Date.now() + i,
            weight: '',
            reps: '',
            rpe: '',
            completed: false,
            type: 'avt_hop' as SetType,
            avtRoundId: roundId,
            isLastHop: false,
        }));

        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: prev.exercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    return { ...ex, sets: [...(ex.sets || []), ...initialHops] };
                })
            };
        });
    }, [setActiveSession]);

    const handleMarkLastHop = useCallback((exInstanceId: number, setId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: prev.exercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    const targetSet = ex.sets.find(s => s.id === setId);
                    if (!targetSet?.avtRoundId) return ex;
                    // Marcar todos los del round: solo el clickeado como lastHop
                    return {
                        ...ex,
                        sets: ex.sets.map(s => {
                            if (s.avtRoundId !== targetSet.avtRoundId) return s;
                            return { ...s, isLastHop: s.id === setId, completed: s.id === setId ? true : s.completed };
                        })
                    };
                })
            };
        });
    }, [setActiveSession]);

    const handleAddHopToRound = useCallback((exInstanceId: number, roundId: number) => {
        setActiveSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                exercises: prev.exercises.map(ex => {
                    if (ex.instanceId !== exInstanceId) return ex;
                    const newHop: WorkoutSet = {
                        id: Date.now(),
                        weight: '',
                        reps: '',
                        rpe: '',
                        completed: false,
                        type: 'avt_hop',
                        avtRoundId: roundId,
                        isLastHop: false,
                    };
                    return { ...ex, sets: [...ex.sets, newHop] };
                })
            };
        });
    }, [setActiveSession]);


    return {
        sessionExercises,
        openMenuId, setOpenMenuId,
        showFinishModal, setShowFinishModal,
        showFeedbackModal, setShowFeedbackModal,
        replacingExId, setReplacingExId,
        addingExercise, setAddingExercise,
        linkingId, setLinkingId,
        editingMuscleId, setEditingMuscleId,
        warmupExId, setWarmupExId,
        configPlateExId, setConfigPlateExId,
        plateWeightInput, setPlateWeightInput,
        changingSetType, setChangingSetType,
        showPlateCalc, setShowPlateCalc,
        showPRSuccess, dismissPRSuccess,
        detailExercise, setDetailExercise,
        handleSetUpdate,
        handleAddSet,
        handleDeleteSet,
        handleNoteUpdate,
        toggleSetComplete,
        handleAddAVTRound,
        handleMarkLastHop,
        handleAddHopToRound,
        handleConfirmFinish,
        handleDiscardSession, // EXPORTED
        showDiscardConfirm, setShowDiscardConfirm, // EXPORTED
        handleSaveFeedback,
        reorderSessionExercises,
        updateSession: setActiveSession,
        exercisesLibrary: exercises,
        activeSession,
        updateTemplate, setUpdateTemplate
    };
};
