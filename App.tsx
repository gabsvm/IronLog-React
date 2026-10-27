
import { formatMessage } from './utils/i18n';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useAppHistory, withTransition, VIEW_DEPTH } from './hooks/useAppHistory';
import { resolveAppView, type AppView } from './components/layout/navigation';
import { useShortcutLaunch } from './hooks/useShortcutLaunch';
import { useNativeSharedCsv } from './hooks/useNativeSharedCsv';
import { Capacitor } from '@capacitor/core';
import { AppModals } from './components/app/AppModals';
import { AppViews } from './components/app/AppViews';
import { AppOnboarding } from './components/app/AppOnboarding';
import { AppBanners } from './components/app/AppBanners';
import type { CommandAction } from './components/ui/CommandPalette';
import { exportCurrentBackup } from './services/autoBackup';
import {
    validateAndMigrateBackup,
    type GainsLabBackupV1,
    type BackupDomainSummary
} from './services/backupService';
import { useStore } from './lib/store';
import { TRANSLATIONS } from './constants/translations';
import { scheduleWhenIdle } from './lib/idle';
import { KONG_4DAY_ID } from './programs/kong/constants';
// Q20: the rest pill only renders during an active rest; the timer engine itself
// runs in TimerProvider, so deferring the overlay keeps it out of the entry chunk.
// S3: only loaded when the PWA was launched with a shared/opened CSV.
const SharedCsvImport = React.lazy(() => import('./components/app/SharedCsvImport').then((module) => ({ default: module.SharedCsvImport })));
const RestTimerOverlay = React.lazy(() => import('./components/ui/RestTimerOverlay').then((module) => ({ default: module.RestTimerOverlay })));

const VIEW_LOADERS: Partial<Record<AppView, () => Promise<unknown>>> = {
    workout: () => import('./views/WorkoutView'),
    routine: () => import('./views/RoutineView'),
    progress: () => import('./views/StatsView'),
    diary: () => import('./views/DiaryView'),
    exercises: () => import('./views/ExercisesView'),
    measure: () => import('./views/MeasureView'),
    program: () => import('./views/ProgramEditView'),
    summary: () => import('./views/SessionSummaryView'),
};

export interface SkippedWeekSnapshot {
    mesoId: number;
    week: number;
    isDeload: boolean;
}

/** True when the meso advanced exactly one week since the snapshot: the skip caused it. */
export const shouldRestoreWeekAfterUndoSkip = (
    snapshot: SkippedWeekSnapshot | null | undefined,
    currentMeso: { id: number; week: number } | null | undefined,
): boolean => {
    if (!snapshot || !currentMeso) return false;
    return currentMeso.id === snapshot.mesoId && currentMeso.week === snapshot.week + 1;
};


const AppContent = () => {
    const {
        program, exercises, lang, logs, setLogs,
        setExercises,
        config, rpFeedback, hasSeenOnboarding,
        isAppLoading,
        userProfile, nutritionLogs, cardioSessions, bodyLogs, measurementLogs, macroGoals, nutritionGoal,
        personalTemplates, customFoods, templateFolders
    } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);

    const { user } = useAuth();

    const [view, setViewState] = useState<AppView>('home');
    const [completedWorkoutLog, setCompletedWorkoutLog] = useState<any>(null);
    // S3: launched from the share sheet / "Open with" with a CSV (read once at mount).
    const [sharedCsvLaunch] = useState(
        () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('action') === 'import-csv'
    );
    // T3: CSVs shared to the native app (Android Share / Open with).
    const nativeSharedCsv = useNativeSharedCsv(Capacitor.isNativePlatform());
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showMesoCompleteModal, setShowMesoCompleteModal] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Custom Modals State
    const [validatedBackup, setValidatedBackup] = useState<GainsLabBackupV1 | null>(null);
    const [backupSummary, setBackupSummary] = useState<BackupDomainSummary | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [showForceSyncModal, setShowForceSyncModal] = useState(false);
    const [forceSyncFeedback, setForceSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [skippedSessionToast, setSkippedSessionToast] = useState<{ id: number; name: string; weekSnapshot: SkippedWeekSnapshot } | null>(null);
    const [showKongConvertModal, setShowKongConvertModal] = useState(false);
    const [showActiveSessionAlert, setShowActiveSessionAlert] = useState(false);


    const targetViewRef = useRef(view);
    // Never mirror `view` here: this ref records the latest navigation INTENT so
    // stale async preloads can be discarded. Overwriting it on every render
    // cancels in-flight transitions whenever anything else re-renders.

    // `after` runs atomically with the view flip (same flushSync) so callers can
    // clear the session without exposing the intermediate view-without-session state.
    const setView = useCallback((newView: typeof view, after?: () => void) => {
        // Legacy names resolve once at the boundary; renderers only see AppView.
        const resolved = (resolveAppView(newView) ?? 'home') as typeof view;
        if (resolved === view) {
            after?.();
            return;
        }
        targetViewRef.current = resolved;
        const currentDepth = VIEW_DEPTH[view] || 1;
        const nextDepth = VIEW_DEPTH[resolved] || 1;
        const direction = nextDepth > currentDepth ? 'forward' : nextDepth < currentDepth ? 'back' : 'fade';

        const preload = VIEW_LOADERS[resolved];
        const executeTransition = () => {
            if (targetViewRef.current !== resolved) return;
            withTransition(direction, () => {
                flushSync(() => {
                    setViewState(resolved);
                    after?.();
                });
            });
        };

        if (preload) {
            preload().then(executeTransition, executeTransition);
        } else {
            executeTransition();
        }
    }, [view]);

    // Narrowed to scalars: set commits create a new session object identity
    // every 180ms, but id/name/week are stable so the memoized actions (and
    // the memoized AppModals subtree) survive workout keystrokes.
    const activeSessionId = activeSession?.id ?? null;
    const activeSessionName = activeSession?.name ?? '';
    const activeMesoId = activeMeso?.id ?? null;
    const activeMesoWeek = activeMeso?.week ?? null;
    // The palette shows the plan's own name; mesoType is an internal id (e.g. hyp_1).
    const activeMesoName = activeMeso?.name ?? '';
    const commandActions = useMemo<CommandAction[]>(() => {
        const actions: CommandAction[] = [];
        if (activeSessionId) {
            actions.push({
                id: 'resume',
                label: { en: 'Resume active session', es: 'Reanudar sesión activa' },
                description: { en: activeSessionName, es: activeSessionName },
                icon: 'Play',
                accent: 'emerald',
                badge: TRANSLATIONS[lang].copy.app.live,
                onSelect: () => setView('workout'),
                keywords: ['continue', 'resume', 'continuar', 'activa'],
            });
        }
        if (activeMesoId) {
            actions.push({
                id: 'meso_today',
                label: { en: 'Continue mesocycle (today)', es: 'Continuar mesociclo (hoy)' },
                description: { en: `${activeMesoName} · Week ${activeMesoWeek}`, es: `${activeMesoName} · Semana ${activeMesoWeek}` },
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
            onSelect: () => {
                if (useStore.getState().activeSession) {
                    setShowActiveSessionAlert(true);
                    return;
                }
                const currentMeso = useStore.getState().activeMeso;
                const isKong = currentMeso?.programSystem?.systemId === KONG_4DAY_ID || currentMeso?.programSystem?.systemId === 'kong_4day';
                if (isKong && currentMeso) {
                    setShowKongConvertModal(true);
                    return;
                }
                setView('program');
            },
            keywords: ['routine', 'rutina', 'template', 'plantilla'],
        });
        return actions;
    }, [activeSessionId, activeSessionName, activeMesoId, activeMesoWeek, activeMesoName, lang, setView]);

    // Q18: history management lives in hooks/useAppHistory.
    useAppHistory(view, setViewState, targetViewRef);

    // Merge CrossFit + Calisthenics exercises into the library — runs ONCE, but only
    // AFTER IndexedDB hydration finishes (isAppLoading === false). Running it earlier was
    // the bug: the seed DEFAULT_LIBRARY is replaced by the hydrated value a tick later, so
    // a merge against the seed (a) missed real duplicates and (b) got overwritten by the
    // stored value. We rebuild the list keyed by id, which is idempotent AND self-heals
    // any pre-existing duplicate ids already persisted from the previous buggy version.
    // Warm the root tabs and the workout chunk once the app is idle, so the first
    // tap on a tab doesn't pay for parsing its module (measured on Android WebView).
    useEffect(() => {
        if (isAppLoading) return;
        // Generous timeout: this must never compete with first render or input.
        return scheduleWhenIdle(() => {
            for (const view of ['routine', 'progress', 'diary', 'workout'] as const) void VIEW_LOADERS[view]?.();
        }, 4000);
    }, [isAppLoading]);

    const mergedExtrasRef = useRef(false);
    useEffect(() => {
        if (isAppLoading || mergedExtrasRef.current) return;
        mergedExtrasRef.current = true;
        let cancelled = false;

        const cancelIdle = scheduleWhenIdle(() => {
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
        }, 1500);

        return () => {
            cancelled = true;
            cancelIdle();
        };
    }, [isAppLoading, setExercises]);

    // Q18: shortcut/widget launch flow lives in hooks/useShortcutLaunch.
    useShortcutLaunch({
        isAppLoading, activeSession, activeMeso, logs, program, exercises,
        lang, rpFeedback, config, setActiveSession, setView,
    });

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        void exportCurrentBackup({
            program, exercises, logs, activeMeso, activeSession,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, measurementLogs, macroGoals, nutritionGoal,
            personalTemplates, customFoods, templateFolders, rpFeedback, config
        });
    };

    const handleForceSync = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }


        setShowForceSyncModal(true);
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
                    const msg = formatMessage(TRANSLATIONS[lang].copy.app.importRejected, {
                        details: details || TRANSLATIONS[lang].copy.app.invalidBackupFormat,
                    });
                    setImportError(msg);
                    return;
                }
                setValidatedBackup(result.backup);
                setBackupSummary(result.summary);
            } catch (_) {
                const msg = TRANSLATIONS[lang].copy.app.invalidJsonFile;
                setImportError(msg);
            }
        };
        reader.readAsText(file);
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
        setSkippedSessionToast({
            id: logId,
            name: sessionName,
            weekSnapshot: { mesoId: activeMeso.id, week: activeMeso.week, isDeload: !!activeMeso.isDeload },
        });
    };

    const handleUndoSkip = useCallback(() => {
        if (!skippedSessionToast) return;
        setLogs(prev => Array.isArray(prev) ? prev.filter(l => l.id !== skippedSessionToast.id) : []);
        // If skipping the last pending day auto-advanced the week (KONG wrapper
        // effect), undoing the skip restores the snapshotted week.
        const snapshot = skippedSessionToast.weekSnapshot;
        const currentMeso = useStore.getState().activeMeso;
        if (shouldRestoreWeekAfterUndoSkip(snapshot, currentMeso)) {
            setActiveMeso(prev => (prev && prev.id === snapshot.mesoId ? { ...prev, week: snapshot.week, isDeload: snapshot.isDeload } : prev));
        }
        setSkippedSessionToast(null);
    }, [skippedSessionToast, setLogs, setActiveMeso]);

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
            <AppOnboarding
                targetViewRef={targetViewRef}
                setViewState={setViewState}
                setShowAuthModal={setShowAuthModal}
            />


            {/* Main App Content - Only visible if onboarding is done */}
            {hasSeenOnboarding && (
                <AppViews
                    view={view}
                    setView={setView}
                    activeSession={activeSession}
                    setActiveSession={setActiveSession}
                    completedWorkoutLog={completedWorkoutLog}
                    setCompletedWorkoutLog={setCompletedWorkoutLog}
                    onExport={handleExport}
                    onForceSync={handleForceSync}
                    onImportFile={handleImportFile}
                    isSyncing={isSyncing}
                    setShowAuthModal={setShowAuthModal}
                    setShowCommandPalette={setShowCommandPalette}
                    setShowResetModal={setShowResetModal}
                    setShowMesoCompleteModal={setShowMesoCompleteModal}
                    setShowKongConvertModal={setShowKongConvertModal}
                    showActiveSessionAlert={showActiveSessionAlert}
                    setShowActiveSessionAlert={setShowActiveSessionAlert}
                    onSkipSession={handleSkipSession}
                />
            )}


            <AppBanners
                hasActiveSession={activeSession != null}
                skippedSessionToast={skippedSessionToast}
                onUndoSkip={handleUndoSkip}
            />


            <React.Suspense fallback={null}>
                <RestTimerOverlay />
            </React.Suspense>

            {(sharedCsvLaunch || nativeSharedCsv) && (
                <React.Suspense fallback={null}>
                    <SharedCsvImport
                        key={nativeSharedCsv?.seq ?? 0}
                        ready={!isAppLoading}
                        onImported={() => setView('diary')}
                        nativeLaunch={nativeSharedCsv?.launch}
                    />
                </React.Suspense>
            )}

            {/* Q18: all modal dialogs live in components/app/AppModals. */}
            <AppModals
                showCommandPalette={showCommandPalette}
                setShowCommandPalette={setShowCommandPalette}
                commandActions={commandActions}
                showMesoCompleteModal={showMesoCompleteModal}
                setShowMesoCompleteModal={setShowMesoCompleteModal}
                showAuthModal={showAuthModal}
                setShowAuthModal={setShowAuthModal}
                validatedBackup={validatedBackup}
                setValidatedBackup={setValidatedBackup}
                backupSummary={backupSummary}
                setBackupSummary={setBackupSummary}
                importError={importError}
                setImportError={setImportError}
                showForceSyncModal={showForceSyncModal}
                setShowForceSyncModal={setShowForceSyncModal}
                forceSyncFeedback={forceSyncFeedback}
                setForceSyncFeedback={setForceSyncFeedback}
                showResetModal={showResetModal}
                setShowResetModal={setShowResetModal}
                showKongConvertModal={showKongConvertModal}
                setShowKongConvertModal={setShowKongConvertModal}
                showActiveSessionAlert={showActiveSessionAlert}
                setShowActiveSessionAlert={setShowActiveSessionAlert}
                setIsSyncing={setIsSyncing}
                setView={setView}
            />


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
