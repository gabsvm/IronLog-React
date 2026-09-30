import React, { useCallback, useState } from 'react';
import { WorkoutView as WorkoutViewImpl } from './WorkoutViewImpl';
import { useApp, useAppConfig } from '../context/AppContext';
import { useStore } from '../lib/store';
import { ReorderExercisesSheet } from '../components/workout/ReorderExercisesSheet';
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

export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack }) => {
    const { lang } = useApp();
    const { config } = useAppConfig();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const [reorderOpen, setReorderOpen] = useState(false);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;

    const handleFinish = useCallback(() => {
        onFinish();
    }, [onFinish]);

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

            {activeSession && activeSession.exercises.length > 1 && (
                <button
                    type="button"
                    onClick={() => setReorderOpen(true)}
                    className="workout-reorder-launcher fixed z-[45] flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/95 text-zinc-400 shadow-lg transition-transform active:scale-90 active:text-primary-400"
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