import React, { useCallback, useState } from 'react';
import { WorkoutView as WorkoutViewImpl } from './WorkoutViewImpl';
import { useAppConfig, useAppPreferences } from '../context/AppContext';
import { useStore } from '../lib/store';
import { ReorderExercisesSheet } from '../components/workout/ReorderExercisesSheet';
import type { SessionExercise } from '../types';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { TRANSLATIONS } from '../constants';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack }) => {
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const [reorderOpen, setReorderOpen] = useState(false);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const w = TRANSLATIONS[lang].workoutView;

    const handleFinish = useCallback(() => {
        onFinish();
    }, [onFinish]);

    const commitExerciseOrder = useCallback((ordered: SessionExercise[]) => {
        setActiveSession(prev => prev ? { ...prev, exercises: ordered } : prev);
    }, [setActiveSession]);

    const methodologyWarning = isKong ? w.kongOrderWarning : undefined;

    return (
        <div className={`product-workout-polish workout-density-pass contents ${config.showRIR ? 'workout-rir-enabled' : ''}`}>
            <WorkoutViewImpl
                onFinish={handleFinish}
                onDiscard={onDiscard}
                onBack={onBack}
                onOpenReorder={() => setReorderOpen(true)}
            />

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