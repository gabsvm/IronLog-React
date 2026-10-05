// S6: global data fetch, PWA install, connectivity/sync listeners, effects mode, dirty tracking and installApp, moved verbatim from context/AppContext.tsx.
import { useEffect, useCallback } from 'react';
import { EffectsMode, ResolvedEffects, ExerciseDef, MesoCycle, Log, ProgramDay, GlobalTemplate, UserProfile, BeforeInstallPromptEvent, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, CustomFood, DirtySyncSection, WeightUnit } from '../../types';
import { resolveEffectsMode } from '../../utils/effectsProfile';
import { syncService } from '../../services/syncService';
import { getFirebaseFirestoreServices, isFirebaseConfigured } from '../../lib/firebaseLoader';
import { scheduleWhenIdle } from '../../lib/idle';
import { offlineSyncQueue } from '../../services/offlineSyncQueue';
import type { DependencyList, Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { FeedbackEntry } from '../../types';
import type { User } from 'firebase/auth';

export interface UseAppBootstrapEffectsDeps {
    user: User;
    showRIR: boolean;
    rpEnabled: boolean;
    rpTargetRIR: number;
    keepScreenOn: boolean;
    weightUnit: WeightUnit;
    program: ProgramDay[];
    exercises: ExerciseDef[];
    setExercises: (value: ExerciseDef[] | ((val: ExerciseDef[]) => ExerciseDef[])) => void;
    logs: Log[];
    nutritionLogs: NutritionLog[];
    cardioSessions: CardioSession[];
    nutritionGoal: NutritionGoal;
    userProfile: UserProfile;
    setGlobalTemplates: Dispatch<SetStateAction<GlobalTemplate[]>>;
    personalTemplates: GlobalTemplate[];
    baseTemplates: GlobalTemplate[];
    defaultsLoading: boolean;
    rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
    bodyLogs: BodyLog[];
    macroGoals: MacroGoals;
    customFoods: CustomFood[];
    hasCheckedSync: boolean;
    isOnline: boolean;
    syncStatus: { pending: number; isSyncing: boolean; lastSyncedAt: number; };
    setSyncStatus: Dispatch<SetStateAction<{ pending: number; isSyncing: boolean; lastSyncedAt: number; }>>;
    deferredPrompt: BeforeInstallPromptEvent;
    setDeferredPrompt: Dispatch<SetStateAction<BeforeInstallPromptEvent>>;
    setIsStandalone: Dispatch<SetStateAction<boolean>>;
    effectsMode: EffectsMode;
    setResolvedEffects: Dispatch<SetStateAction<ResolvedEffects>>;
    setReducedEffects: Dispatch<SetStateAction<boolean>>;
    activeMeso: MesoCycle;
    isAppLoading: boolean;
    foregroundFlushRef: MutableRefObject<boolean>;
    trackDirtySection: (section: DirtySyncSection, deps: DependencyList) => void;
}

/** S6: global data fetch, PWA install, connectivity/sync listeners, effects mode, dirty tracking and installApp (moved verbatim from AppProvider; same hook order). */
export const useAppBootstrapEffects = ({
    user,
    showRIR,
    rpEnabled,
    rpTargetRIR,
    keepScreenOn,
    weightUnit,
    program,
    exercises,
    setExercises,
    logs,
    nutritionLogs,
    cardioSessions,
    nutritionGoal,
    userProfile,
    setGlobalTemplates,
    personalTemplates,
    baseTemplates,
    defaultsLoading,
    rpFeedback,
    bodyLogs,
    macroGoals,
    customFoods,
    hasCheckedSync,
    isOnline,
    syncStatus,
    setSyncStatus,
    deferredPrompt,
    setDeferredPrompt,
    setIsStandalone,
    effectsMode,
    setResolvedEffects,
    setReducedEffects,
    activeMeso,
    isAppLoading,
    foregroundFlushRef,
    trackDirtySection,
}: UseAppBootstrapEffectsDeps) => {
    // --- FETCH GLOBAL DATA ---
    useEffect(() => {
        if (!isFirebaseConfigured() || !isOnline || !baseTemplates || defaultsLoading) return;
        let cancelled = false;
        const fetchData = async () => {
            try {
                const { db, firestoreApi } = await getFirebaseFirestoreServices();
                if (!db || cancelled) return;

                const qTpl = firestoreApi.query(firestoreApi.collection(db, "global_templates"), firestoreApi.orderBy("order"));
                const tplSnapshot = await firestoreApi.getDocs(qTpl);
                const fetchedTemplates: GlobalTemplate[] = [];
                tplSnapshot.forEach((doc) => fetchedTemplates.push({ id: doc.id, ...doc.data() } as GlobalTemplate));

                // MERGE STRATEGY: 
                let mergedTemplates = [...baseTemplates];

                fetchedTemplates.forEach(remote => {
                    const idx = mergedTemplates.findIndex(local => local.id === remote.id);
                    if (idx >= 0) {
                        // Remote overrides local (allows updating content via CMS)
                        mergedTemplates[idx] = remote;
                    } else {
                        // Append new remote templates
                        mergedTemplates.push(remote);
                    }
                });

                // Sort again to respect 'order' property
                mergedTemplates.sort((a, b) => a.order - b.order);

                if (!cancelled && mergedTemplates.length > 0) setGlobalTemplates(mergedTemplates);

                const qEx = firestoreApi.collection(db, "global_exercises");
                const exSnapshot = await firestoreApi.getDocs(qEx);
                const fetchedExercises: ExerciseDef[] = [];
                exSnapshot.forEach((doc) => fetchedExercises.push({ id: doc.id, ...doc.data() } as ExerciseDef));

                if (!cancelled && fetchedExercises.length > 0) {
                    setExercises(prev => {
                        const currentIds = new Set(prev.map(e => e.id));
                        const newExs = fetchedExercises.filter(e => !currentIds.has(e.id));
                        return newExs.length > 0 ? [...prev, ...newExs] : prev;
                    });
                }
            } catch (e: any) {
                if (!e.code || e.code !== 'permission-denied') console.error("Global Data Fetch Error", e);
            }
        };

        const cancelIdle = scheduleWhenIdle(fetchData, 1500);
        return () => {
            cancelled = true;
            cancelIdle();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [baseTemplates, defaultsLoading, isOnline, user, setExercises]);

    // --- PWA INSTALL HANDLER ---
    useEffect(() => {
        const isStandaloneQuery = window.matchMedia('(display-mode: standalone)');
        setIsStandalone(isStandaloneQuery.matches);
        isStandaloneQuery.addEventListener('change', (e) => setIsStandalone(e.matches));

        // Ensure we catch it if it happens after mount
        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            window.deferredPrompt = e;
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, []);

    useEffect(() => {
        let mounted = true;

        const refreshQueueCount = async () => {
            const pending = await offlineSyncQueue.count();
            if (!mounted) return;
            setSyncStatus(prev => ({ ...prev, pending }));
        };

        const handleQueueChanged = (event: Event) => {
            const pending = Number((event as CustomEvent).detail?.pending ?? 0);
            setSyncStatus(prev => ({ ...prev, pending }));
        };

        const handleSyncStatus = (event: Event) => {
            const detail = (event as CustomEvent).detail || {};
            const phase = String(detail.phase || '');

            setSyncStatus(prev => ({
                pending: typeof detail.pending === 'number' ? detail.pending : prev.pending,
                isSyncing: phase === 'upload-start' || phase === 'flush-start',
                lastSyncedAt: typeof detail.lastSyncedAt === 'number' ? detail.lastSyncedAt : prev.lastSyncedAt,
            }));
        };

        void refreshQueueCount();
        window.addEventListener('ironlog:sync-queue-changed', handleQueueChanged);
        window.addEventListener('ironlog:sync-status', handleSyncStatus);

        return () => {
            mounted = false;
            window.removeEventListener('ironlog:sync-queue-changed', handleQueueChanged);
            window.removeEventListener('ironlog:sync-status', handleSyncStatus);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, []);

    useEffect(() => {
        if (!user || !isOnline || syncStatus.pending <= 0 || foregroundFlushRef.current) return;

        let cancelled = false;
        let timeoutId: number | null = null;

        const flushInForeground = async () => {
            if (cancelled || foregroundFlushRef.current || document.visibilityState === 'hidden') return;

            foregroundFlushRef.current = true;
            try {
                await syncService.flushQueue();
            } finally {
                foregroundFlushRef.current = false;
            }
        };

        const scheduleForegroundFlush = () => {
            if (cancelled || document.visibilityState === 'hidden') return;
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                void flushInForeground();
            }, 1200);
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                scheduleForegroundFlush();
            }
        };

        scheduleForegroundFlush();
        window.addEventListener('focus', scheduleForegroundFlush);
        window.addEventListener('pageshow', scheduleForegroundFlush);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            window.removeEventListener('focus', scheduleForegroundFlush);
            window.removeEventListener('pageshow', scheduleForegroundFlush);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [user, isOnline, syncStatus.pending]);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateEffectsMode = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window);
            const resolved = resolveEffectsMode({
                effectsMode,
                prefersReducedMotion: media.matches,
                isMobileOrTouch: isMobile,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: (navigator as any).deviceMemory,
                saveData: !!(navigator as any).connection?.saveData,
            });

            setResolvedEffects(resolved);
            setReducedEffects(resolved === 'reduced');
            document.documentElement.dataset.effects = resolved;
        };

        updateEffectsMode();
        media.addEventListener('change', updateEffectsMode);
        window.addEventListener('pageshow', updateEffectsMode);
        return () => {
            media.removeEventListener('change', updateEffectsMode);
            window.removeEventListener('pageshow', updateEffectsMode);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [effectsMode]);

    trackDirtySection('program', [program, isAppLoading, hasCheckedSync]);
    trackDirtySection('activeMeso', [activeMeso, isAppLoading, hasCheckedSync]);
    trackDirtySection('exercises', [exercises, isAppLoading, hasCheckedSync]);
    trackDirtySection('logs', [logs, isAppLoading, hasCheckedSync]);
    trackDirtySection('config', [showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, isAppLoading, hasCheckedSync]);
    trackDirtySection('rpFeedback', [rpFeedback, isAppLoading, hasCheckedSync]);
    trackDirtySection('userProfile', [userProfile, isAppLoading, hasCheckedSync]);
    trackDirtySection('nutritionLogs', [nutritionLogs, isAppLoading, hasCheckedSync]);
    trackDirtySection('cardioSessions', [cardioSessions, isAppLoading, hasCheckedSync]);
    trackDirtySection('nutritionGoal', [nutritionGoal, isAppLoading, hasCheckedSync]);
    trackDirtySection('bodyLogs', [bodyLogs, isAppLoading, hasCheckedSync]);
    trackDirtySection('macroGoals', [macroGoals, isAppLoading, hasCheckedSync]);
    trackDirtySection('customFoods', [customFoods, isAppLoading, hasCheckedSync]);
    trackDirtySection('personalTemplates', [personalTemplates, isAppLoading, hasCheckedSync]);

    const installApp = useCallback(async () => {
        const promptEvent = deferredPrompt || window.deferredPrompt;
        if (!promptEvent) {
            console.warn("No deferred prompt available");
            return;
        }

        try {
            promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                window.deferredPrompt = null;
            }
        } catch (e) {
            console.error("Install prompt error", e);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [deferredPrompt]);

    return { installApp };
};
