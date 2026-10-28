import React, { Suspense } from 'react';
import { pickLang } from '../../utils/i18n';
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
import { maybeExportWorkoutToHealth } from '../../utils/healthConnect';

// Lazy Load views — keeps initial bundle small
const HistoryView = React.lazy(() => import('../../views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('../../views/StatsView').then(module => ({ default: module.StatsView })));
const NutriView = React.lazy(() => import('../../views/NutriView').then(m => ({ default: m.NutriView })));
const ExercisesView = React.lazy(() => import('../../views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const ProgramEditView = React.lazy(() => import('../../views/ProgramEditView').then(m => ({ default: m.ProgramEditView })));
const SessionSummaryView = React.lazy(() => import('../../views/SessionSummaryView').then(m => ({ default: m.SessionSummaryView })));
const WorkoutView = React.lazy(() => import('../../views/WorkoutView').then(m => ({ default: m.WorkoutView })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

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
    const [pendingStartDayIdx, setPendingStartDayIdx] = React.useState<number | null>(null);

    const buildAndSetSession = (idx: number) => {
        if (!activeMeso) { setView('program'); return; }

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
    };

    const homeProps = {
        startSession: (idx: number) => {
            if (!activeMeso) { setView('program'); return; }

            // If an active session already exists for this exact day/meso, resume it
            if (activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === idx) {
                setView('workout');
                return;
            }

            // If an active session already exists for another day/meso, prompt confirmation
            if (activeSession) {
                setPendingStartDayIdx(idx);
                return;
            }

            buildAndSetSession(idx);
        },
        onEditProgram: () => {
            if (activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id) {
                setShowKongConvertModal(true);
                return;
            }
            setView('program');
        },
        onSkipSession,
    };

    return (
        <>
            {view === 'summary' && completedWorkoutLog ? (
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

                                    // U9: Health Connect export (opt-in, Android app only, never throws).
                                    void maybeExportWorkoutToHealth(result.log);

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
                    ) : view === 'exercises' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey="exercises"><ExercisesView onBack={() => { setView('home'); window.dispatchEvent(new CustomEvent('gainslab:open-profile', { detail: { section: 'training' } })); }} /></LazyViewBoundary>
                        </Suspense>
                    ) : view === 'mesos' ? (
                        <HomeView {...homeProps} {...({ initialSubView: 'mesos' } as any)} />
                    ) : view === 'templates' ? (
                        <HomeView {...homeProps} {...({ initialSubView: 'templates' } as any)} />
                    ) : (view === 'home' || (view === 'workout' && !activeSession)) ? (
                        <HomeView {...homeProps} {...({ initialSubView: 'workout' } as any)} />
                    ) : view === 'history' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><HistoryView /></LazyViewBoundary>
                        </Suspense>
                    ) : view === 'stats' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><StatsView /></LazyViewBoundary>
                        </Suspense>
                    ) : view === 'nutrition' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><NutriView /></LazyViewBoundary>
                        </Suspense>
                    ) : null}
                </Layout>
            )}

            {pendingStartDayIdx !== null && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={pickLang(lang, { en: 'Replace active workout', es: 'Reemplazar sesión activa' })}
                        description={pickLang(lang, {
                            en: 'You already have a workout in progress. Do you want to discard it and start this new workout?',
                            es: 'Ya tienes un entrenamiento en curso. ¿Deseas descartarlo y comenzar este nuevo entrenamiento?',
                        })}
                        confirmText={pickLang(lang, { en: 'Start new', es: 'Comenzar nueva' })}
                        cancelText={pickLang(lang, { en: 'Cancel', es: 'Cancelar' })}
                        variant="danger"
                        onConfirm={() => {
                            const idx = pendingStartDayIdx;
                            setPendingStartDayIdx(null);
                            buildAndSetSession(idx);
                        }}
                        onCancel={() => setPendingStartDayIdx(null)}
                    />
                </Suspense>
            )}
        </>
    );
};
