import React, { useCallback } from 'react';
import { WorkoutView as WorkoutViewImpl } from './WorkoutViewImpl';
import { useApp } from '../context/AppContext';
import { useTimerActions } from '../context/TimerContext';
import { useStore } from '../lib/store';
import './product-polish.css';

interface WorkoutViewProps {
    onFinish: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

/**
 * Product shell around the proven workout implementation.
 * Adds detached-session completion without changing the workout controller itself.
 */
export const WorkoutView: React.FC<WorkoutViewProps> = ({ onFinish, onDiscard, onBack }) => {
    const { setLogs } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const { setRestTimer } = useTimerActions();

    const handleFinish = useCallback(() => {
        // Program/mesocycle sessions retain the existing completion, summary and
        // week-advancement lifecycle in App.tsx.
        if (activeMeso) {
            onFinish();
            return;
        }

        // Detached sessions (freestyle, WOD, calisthenics, ad-hoc) are valid
        // workouts too. Persist them directly instead of silently failing because
        // there is no active mesocycle.
        if (!activeSession) return;
        const endTime = Date.now();
        const duration = activeSession.startTime
            ? (endTime - activeSession.startTime) / 1000
            : 0;
        const log = { ...activeSession, endTime, duration, mesoId: activeSession.mesoId ?? -1, week: activeSession.week ?? -1 };

        setLogs(prev => [log as any, ...(Array.isArray(prev) ? prev : [])]);
        setActiveSession(null);
        setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
        onBack();
    }, [activeMeso, activeSession, onBack, onFinish, setActiveSession, setLogs, setRestTimer]);

    return (
        <div className="product-workout-polish contents">
            <WorkoutViewImpl onFinish={handleFinish} onDiscard={onDiscard} onBack={onBack} />
        </div>
    );
};
