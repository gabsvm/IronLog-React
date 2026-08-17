import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorkoutView as WorkoutViewImpl } from './WorkoutViewImpl';
import { useApp, useAppConfig } from '../context/AppContext';
import { useTimerActions } from '../context/TimerContext';
import { useStore } from '../lib/store';
import { ReorderExercisesSheet } from '../components/workout/ReorderExercisesSheet';
import { ContextualRestDock } from '../components/workout/ContextualRestDock';
import { Icon } from '../components/ui/Icon';
import type { SessionExercise } from '../types';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import './product-polish.css';
import './workout-density-feedback.css';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

const completedWorkingSets = (exercise: SessionExercise) =>
    (exercise.sets || []).filter(set => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop').length;

const nextWorkingSetId = (exercise: SessionExercise) =>
    (exercise.sets || []).find(set => !set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop')?.id;

export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack }) => {
    const { setLogs, lang } = useApp();
    const { config } = useAppConfig();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const { setRestTimer } = useTimerActions();
    const [reorderOpen, setReorderOpen] = useState(false);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const completionSnapshotRef = useRef<{ sessionId: number | null; counts: Map<number, number> }>({ sessionId: null, counts: new Map() });

    // Hevy-style smart superset flow. We watch only completed-working-set counts,
    // so typing weight/reps never causes navigation. Completing A1 scrolls to the
    // pending set on its partner; the existing card logic still handles normal sets.
    useEffect(() => {
        if (!activeSession) {
            completionSnapshotRef.current = { sessionId: null, counts: new Map() };
            return;
        }

        const currentCounts = new Map<number, number>();
        (activeSession.exercises || []).forEach(exercise => currentCounts.set(exercise.instanceId, completedWorkingSets(exercise)));
        const previous = completionSnapshotRef.current;

        if (previous.sessionId !== activeSession.id) {
            completionSnapshotRef.current = { sessionId: activeSession.id, counts: currentCounts };
            return;
        }

        const advancedExercise = (activeSession.exercises || []).find(exercise =>
            (currentCounts.get(exercise.instanceId) || 0) > (previous.counts.get(exercise.instanceId) || 0)
        );
        completionSnapshotRef.current = { sessionId: activeSession.id, counts: currentCounts };

        if (!advancedExercise?.supersetId) return;
        const partners = (activeSession.exercises || []).filter(exercise =>
            exercise.instanceId !== advancedExercise.instanceId && exercise.supersetId === advancedExercise.supersetId
        );
        const target = partners
            .map(exercise => ({ exercise, setId: nextWorkingSetId(exercise) }))
            .find(item => item.setId != null);
        if (!target?.setId) return;

        const timer = window.setTimeout(() => {
            document.getElementById(`set-row-${target.setId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 170);
        return () => window.clearTimeout(timer);
    }, [activeSession]);

    const handleFinish = useCallback(() => {
        if (!activeSession) return;
        const isDetached = activeSession.mesoId < 0 || activeSession.dayIdx < 0 || activeSession.week < 0;
        if (!isDetached && activeMeso) {
            onFinish();
            return;
        }

        const endTime = Date.now();
        const duration = activeSession.startTime ? (endTime - activeSession.startTime) / 1000 : 0;
        const log = {
            ...activeSession,
            endTime,
            duration,
            mesoId: activeSession.mesoId ?? -1,
            week: activeSession.week ?? -1,
        };

        setLogs(prev => [log as any, ...(Array.isArray(prev) ? prev : [])]);
        setActiveSession(null);
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
        onBack();
    }, [activeMeso, activeSession, onBack, onFinish, setActiveSession, setLogs, setRestTimer]);

    const commitExerciseOrder = useCallback((ordered: SessionExercise[]) => {
        setActiveSession(prev => prev ? { ...prev, exercises: ordered } : prev);
    }, [setActiveSession]);

    const methodologyWarning = isKong
        ? (lang === 'es'
            ? 'El orden forma parte de KONG: Puntos Débiles Primero y Fuerza Fatigada dependen de la secuencia. Este cambio afecta solo esta sesión; no modifica el programa oficial.'
            : 'Exercise order is part of KONG: Weak Points First and Fatigued Strength depend on sequence. This change affects this session only and does not alter the official program.')
        : undefined;

    return (
        <div className={`product-workout-polish workout-density-pass contents ${config.showRIR ? 'workout-rir-enabled' : ''}`}>
            <WorkoutViewImpl onFinish={handleFinish} onDiscard={onDiscard} onBack={onBack} />
            <ContextualRestDock session={activeSession} lang={lang} />

            {activeSession && activeSession.exercises.length > 1 && (
                <button
                    type="button"
                    onClick={() => setReorderOpen(true)}
                    className="workout-reorder-launcher fixed z-[45] flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.95)] text-[rgb(var(--text-muted))] shadow-lg transition-transform active:scale-90 active:text-primary-500"
                    aria-label={lang === 'es' ? 'Ordenar ejercicios' : 'Reorder exercises'}
                    title={lang === 'es' ? 'Ordenar ejercicios' : 'Reorder exercises'}
                >
                    <Icon name="GripVertical" size={18} strokeWidth={2.5} />
                </button>
            )}

            {activeSession && (
                <ReorderExercisesSheet
                    open={reorderOpen}
                    onOpenChange={setReorderOpen}
                    exercises={activeSession.exercises || []}
                    lang={lang}
                    onCommit={commitExerciseOrder}
                    methodologyWarning={methodologyWarning}
                />
            )}
        </div>
    );
};
