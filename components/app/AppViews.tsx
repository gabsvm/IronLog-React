import React, { Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { useTimerActions } from '../../context/TimerContext';
import { useStore } from '../../lib/store';
import { Layout } from '../layout/Layout';
import { HomeView } from '../../views/HomeView';
import { LazyViewBoundary } from '../ui/LazyViewBoundary';
import { LoadingSpinner, FullScreenLoading } from './AppLoading';
import { SessionBuilder } from '../../services/SessionBuilder';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { resolveProgramDay } from '../../programs/engine/ProgramResolver';
import { completeWorkoutPipeline } from '../../services/workoutCompletionService';
import { maybeCreateAutoBackup } from '../../services/autoBackup';
import { notifyWorkoutDone } from '../../utils/reminders';

// Lazy Load views — keeps initial bundle small
const HistoryView = React.lazy(() => import('../../views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('../../views/StatsView').then(module => ({ default: module.StatsView })));
const NutriView = React.lazy(() => import('../../views/NutriView').then(m => ({ default: m.NutriView })));
const ExercisesView = React.lazy(() => import('../../views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const ProgramEditView = React.lazy(() => import('../../views/ProgramEditView').then(m => ({ default: m.ProgramEditView })));
const SessionSummaryView = React.lazy(() => import('../../views/SessionSummaryView').then(m => ({ default: m.SessionSummaryView })));
const WorkoutView = React.lazy(() => import('../../views/WorkoutView').then(m => ({ default: m.WorkoutView })));

interface AppViewsProps {
    view: string;
    setView: (view: any, after?: () => void) => void;
    activeSession: any;
    setActiveSession: (session: any) => void;
    completedWorkoutLog: any;
    setCompletedWorkoutLog: (log: any) => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSyncing: boolean;
    setShowAuthModal: (show: boolean) => void;
    setShowCommandPalette: (show: boolean) => void;
    setShowResetModal: (show: boolean) => void;
    setShowMesoCompleteModal: (show: boolean) => void;
    setShowKongConvertModal: (show: boolean) => void;
    onSkipSession: (dayIdx: number) => void;
}

/**
 * Q18: main view switch, moved verbatim from App (workout/summary/exercises/
 * program + the Layout tab shell). Session lifecycle handlers move with it.
 */
export const AppViews: React.FC<AppViewsProps> = ({
    view, setView,
    activeSession, setActiveSession,
    completedWorkoutLog, setCompletedWorkoutLog,
    onExport, onForceSync, onImportFile, isSyncing,
    setShowAuthModal, setShowCommandPalette, setShowResetModal,
    setShowMesoCompleteModal, setShowKongConvertModal,
    onSkipSession,
}) => {
    const {
        program, exercises, lang, logs, setLogs,
        config, rpFeedback,
        userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
        personalTemplates, customFoods,
    } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const { setRestTimer } = useTimerActions();

    return (
        <>
            {view === 'workout' && activeSession ? (
                <LazyViewBoundary lang={lang} resetKey="workout">
                <Suspense fallback={<LoadingSpinner />}>
                    <WorkoutView
                        onFinish={() => {
                            if (!activeSession) return;

                            const result = completeWorkoutPipeline({
                                activeSession,
                                activeMeso,
                                program: Array.isArray(program) ? program : [],
                                logs: Array.isArray(logs) ? logs : [],
                                userProfile,
                            });

                            setLogs(result.updatedLogs);

                            // Q13: today's training reminder (if any) is satisfied.
                            notifyWorkoutDone();

                            // Q6: automatic local snapshot (max 1 per 24 h, last 3 kept).
                            void maybeCreateAutoBackup({
                                program: Array.isArray(program) ? program : [],
                                exercises: Array.isArray(exercises) ? exercises : [],
                                logs: result.updatedLogs,
                                activeMeso: result.updatedMeso ?? activeMeso,
                                userProfile, nutritionLogs, cardioSessions, bodyLogs,
                                macroGoals, nutritionGoal, personalTemplates, customFoods,
                                rpFeedback, config,
                            });

                            if (result.isMesoComplete) {
                                setShowMesoCompleteModal(true);
                            } else if (!result.isDetached && result.updatedMeso && result.updatedMeso !== activeMeso) {
                                setActiveMeso(result.updatedMeso);
                            }

                            setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
                            setCompletedWorkoutLog(result.log);
                            // Cleared atomically with the view flip: clearing before the async
                            // transition exposes view==='workout' with no session (blank Layout).
                            setView('summary', () => setActiveSession(null));
                        }}
                        onDiscard={() => {
                            setView('home', () => setActiveSession(null));
                        }}
                        onBack={() => setView('home')}
                    />
                </Suspense>
                </LazyViewBoundary>
            ) : view === 'summary' && completedWorkoutLog ? (
                <LazyViewBoundary lang={lang} resetKey="summary">
                <Suspense fallback={<FullScreenLoading />}>
                    <SessionSummaryView
                        log={completedWorkoutLog}
                        onClose={() => {
                            setCompletedWorkoutLog(null);
                            setView('home');
                        }}
                    />
                </Suspense>
                </LazyViewBoundary>
            ) : view === 'exercises' ? (
                <Suspense fallback={<LoadingSpinner />}>
                    <LazyViewBoundary lang={lang} resetKey="exercises"><ExercisesView onBack={() => { setView('home'); window.dispatchEvent(new CustomEvent('gainslab:open-profile', { detail: { section: 'training' } })); }} /></LazyViewBoundary>
                </Suspense>
            ) : view === 'program' ? (
                <Suspense fallback={<LoadingSpinner />}>
                    <LazyViewBoundary lang={lang} resetKey="program"><ProgramEditView onBack={() => setView('home')} /></LazyViewBoundary>
                </Suspense>
            ) : (
                <Layout
                    view={view as any}
                    setView={setView as any}
                    onOpenProgram={() => setView('program')}
                    onOpenExercises={() => setView('exercises')}
                    onReset={() => setShowResetModal(true)}
                    onExport={onExport}
                    onForceSync={onForceSync}
                    onImportFile={onImportFile}
                    onLogin={() => setShowAuthModal(true)}
                    isSyncing={isSyncing}
                    onOpenCommandPalette={() => setShowCommandPalette(true)}
                >
                    {view === 'home' && <HomeView
                        startSession={(idx) => {
                            if (!activeMeso) { setView('program'); return; }

                            // CRITICAL FIX: Check if an active session already exists for this day/meso
                            // If so, just resume it instead of overwriting.
                            if (activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === idx) {
                                setView('workout');
                                return;
                            }

                            const safeProgram = Array.isArray(program) ? program : [];
                            const dayDef = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id
                                ? resolveProgramDay(KONG_4DAY_V1, activeMeso.week, idx, activeMeso.programSystem.substitutions)
                                : safeProgram[idx];
                            if (!dayDef) return;

                            const newSession = SessionBuilder.buildFromProgramDay(
                                idx,
                                dayDef,
                                activeMeso,
                                Array.isArray(exercises) ? exercises : [],
                                Array.isArray(logs) ? logs : [],
                                lang,
                                rpFeedback,
                                config
                            );

                            if (newSession) {
                                setActiveSession(newSession);
                                setView('workout');
                            }
                        }}
                        onEditProgram={() => {
                            if (activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id) {
                                setShowKongConvertModal(true);
                                return;
                            }
                            setView('program');
                        }}
                        onSkipSession={onSkipSession}
                    />}
                    {view === 'history' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><HistoryView /></LazyViewBoundary>
                        </Suspense>
                    )}
                    {view === 'stats' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><StatsView /></LazyViewBoundary>
                        </Suspense>
                    )}
                    {view === 'nutrition' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><NutriView /></LazyViewBoundary>
                        </Suspense>
                    )}
                </Layout>
            )}
        </>
    );
};
