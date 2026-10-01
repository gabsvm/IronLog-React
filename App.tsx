
import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useTimerActions } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { HomeView } from './views/HomeView';
import { RestTimerOverlay } from './components/ui/RestTimerOverlay';
import { Icon } from './components/ui/Icon';
import { TRANSLATIONS } from './constants';
import { Button } from './components/ui/Button';
import { LazyViewBoundary } from './components/ui/LazyViewBoundary';
import { useAuth, AuthProvider } from './context/AuthContext';
import { getLastLogForExercise, uid } from './utils';
import { syncService } from './services/syncService';
import { usePro } from './hooks/usePro';
import type { CommandAction } from './components/ui/CommandPalette';
import { SessionBuilder } from './services/SessionBuilder';
import { KONG_4DAY_V1 } from './programs/kong/kong4Day';
import { resolveProgramDay } from './programs/engine/ProgramResolver';
import { resetLocalData } from './services/localDataReset';
import { convertKongToPersonalRoutine } from './programs/engine/ProgramConversion';
import { completeWorkoutPipeline } from './services/workoutCompletionService';
import {
    createBackupEnvelope,
    validateAndMigrateBackup,
    restoreBackupToStorage,
    getBackupDownloadFilename,
    type GainsLabBackupV1,
    type BackupDomainSummary
} from './services/backupService';
const ProgramCompletionView = React.lazy(() => import('./components/programs/ProgramCompletionView').then((module) => ({ default: module.ProgramCompletionView })));
import { useStore } from './lib/store';

// Lazy Load views — keeps initial bundle small
const HistoryView = React.lazy(() => import('./views/HistoryView').then(module => ({ default: module.HistoryView })));
const StatsView = React.lazy(() => import('./views/StatsView').then(module => ({ default: module.StatsView })));
const NutriView = React.lazy(() => import('./views/NutriView').then(m => ({ default: m.NutriView })));
const ExercisesView = React.lazy(() => import('./views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const ProgramEditView = React.lazy(() => import('./views/ProgramEditView').then(m => ({ default: m.ProgramEditView })));
const SessionSummaryView = React.lazy(() => import('./views/SessionSummaryView').then(m => ({ default: m.SessionSummaryView })));
const WorkoutView = React.lazy(() => import('./views/WorkoutView').then(m => ({ default: m.WorkoutView })));
const SettingsModal = React.lazy(() => import('./components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })));
const SetupWizard = React.lazy(() => import('./components/onboarding/SetupWizard').then(m => ({ default: m.SetupWizard })));
const Landing = React.lazy(() => import('./components/onboarding/Landing').then(m => ({ default: m.Landing })));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const CommandPalette = React.lazy(() => import('./components/ui/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ConfirmModal = React.lazy(() => import('./components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const PaywallModal = React.lazy(() => import('./components/pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

export const VIEW_LOADERS: Partial<Record<string, () => Promise<any>>> = {
    workout: () => import('./views/WorkoutView'),
    history: () => import('./views/HistoryView'),
    stats: () => import('./views/StatsView'),
    nutrition: () => import('./views/NutriView'),
    exercises: () => import('./views/ExercisesView'),
    program: () => import('./views/ProgramEditView'),
    summary: () => import('./views/SessionSummaryView'),
};

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

const FullScreenLoading = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Icon name="RefreshCw" size={24} className="animate-spin" />
    </div>
);

// Wraps a DOM mutation in a View Transition (graceful fallback when unsupported).
export const withTransition = (direction: string, callback: () => void) => {
    document.documentElement.dataset.transition = direction;
    const reducedEffects = document.documentElement.dataset.effects === 'reduced';
    if (!reducedEffects && typeof (document as any).startViewTransition === 'function') {
        try {
            const transition = (document as any).startViewTransition(callback);
            if (transition?.finished && typeof transition.finished.finally === 'function') {
                transition.finished.finally(() => { document.documentElement.dataset.transition = ''; });
            } else {
                document.documentElement.dataset.transition = '';
            }
            return transition;
        } catch {
            callback();
            document.documentElement.dataset.transition = '';
        }
    } else {
        callback();
        document.documentElement.dataset.transition = '';
    }
};

// View Hierarchy for Directional Animations
export const VIEW_DEPTH: Record<string, number> = {
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
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync,
        userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
        personalTemplates, customFoods
    } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);

    const { setRestTimer } = useTimerActions();
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
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [dismissedUpdate, setDismissedUpdate] = useState(false);

    // Custom Modals State
    const [validatedBackup, setValidatedBackup] = useState<GainsLabBackupV1 | null>(null);
    const [backupSummary, setBackupSummary] = useState<BackupDomainSummary | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [showForceSyncModal, setShowForceSyncModal] = useState(false);
    const [forceSyncFeedback, setForceSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [skippedSessionToast, setSkippedSessionToast] = useState<{ id: number; name: string } | null>(null);
    const [showKongConvertModal, setShowKongConvertModal] = useState(false);

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

    useEffect(() => {
        const handleUpdateAvailable = (event: Event) => {
            const detail = (event as CustomEvent<{ registration?: ServiceWorkerRegistration; isPreloadError?: boolean }>).detail;
            setDismissedUpdate(false);
            if (detail?.registration) {
                setUpdateRegistration(detail.registration);
            } else if (detail?.isPreloadError) {
                setUpdateRegistration(prev => prev || ({} as any));
            }
        };

        window.addEventListener('ironlog:update-available', handleUpdateAvailable);
        return () => window.removeEventListener('ironlog:update-available', handleUpdateAvailable);
    }, []);

    const targetViewRef = useRef(view);
    // Never mirror `view` here: this ref records the latest navigation INTENT so
    // stale async preloads can be discarded. Overwriting it on every render
    // cancels in-flight transitions whenever anything else re-renders.

    const setView = useCallback((newView: typeof view) => {
        if (newView === view) return;
        targetViewRef.current = newView;
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[newView] || 1;
        const direction = nextDepth > currentDepth ? 'forward' : nextDepth < currentDepth ? 'back' : 'fade';

        const preload = VIEW_LOADERS[newView];
        const executeTransition = () => {
            if (targetViewRef.current !== newView) return;
            withTransition(direction, () => {
                flushSync(() => {
                    setViewState(newView);
                });
            });
        };

        if (preload) {
            preload().then(executeTransition, executeTransition);
        } else {
            executeTransition();
        }
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

    // History management logic: nav tabs use replaceState to keep a clean history stack;
    // depth 2 views (workout, program, exercises) and sheets (settings, profile) use pushState.
    const isFirstMountRef = useRef(true);
    const isPopping = useRef(false);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
            }
        } catch (e) { }

        const handlePop = (e: PopStateEvent) => {
            isPopping.current = true;
            const state = e.state;
            if (state) {
                withTransition('back', () => {
                    if (state.view) { targetViewRef.current = state.view; setViewState(state.view); }
                    setShowSettings(Boolean(state.settings));
                });
            } else {
                setView('home');
                setShowSettings(false);
            }
            window.dispatchEvent(new CustomEvent('ironlog:popstate', { detail: state }));
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [setView]);

    useEffect(() => {
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return;
        }

        if (isPopping.current) {
            isPopping.current = false;
            return;
        }

        const state = { view, settings: showSettings };
        const hash = showSettings ? 'settings' : view;
        const isNav = (view === 'home' || view === 'history' || view === 'stats' || view === 'nutrition') && !showSettings;

        try {
            if (typeof window !== 'undefined' && window.history) {
                if (isNav) {
                    window.history.replaceState(state, '', `#${hash}`);
                } else {
                    window.history.pushState(state, '', `#${hash}`);
                }
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
        let cancelled = false;

        void import('./data/disciplineExercises').then(({ CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES, NILSSON_BW_EXERCISES }) => {
            if (cancelled) return;
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
        });

        return () => {
            cancelled = true;
        };
    }, [isAppLoading, setExercises]);

    // Handle PWA shortcut actions (e.g. /?action=start&source=shortcut)
    useEffect(() => {
        if (isAppLoading) return;
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action === 'start') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // 1. Resume active workout if one exists
            if (activeSession) {
                setView('workout');
                return;
            }

            // 2. Start scheduled session from active meso if available
            if (activeMeso) {
                const logsForWeek = (Array.isArray(logs) ? logs : []).filter(
                    l => l.mesoId === activeMeso.id && l.week === activeMeso.week
                );
                const completedDays = new Set(logsForWeek.map(l => l.dayIdx));
                const totalDays = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id
                    ? 4
                    : (Array.isArray(program) ? program.length : 0);

                let targetIdx = 0;
                for (let i = 0; i < totalDays; i++) {
                    if (!completedDays.has(i)) {
                        targetIdx = i;
                        break;
                    }
                }

                const safeProgram = Array.isArray(program) ? program : [];
                const dayDef = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id
                    ? resolveProgramDay(KONG_4DAY_V1, activeMeso.week, targetIdx, activeMeso.programSystem.substitutions)
                    : safeProgram[targetIdx];

                if (dayDef) {
                    const newSession = SessionBuilder.buildFromProgramDay(
                        targetIdx,
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
                        return;
                    }
                }
            }

            // 3. Fallback: Quick Start session
            const quickSession = {
                id: Date.now(),
                name: lang === 'es' ? 'Sesión Rápida' : 'Quick Start Session',
                dayIdx: -1,
                mesoId: -1,
                week: -1,
                exercises: [],
                startTime: Date.now(),
                isDeload: false,
            };
            setActiveSession(quickSession);
            setView('workout');
        }
    }, [isAppLoading, activeSession, activeMeso, logs, program, exercises, lang, rpFeedback, config, setActiveSession, setView]);

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        const envelope = createBackupEnvelope({
            program, exercises, logs, activeMeso, activeSession,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
            personalTemplates, customFoods, rpFeedback, config
        });
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getBackupDownloadFilename();
        a.click();
        URL.revokeObjectURL(url);
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
                email: user.email || null,
                lastUpdated: Date.now(),
            });
            setForceSyncFeedback({
                type: 'success',
                message: t.forceSyncSuccess || (lang === 'en' ? 'Data synced to cloud successfully.' : 'Datos sincronizados con la nube correctamente.')
            });
        } catch (e: any) {
            console.error(e);
            setForceSyncFeedback({
                type: 'error',
                message: (t.forceSyncError || (lang === 'en' ? 'Failed to sync to cloud.' : 'Error al sincronizar con la nube.')) + (e?.message ? ` (${e.message})` : '')
            });
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
                const parsed = JSON.parse(ev.target?.result as string);
                const result = validateAndMigrateBackup(parsed);
                if (result.valid === false) {
                    const details = result.errorDetails || '';
                    const msg = lang === 'en'
                        ? `Import rejected: ${details || 'Invalid backup format'}`
                        : `Importación rechazada: ${details || 'Formato de copia de seguridad no válido'}`;
                    setImportError(msg);
                    return;
                }
                setValidatedBackup(result.backup);
                setBackupSummary(result.summary);
            } catch (_) {
                const msg = lang === 'en' ? 'Invalid JSON file' : 'Archivo JSON inválido';
                setImportError(msg);
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = async () => {
        if (!validatedBackup) return;
        try {
            await restoreBackupToStorage(validatedBackup);
            setValidatedBackup(null);
            setBackupSummary(null);
            window.location.reload();
        } catch (err) {
            console.error('Failed to restore backup:', err);
            setImportError(lang === 'en' ? 'Failed to restore backup data' : 'Error al restaurar copia de seguridad');
        }
    };

    const handleSkipSession = (dayIdx: number) => {
        if (!activeMeso) return;
        const safeProgram = Array.isArray(program) ? program : [];
        const dayDef = safeProgram[dayIdx];

        const logId = Date.now();
        const sessionName = dayDef ? (typeof dayDef.dayName === 'object' ? dayDef.dayName[lang] : dayDef.dayName) : `Day ${dayIdx + 1}`;

        // Create a log entry marked as skipped
        const skippedLog: any = {
            id: logId,
            dayIdx: dayIdx,
            name: sessionName,
            startTime: logId,
            endTime: logId,
            duration: 0,
            bodyWeightSnapshot: userProfile?.bodyWeight,
            mesoId: activeMeso.id,
            week: activeMeso.week,
            exercises: [],
            skipped: true
        };

        setLogs([skippedLog, ...(Array.isArray(logs) ? logs : [])]);
        setSkippedSessionToast({ id: logId, name: sessionName });
    };

    const handleUndoSkip = () => {
        if (!skippedSessionToast) return;
        setLogs(prev => Array.isArray(prev) ? prev.filter(l => l.id !== skippedSessionToast.id) : []);
        setSkippedSessionToast(null);
    };

    useEffect(() => {
        if (!skippedSessionToast) return;
        const timer = setTimeout(() => {
            setSkippedSessionToast(null);
        }, 6000);
        return () => clearTimeout(timer);
    }, [skippedSessionToast]);

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
                        <SetupWizard
                            onComplete={(outcome) => {
                                setHasSeenOnboarding(true);
                                if (outcome.mode === 'custom') {
                                    targetViewRef.current = 'program'; setViewState('program');
                                } else if (outcome.mode === 'freestyle') {
                                    const freeSession = {
                                        id: Date.now(),
                                        dayIdx: -1,
                                        name: lang === 'es' ? 'Sesión Libre' : 'Freestyle Session',
                                        startTime: Date.now(),
                                        mesoId: -1,
                                        week: -1,
                                        exercises: [],
                                    };
                                    setActiveSession(freeSession);
                                    targetViewRef.current = 'workout'; setViewState('workout');
                                } else {
                                    targetViewRef.current = 'home'; setViewState('home');
                                }
                            }}
                        />
                    )}
                </Suspense>
            )}

            {/* Main App Content - Only visible if onboarding is done */}
            {hasSeenOnboarding && (
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

                                    if (result.isMesoComplete) {
                                        setShowMesoCompleteModal(true);
                                    } else if (!result.isDetached && result.updatedMeso && result.updatedMeso !== activeMeso) {
                                        setActiveMeso(result.updatedMeso);
                                    }

                                    setActiveSession(null);
                                    setRestTimer({ active: false, timeLeft: 0, duration: 0, endAt: 0 });
                                    setCompletedWorkoutLog(result.log);
                                    setView('summary');
                                }}
                                onDiscard={() => {
                                    setActiveSession(null);
                                    setView('home');
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
                            <LazyViewBoundary lang={lang} resetKey="exercises"><ExercisesView onBack={() => { setView('home'); setShowSettings(true); }} /></LazyViewBoundary>
                        </Suspense>
                    ) : view === 'program' ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <LazyViewBoundary lang={lang} resetKey="program"><ProgramEditView onBack={() => setView('home')} /></LazyViewBoundary>
                        </Suspense>
                    ) : (
                        <Layout view={view as any} setView={setView as any} onOpenSettings={() => setShowSettings(true)} onOpenCommandPalette={() => setShowCommandPalette(true)}>
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
                                onSkipSession={handleSkipSession}
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
            )}

            {syncTruncatedWarning && (
                <div className="fixed top-safe left-0 right-0 z-[200] flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-sm w-full">
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

            {updateRegistration && !dismissedUpdate && (
                <div className="fixed top-safe left-0 right-0 z-[210] flex justify-center px-4 pt-3 pointer-events-none">
                    <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 bg-zinc-950/95 border border-primary-500/30 text-zinc-100 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md max-w-md w-full">
                        <Icon name="Download" size={16} className="text-primary-400 shrink-0" />
                        <span className="flex-1">
                            {t.updateBannerReady}
                        </span>
                        <button
                            onClick={() => {
                                if (activeSession) {
                                    if (!window.confirm(t.updateConfirmActiveWorkout)) return;
                                }
                                (window as any).__USER_TRIGGERED_SW_UPDATE__ = true;
                                const target = updateRegistration.waiting || updateRegistration.installing;
                                if (target) {
                                    target.postMessage({ type: 'SKIP_WAITING' });
                                } else {
                                    window.location.reload();
                                }
                            }}
                            className="rounded-xl bg-primary-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-primary-400"
                        >
                            {t.updateBannerAction}
                        </button>
                        <button
                            onClick={() => setDismissedUpdate(true)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            aria-label={t.updateBannerDismiss}
                        >
                            <Icon name="X" size={16} />
                        </button>
                    </div>
                </div>
            )}

            <RestTimerOverlay />

            {/* Command Palette — primary "start a workout" entry point */}
            <Suspense fallback={null}>
                <CommandPalette
                    isOpen={showCommandPalette}
                    onClose={() => setShowCommandPalette(false)}
                    actions={commandActions}
                />
            </Suspense>

            {/* Standard Modal Overlays */}
            {showMesoCompleteModal && (
                activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id ? <Suspense fallback={null}><ProgramCompletionView meso={activeMeso} logs={logs} lang={lang} onFinish={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} onKeep={() => { setActiveMeso(null); setShowMesoCompleteModal(false); }} /></Suspense> :
                <Suspense fallback={null}>
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
                </Suspense>
            )}
            {showAuthModal && (
                <Suspense fallback={null}>
                    <AuthModal onClose={() => setShowAuthModal(false)} />
                </Suspense>
            )}

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            {/* SYNC CONFLICT MODAL */}
            <ConfirmModal
                isOpen={!!pendingCloudData}
                title={lang === 'en' ? "Cloud Sync" : "Sincronización Nube"}
                description={(() => {
                    const friendlySections = pendingCloudSections.map(sec => ((t.syncSections as any)?.[sec]) || sec);
                    const sectionsText = friendlySections.length > 0
                        ? (lang === 'en' ? ` in: ${friendlySections.join(', ')}` : ` en: ${friendlySections.join(', ')}`)
                        : '';
                    return lang === 'en'
                        ? `Newer cloud data found${sectionsText}. Download it? This will overwrite those local sections.`
                        : `Se encontraron datos más nuevos en la nube${sectionsText}. ¿Descargar? Esto sobrescribirá esas secciones locales.`;
                })()}
                confirmText={lang === 'en' ? "Download" : "Descargar"}
                cancelText={lang === 'en' ? "Keep Local" : "Mantener Local"}
                onConfirm={confirmCloudSync}
                onCancel={cancelCloudSync}
                variant="primary"
            />

            {/* IMPORT CONFIRM MODAL */}
            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!validatedBackup}
                    title={t.import}
                    description={backupSummary ? (
                        lang === 'en'
                            ? `Restore ${backupSummary.programsCount} routines, ${backupSummary.exercisesCount} exercises, ${backupSummary.logsCount} logs, and ${backupSummary.nutritionDaysCount} nutrition days? This will overwrite local data.`
                            : `¿Restaurar ${backupSummary.programsCount} rutinas, ${backupSummary.exercisesCount} ejercicios, ${backupSummary.logsCount} entrenamientos y ${backupSummary.nutritionDaysCount} días de nutrición? Esto sobrescribirá los datos locales.`
                    ) : t.importConfirm}
                    confirmText={t.import}
                    cancelText={t.cancel}
                    onConfirm={confirmImport}
                    onCancel={() => { setValidatedBackup(null); setBackupSummary(null); }}
                    variant="danger"
                />
            </Suspense>

            {/* IMPORT ERROR MODAL */}
            {importError && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={lang === 'en' ? 'Import Error' : 'Error de Importación'}
                        description={importError}
                        confirmText={lang === 'en' ? 'OK' : 'Entendido'}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setImportError(null)}
                        onCancel={() => setImportError(null)}
                    />
                </Suspense>
            )}

            {/* FORCE SYNC MODAL */}
            <ConfirmModal
                isOpen={showForceSyncModal}
                title={t.forceSyncTitle}
                description={t.forceSyncConfirm}
                confirmText={t.upload}
                cancelText={t.cancel}
                onConfirm={executeForceSync}
                onCancel={() => setShowForceSyncModal(false)}
            />

            {/* FORCE SYNC FEEDBACK MODAL */}
            {forceSyncFeedback && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={forceSyncFeedback.type === 'success' ? t.syncComplete : t.syncError}
                        description={forceSyncFeedback.message}
                        confirmText={t.understood}
                        cancelText=""
                        variant={forceSyncFeedback.type === 'success' ? 'primary' : 'danger'}
                        onConfirm={() => setForceSyncFeedback(null)}
                        onCancel={() => setForceSyncFeedback(null)}
                    />
                </Suspense>
            )}

            {/* SKIPPED SESSION TOAST WITH UNDO */}
            {skippedSessionToast && (
                <div 
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-toast flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-sm text-white animate-in fade-in slide-in-from-bottom-2"
                >
                    <span>{skippedSessionToast.name}: {t.skipped}</span>
                    <button
                        type="button"
                        onClick={handleUndoSkip}
                        className="px-2.5 py-1 rounded-lg bg-primary-500/20 text-primary-400 font-semibold text-xs hover:bg-primary-500/30 transition-colors"
                    >
                        {t.undo}
                    </button>
                </div>
            )}

            {/* FACTORY RESET MODAL */}
            {showResetModal && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.dangerZone}
                        description={t.deleteDataConfirm}
                        confirmText={t.delete}
                        cancelText={t.cancel}
                        variant="danger"
                        onConfirm={async () => {
                            await resetLocalData();
                            window.location.reload();
                        }}
                        onCancel={() => setShowResetModal(false)}
                    />
                </Suspense>
            )}

            {/* KONG CONVERSION MODAL */}
            {showKongConvertModal && (
                <Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.convertKongTitle}
                        description={lang === 'es'
                            ? 'La definición oficial de KONG no se edita directamente para preservar la metodología original. ¿Deseas convertir tu ciclo actual en una rutina editable?'
                            : 'The official KONG definition cannot be edited directly to preserve the original methodology. Do you want to convert this cycle into an editable personal routine?'}
                        confirmText={t.convertKongConfirm}
                        cancelText={t.cancel}
                        onConfirm={() => {
                            if (!activeMeso) return;
                            const { editableProgram, convertedMeso } = convertKongToPersonalRoutine(activeMeso, lang);
                            setProgram(editableProgram);
                            setActiveMeso(convertedMeso);
                            setShowKongConvertModal(false);
                            setView('program');
                        }}
                        onCancel={() => setShowKongConvertModal(false)}
                    />
                </Suspense>
            )}

            {/* SETTINGS OVERLAY (Now with Login Callback) */}
            {showSettings && view !== 'exercises' && (
                <Suspense fallback={<LoadingSpinner />}>
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
                </Suspense>
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
