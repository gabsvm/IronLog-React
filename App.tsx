
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useTimerContext } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ExercisesView } from './views/ExercisesView';
import { ProgramEditView } from './views/ProgramEditView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { SessionSummaryView } from './views/SessionSummaryView';
import { SetupWizard } from './components/onboarding/SetupWizard';
import { Landing } from './components/onboarding/Landing';
import { NutritionView } from './views/NutritionView';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { Button } from './components/ui/Button';
import { useAuth, AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { getLastLogForExercise } from './utils';
import { syncService } from './services/syncService';
import { usePro } from './hooks/usePro';
import { PaywallModal } from './components/pro/PaywallModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { FreestyleSessionModal } from './components/workout/FreestyleSessionModal';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES } from './data/disciplineExercises';

// Lazy Load heavier views
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));
const NutriView = React.lazy(() => import('./views/NutriView').then(m => ({ default: m.NutriView })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Define View Hierarchy for Directional Animations
const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'nutri': 1,
    'workout': 2,
    'exercises': 2,
    'program': 2,
    'nutrition': 1
};

const AppContent = () => {
    const {
        activeSession, activeMeso, setActiveSession,
        program, exercises, lang, logs, setLogs,
        setExercises, setProgram, setActiveMeso,
        config, rpFeedback, hasSeenOnboarding, setHasSeenOnboarding,
        pendingCloudData, confirmCloudSync, cancelCloudSync
    } = useApp();

    const { setRestTimer } = useTimerContext();
    const { user } = useAuth();
    const { checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();

    const t = TRANSLATIONS[lang];

<<<<<<< HEAD
    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats' | 'summary' | 'nutri'>('home');
=======
    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats' | 'summary' | 'nutrition'>('home');
>>>>>>> main
    const [completedWorkoutLog, setCompletedWorkoutLog] = useState<any>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showLanding, setShowLanding] = useState(!hasSeenOnboarding);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showMesoCompleteModal, setShowMesoCompleteModal] = useState(false);
    const [showFreestyleModal, setShowFreestyleModal] = useState(false);

    // Custom Modals State
    const [importData, setImportData] = useState<any>(null);
    const [showForceSyncModal, setShowForceSyncModal] = useState(false);

    // UX: Helper to trigger View Transitions with Direction
    const setView = (newView: typeof view) => {
        if (newView === view) return;
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        let direction = 'fade';
        if (nextDepth > currentDepth) direction = 'forward';
        else if (nextDepth < currentDepth) direction = 'back';
        document.documentElement.dataset.transition = direction;

        if ((document as any).startViewTransition) {
            const transition = (document as any).startViewTransition(() => {
                setViewState(newView);
            });
            transition.finished.finally(() => {
                document.documentElement.dataset.transition = '';
            });
        } else {
            setViewState(newView);
        }
    };

    // History management logic
    const isPopping = useRef(false);
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
            }
        } catch (e) { }

        const handlePop = (e: PopStateEvent) => {
            isPopping.current = true;
            if (e.state) {
                document.documentElement.dataset.transition = 'back';
                if ((document as any).startViewTransition) {
                    const t = (document as any).startViewTransition(() => {
                        if (e.state?.view) setViewState(e.state.view);
                        setShowSettings(!!e.state?.settings);
                    });
                    t.finished.finally(() => { document.documentElement.dataset.transition = ''; });
                } else {
                    if (e.state?.view) setViewState(e.state.view);
                    setShowSettings(!!e.state?.settings);
                }
            } else {
                setView('home');
                setShowSettings(false);
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    useEffect(() => {
        if (isPopping.current) {
            isPopping.current = false;
            return;
        }
        const state = { view, settings: showSettings };
        const hash = showSettings ? 'settings' : view;
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.pushState(state, '', `#${hash}`);
            }
        } catch (e) { }
    }, [view, showSettings]);

    // One-time: merge CrossFit + Calisthenics exercises into library
    useEffect(() => {
        if (!exercises || exercises.length === 0) return;
        const existingIds = new Set(exercises.map((e: any) => e.id));
        const toAdd = [...CROSSFIT_EXERCISES, ...CALISTHENICS_EXERCISES].filter(e => !existingIds.has(e.id));
        if (toAdd.length > 0) {
            setExercises((prev: any[]) => [...(Array.isArray(prev) ? prev : []), ...toAdd]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        const data = {
            program, exercises, logs, activeMeso, activeSession,
            version: '3.0.0'
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ironlog_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleForceSync = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // CHECK PRO before allowing sync
        if (!checkPro("sync")) return;

        setShowForceSyncModal(true);
    };

    const executeForceSync = async () => {
        if (!user) return;
        setIsSyncing(true);
        setShowForceSyncModal(false);
        try {
            await syncService.uploadState(user.uid, {
                program, activeMeso, exercises, logs, config, rpFeedback, activeSession
            });
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                setImportData(data); // Triggers Confirm Modal
            } catch (err) {
                console.error("Invalid File");
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (importData) {
            if (importData.program) setProgram(importData.program);
            if (importData.exercises) setExercises(importData.exercises);
            if (importData.logs) setLogs(importData.logs);
            if (importData.activeMeso) setActiveMeso(importData.activeMeso);
            if (importData.activeSession) setActiveSession(importData.activeSession);
            setImportData(null);
            window.location.reload();
        }
    };

    const handleSkipSession = (dayIdx: number) => {
        if (!activeMeso) return;
        const safeProgram = Array.isArray(program) ? program : [];
        const dayDef = safeProgram[dayIdx];

        // Create a log entry marked as skipped
        const skippedLog: any = {
            id: Date.now(),
            dayIdx: dayIdx,
            name: dayDef ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) : `Day ${dayIdx + 1}`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            mesoId: activeMeso.id,
            week: activeMeso.week,
            exercises: [],
            skipped: true
        };

        setLogs([skippedLog, ...(Array.isArray(logs) ? logs : [])]);
    };

    return (
        <>
            {/* New Setup Wizard Logic */}
            {!hasSeenOnboarding && (
                showLanding ? (
                    <Landing
                        onStart={() => setShowLanding(false)}
                        onLogin={() => setShowAuthModal(true)}
                    />
                ) : (
                    <SetupWizard onComplete={() => setHasSeenOnboarding(true)} />
                )
            )}

            {/* Main App Content - Only visible if onboarding is done */}
            {hasSeenOnboarding && (
                <>
                    {view === 'workout' && activeSession ? (
                        <WorkoutView
                            onFinish={() => {
                                if (!activeSession || !activeMeso) return;

                                // 1. Log the session
                                const duration = activeSession.startTime ? (Date.now() - activeSession.startTime) / 1000 : 0;
                                const log = { ...activeSession, endTime: Date.now(), duration };
                                const newLogs = [log, ...(Array.isArray(logs) ? logs : [])];
                                setLogs(newLogs);

                                // 2. Check for week / meso completion
                                const workoutsThisWeek = newLogs.filter(l =>
                                    l.mesoId === activeMeso.id && l.week === activeMeso.week && !l.skipped
                                );
                                const completedDaysThisWeek = new Set(workoutsThisWeek.map(l => l.dayIdx));
                                const programDays = program.filter(day => (day.slots || []).length > 0).length;

                                if (completedDaysThisWeek.size >= programDays) {
                                    // Week is complete
                                    if (activeMeso.week >= activeMeso.duration) {
                                        // Meso is complete
                                        setShowMesoCompleteModal(true);
                                    } else {
                                        // Advance to next week
                                        setActiveMeso(prev => prev ? { ...prev, week: prev.week + 1, isDeload: false } : null);
                                    }
                                }

                                // 3. Clean up session state and navigate
                                setActiveSession(null);
                                setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
                                setCompletedWorkoutLog(log);
                                setView('summary');
                            }}
                            onDiscard={() => {
                                // Specific handler for Discarding a session without saving
                                setActiveSession(null); // Wipe active session IDB
                                setView('home'); // Go back to Home
                            }}
                            onBack={() => setView('home')}
                        />
                    ) : view === 'summary' && completedWorkoutLog ? (
                        <SessionSummaryView
                            log={completedWorkoutLog}
                            onClose={() => {
                                setCompletedWorkoutLog(null);
                                setView('home');
                            }}
                        />
                    ) : view === 'exercises' ? (
                        <ExercisesView onBack={() => { setView('home'); setShowSettings(true); }} />
                    ) : view === 'program' ? (
                        <ProgramEditView onBack={() => setView('home')} />
                    ) : (
                        <Layout view={view as any} setView={setView as any} onOpenSettings={() => setShowSettings(true)}>
                            {view === 'home' && <HomeView
                                startSession={(idx) => {
                                    if (!activeMeso) { setShowFreestyleModal(true); return; }

                                    // CRITICAL FIX: Check if an active session already exists for this day/meso
                                    // If so, just resume it instead of overwriting.
                                    if (activeSession && activeSession.mesoId === activeMeso.id && activeSession.dayIdx === idx) {
                                        setView('workout');
                                        return;
                                    }

                                    const safeProgram = Array.isArray(program) ? program : [];
                                    const dayDef = safeProgram[idx];
                                    if (!dayDef) return;
                                    const dayNameSafe = dayDef.dayName ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) : `Day ${idx + 1}`;
                                    const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
                                    const dayPlan = Array.isArray(mesoPlan[idx]) ? mesoPlan[idx] : [];
                                    const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
                                    const safeLogs = Array.isArray(logs) ? logs : [];
                                    const isDeload = !!activeMeso.isDeload;

                                    const sessionExs = (dayDef.slots || []).map((slotDef, sIdx) => {
                                        if (!slotDef) return null;
                                        const exId = dayPlan[sIdx];
                                        let exDef = exId ? safeExercises.find(e => e.id === exId) : safeExercises.find(e => e.muscle === slotDef.muscle);
                                        if (!exDef && safeExercises.length > 0) exDef = safeExercises[0];
                                        if (!exDef) exDef = { id: 'unknown', name: 'Unknown', muscle: slotDef.muscle || 'CHEST' };

                                        const lastSets = getLastLogForExercise(exDef.id, safeLogs);
                                        let setTarget = slotDef.setTarget || 3;
                                        if (isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

                                        let initialSets;
                                        if (slotDef.isAVT) {
                                            const roundId = Date.now() + Math.random();
                                            initialSets = Array.from({ length: 4 }, (_, i) => ({
                                                id: Date.now() + Math.random() + i,
                                                weight: '',
                                                reps: slotDef.avtStartReps ? String(slotDef.avtStartReps) : '6',
                                                rpe: '', completed: false, type: 'avt_hop',
                                                avtRoundId: roundId, isLastHop: false
                                            }));
                                        } else {
                                            initialSets = Array(setTarget).fill(null).map((_, i) => ({
                                                id: Date.now() + Math.random() + i,
                                                weight: '', reps: '', rpe: '', completed: false,
                                                // Apply saved Set Type preference from Template if available, else default to 'regular'
                                                type: slotDef.setType || 'regular',
                                                hintWeight: lastSets?.[i]?.weight, hintReps: lastSets?.[i]?.reps,
                                                prevWeight: lastSets?.[i]?.weight, prevReps: lastSets?.[i]?.reps
                                            }));
                                        }

                                        return { ...exDef, instanceId: Date.now() + Math.random() + sIdx, slotLabel: slotDef.muscle, targetReps: slotDef.reps, sets: initialSets as any };
                                    }).filter(Boolean);

                                    setActiveSession({ id: Date.now(), dayIdx: idx, name: `${activeMeso.week} • ${dayNameSafe}`, exercises: sessionExs as any, startTime: Date.now(), mesoId: activeMeso.id, week: activeMeso.week });
                                    setView('workout');
                                }}
                                onEditProgram={() => setView('program')}
                                onSkipSession={handleSkipSession}
                                onStartFreeSession={() => setShowFreestyleModal(true)}
                            />}
                            {view === 'history' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <HistoryView />
                                </Suspense>
                            )}
                            {view === 'stats' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <StatsView />
                                </Suspense>
                            )}
<<<<<<< HEAD
                            {view === 'nutri' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <NutriView />
                                </Suspense>
                            )}
=======
                            {view === 'nutrition' && <NutritionView />}
>>>>>>> main
                        </Layout>
                    )}
                </>
            )}

            <RestTimerOverlay />

            {/* Freestyle Session Picker (CrossFit, Calisthenics, Free Gym) */}
            <FreestyleSessionModal
                isOpen={showFreestyleModal}
                onClose={() => setShowFreestyleModal(false)}
                onStart={(session) => {
                    setActiveSession(session);
                    setShowFreestyleModal(false);
                    setView('workout');
                }}
            />

            {/* Standard Modal Overlays */}
            {showMesoCompleteModal && (
                <ConfirmModal
                    isOpen={true}
                    title={t.finishMesoTitle || "Complete Mesocycle?"}
                    description={t.finishMesoDesc || "You've completed the final week. Great work! Conclude the mesocycle now?"}
                    confirmText={t.complete || "Complete"}
                    cancelText={t.notYet || "Not Yet"}
                    onConfirm={() => {
                        setActiveMeso(null);
                        setShowMesoCompleteModal(false);
                    }}
                    onCancel={() => setShowMesoCompleteModal(false)}
                />
            )}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {showPaywall && (
                <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
            )}

            {/* SYNC CONFLICT MODAL */}
            <ConfirmModal
                isOpen={!!pendingCloudData}
                title={lang === 'en' ? "Cloud Sync" : "Sincronización Nube"}
                description={lang === 'en' ? "Newer data found in the cloud. Download it? (This will overwrite current local data)" : "Datos más recientes encontrados en la nube. ¿Descargar? (Esto sobrescribirá los datos locales actuales)"}
                confirmText={lang === 'en' ? "Download" : "Descargar"}
                cancelText={lang === 'en' ? "Keep Local" : "Mantener Local"}
                onConfirm={confirmCloudSync}
                onCancel={cancelCloudSync}
                variant="primary"
            />

            {/* IMPORT CONFIRM MODAL */}
            <ConfirmModal
                isOpen={!!importData}
                title={t.import}
                description={t.importConfirm}
                confirmText={t.import}
                cancelText={t.cancel}
                onConfirm={confirmImport}
                onCancel={() => setImportData(null)}
                variant="danger"
            />

            {/* FORCE SYNC MODAL */}
            <ConfirmModal
                isOpen={showForceSyncModal}
                title={lang === 'en' ? "Force Sync" : "Forzar Sincronización"}
                description={lang === 'en' ? "Upload current local data to cloud? This will overwrite cloud data." : "¿Subir datos locales a la nube? Esto sobrescribirá los datos de la nube."}
                confirmText={lang === 'en' ? "Upload" : "Subir"}
                cancelText={t.cancel}
                onConfirm={executeForceSync}
                onCancel={() => setShowForceSyncModal(false)}
            />

            {/* FACTORY RESET MODAL */}
            {showResetModal && (
                <ConfirmModal
                    isOpen={true}
                    title={t.dangerZone}
                    description={t.deleteDataConfirm}
                    confirmText={t.delete}
                    cancelText={t.cancel}
                    variant="danger"
                    onConfirm={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    onCancel={() => setShowResetModal(false)}
                />
            )}

            {/* SETTINGS OVERLAY (Now with Login Callback) */}
            {showSettings && view !== 'exercises' && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    onOpenProgram={() => { setView('program'); setShowSettings(false); }}
                    onOpenExercises={() => { setView('exercises'); setShowSettings(false); }}
                    onReset={() => setShowResetModal(true)}
                    onExport={handleExport}
                    onForceSync={handleForceSync}
                    onImportFile={handleImportFile}
                    onLogin={() => {
                        setShowSettings(false);
                        setShowAuthModal(true);
                    }}
                    isSyncing={isSyncing}
                />
            )}
        </>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </AuthProvider>
    );
}
