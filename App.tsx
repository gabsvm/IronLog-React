
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import { usePro } from './hooks/usePro';
import { useAppHistory, withTransition, VIEW_DEPTH } from './hooks/useAppHistory';
import { useShortcutLaunch } from './hooks/useShortcutLaunch';
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

// Q20: the rest pill only renders during an active rest; the timer engine itself
// runs in TimerProvider, so deferring the overlay keeps it out of the entry chunk.
// S3: only loaded when the PWA was launched with a shared/opened CSV.
const SharedCsvImport = React.lazy(() => import('./components/app/SharedCsvImport').then((module) => ({ default: module.SharedCsvImport })));
const RestTimerOverlay = React.lazy(() => import('./components/ui/RestTimerOverlay').then((module) => ({ default: module.RestTimerOverlay })));

export const VIEW_LOADERS: Partial<Record<string, () => Promise<any>>> = {
    workout: () => import('./views/WorkoutView'),
    history: () => import('./views/HistoryView'),
    stats: () => import('./views/StatsView'),
    nutrition: () => import('./views/NutriView'),
    exercises: () => import('./views/ExercisesView'),
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

// Q18: transition helpers live in hooks/useAppHistory; re-exported so existing
// importers (tests) keep working without changes.
export { withTransition, VIEW_DEPTH };

const AppContent = () => {
    const {
        program, exercises, lang, logs, setLogs,
        setExercises,
        config, rpFeedback, hasSeenOnboarding,
        isAppLoading,
        userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
        personalTemplates, customFoods
    } = useApp();
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);

    const { user } = useAuth();
    const { checkPro } = usePro();

    const [view, setViewState] = useState<'home' | 'workout' | 'history' | 'exercises' | 'program' | 'stats' | 'summary' | 'nutrition'>('home');
    const [completedWorkoutLog, setCompletedWorkoutLog] = useState<any>(null);
    // S3: launched from the share sheet / "Open with" with a CSV (read once at mount).
    const [sharedCsvLaunch] = useState(
        () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('action') === 'import-csv'
    );
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



    const targetViewRef = useRef(view);
    // Never mirror `view` here: this ref records the latest navigation INTENT so
    // stale async preloads can be discarded. Overwriting it on every render
    // cancels in-flight transitions whenever anything else re-renders.

    // `after` runs atomically with the view flip (same flushSync) so callers can
    // clear the session without exposing the intermediate view-without-session state.
    const setView = useCallback((newView: typeof view, after?: () => void) => {
        if (newView === view) {
            after?.();
            return;
        }
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

    // Q18: history management lives in hooks/useAppHistory.
    useAppHistory(view, setViewState, targetViewRef);

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

    // Q18: shortcut/widget launch flow lives in hooks/useShortcutLaunch.
    useShortcutLaunch({
        isAppLoading, activeSession, activeMeso, logs, program, exercises,
        lang, rpFeedback, config, setActiveSession, setView,
    });

    // --- DATA MANAGEMENT ---
    const handleExport = () => {
        void exportCurrentBackup({
            program, exercises, logs, activeMeso, activeSession,
            userProfile, nutritionLogs, cardioSessions, bodyLogs, macroGoals, nutritionGoal,
            personalTemplates, customFoods, rpFeedback, config
        });
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

    const handleUndoSkip = () => {
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
                    onSkipSession={handleSkipSession}
                />
            )}


            <AppBanners activeSession={activeSession} />


            <React.Suspense fallback={null}>
                <RestTimerOverlay />
            </React.Suspense>

            {sharedCsvLaunch && (
                <React.Suspense fallback={null}>
                    <SharedCsvImport ready={!isAppLoading} onImported={() => setView('history')} />
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
