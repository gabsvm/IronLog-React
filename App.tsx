
import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useTimerContext } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { Button } from './components/ui/Button';
import { useAuth, AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { getLastLogForExercise, uid } from './utils';
import { syncService } from './services/syncService';
import { usePro } from './hooks/usePro';
import { PaywallModal } from './components/pro/PaywallModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { FreestyleSessionModal } from './components/workout/FreestyleSessionModal';
import { TwoBlockMassModal } from './components/workout/TwoBlockMassModal';
import { CommandPalette, CommandAction } from './components/ui/CommandPalette';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES, NILSSON_BW_EXERCISES } from './data/disciplineExercises';
import { SessionBuilder } from './services/SessionBuilder';
import { useStore } from './lib/store';

// Lazy Load views — keeps initial bundle small
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));
const NutriView = React.lazy(() => import('./views/NutriView').then(m => ({ default: m.NutriView })));
const ExercisesView = React.lazy(() => import('./views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const ProgramEditView = React.lazy(() => import('./views/ProgramEditView').then(m => ({ default: m.ProgramEditView })));
const SessionSummaryView = React.lazy(() => import('./views/SessionSummaryView').then(m => ({ default: m.SessionSummaryView })));
const SetupWizard = React.lazy(() => import('./components/onboarding/SetupWizard').then(m => ({ default: m.SetupWizard })));
const Landing = React.lazy(() => import('./components/onboarding/Landing').then(m => ({ default: m.Landing })));

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Wraps a DOM mutation in a View Transition (graceful fallback when unsupported).
const withTransition = (direction: string, callback: () => void) => {
    document.documentElement.dataset.transition = direction;
    if ((document as any).startViewTransition) {
        (document as any).startViewTransition(callback)
            .finished.finally(() => { document.documentElement.dataset.transition = ''; });
    } else {
        callback();
        document.documentElement.dataset.transition = '';
    }
};

// View Hierarchy for Directional Animations
const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'workout': 2,
    'exercises': 2,
    'program': 2,
    'nutrition': 1
};

const AppContent = () => {
    const {
        program, exercises, lang, logs, setLogs,
        setExercises, setProgram,
        config, rpFeedback, hasSeenOnboarding, setHasSeenOnboarding,
        isAppLoading,
        pendingCloudData, confirmCloudSync, cancelCloudSync,
        userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal
    } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);

    const { setRestTimer } = useTimerContext();
    const { user } = useAuth();
    const { checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();

    const t = TRANSLATIONS[lang];

    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats' | 'summary' | 'nutrition'>('home');
    const [completedWorkoutLog, setCompletedWorkoutLog] = useState<any>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showLanding, setShowLanding] = useState(!hasSeenOnboarding);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showMesoCompleteModal, setShowMesoCompleteModal] = useState(false);
    const [showFreestyleModal, setShowFreestyleModal] = useState(false);
    const [showTwoBlockModal, setShowTwoBlockModal] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Custom Modals State
    const [importData, setImportData] = useState<any>(null);
    const [showForceSyncModal, setShowForceSyncModal] = useState(false);

    // Sync truncation warning — fires when cloud history is capped at 200 entries
    const [syncTruncatedWarning, setSyncTruncatedWarning] = useState<{ kept: number; total: number } | null>(null);
    useEffect(() => {
        const handler = (e: Event) => {
            const { kept, total } = (e as CustomEvent).detail;
            setSyncTruncatedWarning({ kept, total });
        };
        window.addEventListener('ironlog:sync-truncated', handler);
        return () => window.removeEventListener('ironlog:sync-truncated', handler);
    }, []);

    const setView = useCallback((newView: typeof view) => {
        if (newView === view) return;
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        const direction = nextDepth > currentDepth ? 'forward' : nextDepth < currentDepth ? 'back' : 'fade';
        withTransition(direction, () => setViewState(newView));
    }, [view]);

    // Command Palette actions — memoized so the array+5 object literals aren't
    // rebuilt on every parent re-render (was firing on every keystroke during
    // workouts because activeSession/activeMeso changes propagate here).
    const commandActions = useMemo<CommandAction[]>(() => {
        const actions: CommandAction[] = [];
        if (activeSession) {
            actions.push({
                id: 'resume',
                label: { en: 'Resume active session', es: 'Reanudar sesión activa' },
                description: { en: activeSession.name, es: activeSession.name },
                icon: 'Play',
                accent: 'emerald',
                badge: lang === 'es' ? 'EN CURSO' : 'LIVE',
                onSelect: () => setView('workout'),
                keywords: ['continue', 'resume', 'continuar', 'activa'],
            });
        }
        if (activeMeso) {
            actions.push({
                id: 'meso_today',
                label: { en: 'Continue mesocycle (today)', es: 'Continuar mesociclo (hoy)' },
                description: { en: `${activeMeso.mesoType || ''} · Week ${activeMeso.week}`, es: `${activeMeso.mesoType || ''} · Semana ${activeMeso.week}` },
                icon: 'Calendar',
                accent: 'primary',
                onSelect: () => setView('home'),
                keywords: ['program', 'rutina', 'plan'],
            });
        }
        actions.push({
            id: 'two_block',
            label: { en: 'Two Block Mass', es: 'Two Block Mass' },
            description: { en: 'Nick Nilsson · 8 protocols, 6-week cycle', es: 'Nick Nilsson · 8 protocolos, ciclo 6 semanas' },
            icon: 'Layers',
            accent: 'amber',
            onSelect: () => setShowTwoBlockModal(true),
            keywords: ['nilsson', 'mesocycle', 'accumulation', 'intensification', 'mesociclo'],
        });
        actions.push({
            id: 'freestyle',
            label: { en: 'Freestyle / WOD / Skill', es: 'Sesión Libre / WOD / Skill' },
            description: { en: 'Free gym, CrossFit benchmark or calisthenics skill', es: 'Gym libre, WOD CrossFit o skill de calistenia' },
            icon: 'Dumbbell',
            accent: 'violet',
            onSelect: () => setShowFreestyleModal(true),
            keywords: ['crossfit', 'calisthenics', 'libre', 'wod', 'skill'],
        });
        actions.push({
            id: 'program',
            label: { en: 'Edit my program', es: 'Editar mi programa' },
            description: { en: 'Open the routine editor', es: 'Abrir el editor de rutinas' },
            icon: 'Edit',
            accent: 'zinc',
            onSelect: () => setView('program'),
            keywords: ['routine', 'rutina', 'template', 'plantilla'],
        });
        return actions;
    }, [activeSession, activeMeso, lang, setView]);

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
                withTransition('back', () => {
                    if (e.state?.view) setViewState(e.state.view);
                    setShowSettings(!!e.state?.settings);
                });
            } else {
                setView('home');
                setShowSettings(false);
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
        // Intentional: mount-once popstate listener. `setView` would change every
        // render and re-binding the listener serves no purpose.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Merge CrossFit + Calisthenics exercises into the library — runs ONCE, but only
    // AFTER IndexedDB hydration finishes (isAppLoading === false). Running it earlier was
    // the bug: the seed DEFAULT_LIBRARY is replaced by the hydrated value a tick later, so
    // a merge against the seed (a) missed real duplicates and (b) got overwritten by the
    // stored value. We rebuild the list keyed by id, which is idempotent AND self-heals
    // any pre-existing duplicate ids already persisted from the previous buggy version.
    const mergedExtrasRef = useRef(false);
    useEffect(() => {
        if (isAppLoading || mergedExtrasRef.current) return;
        mergedExtrasRef.current = true;
        setExercises((prev: any[]) => {
            const base = Array.isArray(prev) ? prev : [];
            const byId = new Map<string, any>();
            for (const e of base) if (e && !byId.has(e.id)) byId.set(e.id, e);
            const extras = [...CROSSFIT_EXERCISES, ...CALISTHENICS_EXERCISES, ...NILSSON_BW_EXERCISES];
            let changed = base.length !== byId.size; // pre-existing duplicates present
            for (const e of extras) {
                if (!byId.has(e.id)) { byId.set(e.id, e); changed = true; }
            }
            return changed ? Array.from(byId.values()) : base;
        });
    }, [isAppLoading, setExercises]);

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        const data = {
            program, exercises, logs, activeMeso, activeSession,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
            version: '4.0.3'
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gainslab_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                program, activeMeso, activeSession, exercises, logs,
                config, rpFeedback,
                userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
                lastUpdated: Date.now(),
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
                // Basic shape guard: must have at least one recognisable array field
                if (!data || typeof data !== 'object' ||
                    (!Array.isArray(data.program) && !Array.isArray(data.exercises) && !Array.isArray(data.logs))) {
                    console.error("Import rejected: unrecognised backup format");
                    return;
                }
                setImportData(data);
            } catch (err) {
                console.error("Import rejected: invalid JSON");
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
                <Suspense fallback={<LoadingSpinner />}>
                    {showLanding ? (
                        <Landing
                            onStart={() => setShowLanding(false)}
                            onLogin={() => setShowAuthModal(true)}
                        />
                    ) : (
                        <SetupWizard onComplete={() => setHasSeenOnboarding(true)} />
                    )}
                </Suspense>
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
                        <Suspense fallback={<LoadingSpinner />}>
                            <SessionSummaryView
                                log={completedWorkoutLog}
                                onClose={() => {
                                    setCompletedWorkoutLog(null);
                                    setView('home');
                                }}
                            />
                        </Suspense>
                    ) : view === 'exercises' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <ExercisesView onBack={() => { setView('home'); setShowSettings(true); }} />
                        </Suspense>
                    ) : view === 'program' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <ProgramEditView onBack={() => setView('home')} />
                        </Suspense>
                    ) : (
                        <Layout view={view as any} setView={setView as any} onOpenSettings={() => setShowSettings(true)} onOpenCommandPalette={() => setShowCommandPalette(true)}>
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
                            {view === 'nutrition' && (
                                <Suspense fallback={<LoadingSpinner />}>
                                    <NutriView />
                                </Suspense>
                            )}
                        </Layout>
                    )}
                </>
            )}

            {syncTruncatedWarning && (
                <div className="fixed top-safe left-0 right-0 z-[200] flex justify-center px-4 pt-3 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-3 bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-sm w-full">
                        <Icon name="AlertTriangle" size={16} className="text-amber-400 shrink-0" />
                        <span className="flex-1">
                            {lang === 'es'
                                ? `Historial en nube limitado a ${syncTruncatedWarning.kept} sesiones (de ${syncTruncatedWarning.total}). El historial local está completo.`
                                : `Cloud history capped at ${syncTruncatedWarning.kept} of ${syncTruncatedWarning.total} sessions. Local history is complete.`}
                        </span>
                        <button onClick={() => setSyncTruncatedWarning(null)} className="text-amber-400 hover:text-white transition-colors">
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                </div>
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

            {/* Two Block Mass Mesocycle (Nick Nilsson 2018) */}
            <TwoBlockMassModal
                isOpen={showTwoBlockModal}
                onClose={() => setShowTwoBlockModal(false)}
                onStart={(session) => {
                    setActiveSession(session);
                    setShowTwoBlockModal(false);
                    setView('workout');
                }}
            />

            {/* Command Palette — primary "start a workout" entry point */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                actions={commandActions}
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
                    onOpenTwoBlock={() => { setShowTwoBlockModal(true); setShowSettings(false); }}
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
