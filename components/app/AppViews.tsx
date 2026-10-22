import React, { Suspense } from 'react';
import { resolveRoutineStartAction } from './routineGuards';
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
import { KONG_4DAY_ID } from '../../programs/kong/constants';
import { resolveProgramDay } from '../../programs/engine/ProgramResolver';
import { completeWorkoutPipeline } from '../../services/workoutCompletionService';
import { maybeCreateAutoBackup } from '../../services/autoBackup';
import { notifyWorkoutDone } from '../../utils/reminders';
import { maybeExportWorkoutToHealth } from '../../utils/healthConnect';
import { useDiarySection } from '../../hooks/useDiarySection';
import { requestQuickStart, type AppView } from '../layout/navigation';
import type { NutriSubTab } from '../../views/NutriView';
const ExercisesView = React.lazy(() => import('../../views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const StatsView = React.lazy(() => import('../../views/StatsView').then(module => ({ default: module.StatsView })));
const ProgramEditView = React.lazy(() => import('../../views/ProgramEditView').then(m => ({ default: m.ProgramEditView })));
const SessionSummaryView = React.lazy(() => import('../../views/SessionSummaryView').then(m => ({ default: m.SessionSummaryView })));
const WorkoutView = React.lazy(() => import('../../views/WorkoutView').then(m => ({ default: m.WorkoutView })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const RoutineView = React.lazy(() => import('../../views/RoutineView').then(m => ({ default: m.RoutineView })));
const DiaryView = React.lazy(() => import('../../views/DiaryView').then(m => ({ default: m.DiaryView })));

interface AppViewsProps {
    view: AppView;
    setView: (view: AppView, after?: () => void) => void;
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
    showActiveSessionAlert?: boolean;
    setShowActiveSessionAlert?: (show: boolean) => void;
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
    showActiveSessionAlert = false, setShowActiveSessionAlert,
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
    const [diarySection, setDiarySection] = useDiarySection();
    // Keep lightweight view state above the lazy panels; switching sections
    // unmounts their charts/lists without resetting the user's search or tab.
    const [historySearch, setHistorySearch] = React.useState('');
    const [nutritionTab, setNutritionTab] = React.useState<NutriSubTab>('today');
    const [addMealRequested, setAddMealRequested] = React.useState(false);
    const handleAddMealHandled = React.useCallback(() => setAddMealRequested(false), []);
    const handleAddMeal = () => {
        setDiarySection('nutrition');
        setAddMealRequested(true);
        setView('diary');
    };
    const returnFromChild = (fallback: AppView) => {
        // The browser entry remembers the true origin, including a profile
        // sheet. Back consumes the child entry instead of replacing it.
        if (window.history.state?.parentView) {
            window.history.back();
        } else {
            setView(fallback);
        }
    };

    // Shared routine editor entry (KONG-aware); Home and Routine reuse it.
    // Shared routine editor entry (KONG-aware and activeSession-protected).
    // Reads session AND plan from the store at execution time: a stale render
    // (e.g. setActiveMeso(null) just before onEditProgram) must not reopen KONG.
    const handleEditProgram = React.useCallback(() => {
        const { activeSession: liveSession, activeMeso: liveMeso } = useStore.getState();
        if (liveSession) {
            setShowActiveSessionAlert?.(true);
            return;
        }
        const liveId = liveMeso?.programSystem?.systemId;
        const isKong = liveId === KONG_4DAY_V1.id || liveId === 'kong_4day' || liveId === KONG_4DAY_ID;
        if (isKong && liveMeso) {
            setShowKongConvertModal(true);
            return;
        }
        setView('program');
    }, [setView, setShowKongConvertModal, setShowActiveSessionAlert]);

    React.useEffect(() => {
        if (view === 'program' && activeSession) {
            setShowActiveSessionAlert?.(true);
            setView('routine');
        }
    }, [view, activeSession, setView, setShowActiveSessionAlert]);

    const buildAndSetSession = (idx: number) => {
        if (!activeMeso) { handleEditProgram(); return; }
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
                        onBack={() => returnFromChild('home')}
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
                    <LazyViewBoundary lang={lang} resetKey="exercises"><ExercisesView onBack={() => returnFromChild('routine')} /></LazyViewBoundary>
                </Suspense>
            ) : view === 'program' ? (
                <Suspense fallback={<LoadingSpinner />}>
                    <LazyViewBoundary lang={lang} resetKey="program"><ProgramEditView onBack={() => returnFromChild('routine')} /></LazyViewBoundary>
                </Suspense>
            ) : (
                <Layout
                    view={view}
                    setView={setView}
                    diarySection={diarySection}
                    onDiarySection={setDiarySection}
                    onOpenProgram={handleEditProgram}
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
                        }}
                        onEditProgram={handleEditProgram}
                        onSkipSession={onSkipSession}
                        onResumeSession={() => setView('workout')}
                        onStartFreeSession={requestQuickStart}
                        onAddMeal={handleAddMeal}
                    />}
                    {view === 'routine' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <RoutineView
                                onStartDay={(idx) => {
                                    const action = resolveRoutineStartAction(activeSession, activeMeso, idx);
                                    if (action === 'resume') {
                                        setView('workout');
                                        return;
                                    }
                                    if (action === 'replace') {
                                        setPendingStartDayIdx(idx);
                                        return;
                                    }
                                    buildAndSetSession(idx);
                                }}
                                onEditProgram={handleEditProgram}
                                onOpenExercises={() => setView('exercises')}
                            />
                        </Suspense>
                    )}
                    {view === 'progress' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={view}><StatsView /></LazyViewBoundary>
                        </Suspense>
                    )}
                    {view === 'diary' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey={`diary-${diarySection}`}>
                                <DiaryView
                                    section={diarySection} onSectionChange={setDiarySection}
                                    search={historySearch} onSearchChange={setHistorySearch}
                                    nutritionTab={nutritionTab} onNutritionTabChange={setNutritionTab}
                                    addMealRequested={addMealRequested} onAddMealHandled={handleAddMealHandled}
                                />
                            </LazyViewBoundary>
                        </Suspense>
                    )}
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
                            // Do not drag the old session's rest deadline into the new one.
                            setRestTimer(prev => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
                            buildAndSetSession(idx);
                        }}
                        onCancel={() => setPendingStartDayIdx(null)}
                    />
                </Suspense>
            )}
        </>
    );
};
