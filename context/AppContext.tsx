
import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, PropsWithChildren, useMemo, useCallback } from 'react';
import { AppState, Lang, Theme, ColorTheme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, TutorialState, GlobalTemplate, UserProfile, BeforeInstallPromptEvent, NutritionLog, CardioSession, NutritionGoal, MacroGoals, DailyNutrition, BodyLog, CustomFood, DirtySyncSection, SectionSyncMeta } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { Icon } from '../components/ui/Icon';
import { Logo } from '../components/ui/Logo';
import { TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { AuthProvider, useAuth } from './AuthContext';
import { syncService } from '../services/syncService';
import { useStore } from '../lib/store';
import { getFirebaseFirestoreServices, isFirebaseConfigured } from '../lib/firebaseLoader';
import { scheduleWhenIdle } from '../lib/idle';
import { offlineSyncQueue } from '../services/offlineSyncQueue';
import { dirtySyncState } from '../services/dirtySyncState';

const FULL_SYNC_SECTIONS: DirtySyncSection[] = [
    'program',
    'activeMeso',
    'exercises',
    'logs',
    'config',
    'rpFeedback',
    'userProfile',
    'nutritionLogs',
    'cardioSessions',
    'nutritionGoal',
    'bodyLogs',
    'macroGoals',
    'customFoods',
];

interface AppContextType extends Omit<AppState, 'activeSession' | 'activeMeso'> {
    lang: Lang;
    theme: Theme;
    colorTheme: ColorTheme;
    reducedEffects: boolean;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    setColorTheme: (t: ColorTheme) => void;

    setProgram: (val: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => void;
    setExercises: (val: ExerciseDef[] | ((prev: ExerciseDef[]) => ExerciseDef[])) => void;
    setLogs: (val: Log[] | ((prev: Log[]) => Log[])) => void;
    setConfig: (val: Partial<AppState['config']>) => void;
    setRpFeedback: (val: AppState['rpFeedback'] | ((prev: AppState['rpFeedback']) => AppState['rpFeedback'])) => void;
    setHasSeenOnboarding: (val: boolean) => void;
    setGlobalTemplates: (val: GlobalTemplate[] | ((prev: GlobalTemplate[]) => GlobalTemplate[])) => void;

    // NEW: User Profile Setter
    setUserProfile: (val: UserProfile | ((prev: UserProfile) => UserProfile)) => void;

    // Nutrition & Cardio
    nutritionLogs: NutritionLog[];
    setNutritionLogs: (val: NutritionLog[] | ((prev: NutritionLog[]) => NutritionLog[])) => void;
    cardioSessions: CardioSession[];
    setCardioSessions: (val: CardioSession[] | ((prev: CardioSession[]) => CardioSession[])) => void;
    nutritionGoal: NutritionGoal;
    setNutritionGoal: (val: NutritionGoal | ((prev: NutritionGoal) => NutritionGoal)) => void;

    // Body Tracking
    setBodyLogs: (val: BodyLog[] | ((prev: BodyLog[]) => BodyLog[])) => void;
    setMacroGoals: (val: MacroGoals | null | ((prev: MacroGoals | null) => MacroGoals | null)) => void;

    // Custom Food Database
    customFoods: CustomFood[];
    setCustomFoods: (val: CustomFood[] | ((prev: CustomFood[]) => CustomFood[])) => void;

    // Tutorial Methods
    markTutorialSeen: (section: keyof TutorialState) => void;
    resetTutorials: () => void;

    // Sync UI State
    isAppLoading: boolean;
    pendingCloudData: Partial<AppState> | null;
    pendingCloudSections: DirtySyncSection[];
    confirmCloudSync: () => void;
    cancelCloudSync: () => void;
    localLastUpdated: number;
    localSectionSyncMeta: SectionSyncMeta;
    isOnline: boolean;
    syncStatus: {
        pending: number;
        isSyncing: boolean;
        lastSyncedAt: number | null;
    };

    // PWA Install State
    deferredPrompt: BeforeInstallPromptEvent | null;
    installApp: () => void;
    isStandalone: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
type AppPreferencesContextType = Pick<AppContextType, 'lang' | 'setLang' | 'theme' | 'setTheme' | 'colorTheme' | 'setColorTheme' | 'deferredPrompt' | 'installApp' | 'isStandalone' | 'reducedEffects'>;
type AppConfigContextType = Pick<AppContextType, 'config' | 'setConfig'>;
type TutorialContextType = Pick<AppContextType, 'tutorialProgress' | 'markTutorialSeen' | 'resetTutorials'>;

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);
const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const INITIAL_TUTORIAL_STATE: TutorialState = {
    home: false, workout: false, history: false, stats: false, mesoSettings: false, nutrition: false
};

export const AppProvider = ({ children }: PropsWithChildren) => {
    const { user, subscription, loading: authLoading } = useAuth();

    // --- Synchronous Config ---
    const [langStored, setLang] = useLocalStorage<Lang>('il_lang_v1', 'es');
    const lang: Lang = (langStored === 'en' || langStored === 'es') ? langStored : 'es';

    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('il_color_theme_v1', 'iron');

    // FIXED: Default to FALSE for PRO features
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', false);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', false);

    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);
    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v2', INITIAL_TUTORIAL_STATE);

    // --- Heavy Data (IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', [], 1000);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', [], 1000);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', [], 1000);

    const DEFAULT_NUTRITION_GOAL: NutritionGoal = { calories: 2500, protein: 180, carbs: 280, fat: 70 };
    const [nutritionLogs, setNutritionLogs, nutLoading] = usePersistedState<NutritionLog[]>('il_nutrition_v1', [], 1000);
    const [cardioSessions, setCardioSessions, cardioLoading] = usePersistedState<CardioSession[]>('il_cardio_v1', [], 1000);
    const [nutritionGoal, setNutritionGoal, goalLoading] = usePersistedState<NutritionGoal>('il_nut_goal_v1', DEFAULT_NUTRITION_GOAL, 500);

    // NEW: User Profile Persistence
    const [userProfile, setUserProfile, profileLoading] = usePersistedState<UserProfile>('il_profile_v1', {
        experience: 'intermediate',
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium'
    }, 1000);

    const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
    const [defaultLibrary, setDefaultLibrary] = useState<ExerciseDef[] | null>(null);
    const [defaultTemplate, setDefaultTemplate] = useState<ProgramDay[] | null>(null);
    const [baseTemplates, setBaseTemplates] = useState<GlobalTemplate[] | null>(null);
    const [defaultsLoading, setDefaultsLoading] = useState(true);
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {}, 1000);
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false, 1000);
    const [localLastUpdated, setLocalLastUpdated] = usePersistedState<number>('il_last_sync_ts', 0, 0);
    const [localSectionSyncMeta, setLocalSectionSyncMeta] = usePersistedState<SectionSyncMeta>('il_section_sync_meta_v1', {}, 0);

    // NEW: Nutrition & Body Tracking Persistence
    const [bodyLogs, setBodyLogs, bodyLoading] = usePersistedState<BodyLog[]>('il_body_v1', [], 1000);
    const [macroGoals, setMacroGoals, macroLoading] = usePersistedState<MacroGoals | null>('il_macros_v1', null, 500);
    const [customFoods, setCustomFoods] = usePersistedState<CustomFood[]>('il_custom_foods_v1', [], 1000);

    const [pendingCloudData, setPendingCloudData] = useState<Partial<AppState> | null>(null);
    const [pendingCloudSections, setPendingCloudSections] = useState<DirtySyncSection[]>([]);
    const [hasCheckedSync, setHasCheckedSync] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState({
        pending: 0,
        isSyncing: false,
        lastSyncedAt: null as number | null,
    });

    // Initialize with global if available (captured in index.html)
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(window.deferredPrompt || null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [reducedEffects, setReducedEffects] = useState(false);

    const isStoreLoading = useStore(state => state.isStoreLoading);
    const activeSession = useStore(state => state.activeSession);
    const activeMeso = useStore(state => state.activeMeso);

    const needsDefaultBootstrap =
        defaultsLoading &&
        !programLoading &&
        !exLoading &&
        (program.length === 0 || exercises.length === 0 || globalTemplates.length === 0);

    const isAppLoading =
        isStoreLoading ||
        programLoading ||
        exLoading ||
        logsLoading ||
        fbLoading ||
        onboardingLoading ||
        authLoading ||
        profileLoading ||
        nutLoading ||
        cardioLoading ||
        goalLoading ||
        bodyLoading ||
        macroLoading ||
        needsDefaultBootstrap;
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const dirtyInitRef = useRef(new Set<DirtySyncSection>());
    const suppressDirtyRef = useRef(false);

    const trackDirtySection = (section: DirtySyncSection, deps: React.DependencyList) => {
        useEffect(() => {
            if (isAppLoading || !hasCheckedSync || suppressDirtyRef.current) return;

            if (!dirtyInitRef.current.has(section)) {
                dirtyInitRef.current.add(section);
                return;
            }

            const now = Date.now();
            setLocalSectionSyncMeta(prev => ({ ...prev, [section]: now }));
            void dirtySyncState.mark([section]);
        }, deps);
    };

    const withDirtyTrackingSuppressed = async (callback: () => void | Promise<void>) => {
        suppressDirtyRef.current = true;
        const release = () => {
            window.setTimeout(() => {
                suppressDirtyRef.current = false;
            }, 0);
        };

        try {
            await callback();
        } catch (error) {
            release();
            throw error;
        }
        release();
    };

    useEffect(() => {
        let cancelled = false;
        const cancelIdle = scheduleWhenIdle(async () => {
            try {
                const [{ DEFAULT_LIBRARY }, { DEFAULT_TEMPLATE, INITIAL_TEMPLATES }] = await Promise.all([
                    import('../data/defaultLibrary'),
                    import('../data/defaultTemplates'),
                ]);

                if (cancelled) return;

                setDefaultLibrary(DEFAULT_LIBRARY);
                setDefaultTemplate(DEFAULT_TEMPLATE);
                setBaseTemplates(INITIAL_TEMPLATES);
                setGlobalTemplates((prev) => (prev.length > 0 ? prev : INITIAL_TEMPLATES));
            } finally {
                if (!cancelled) setDefaultsLoading(false);
            }
        }, 200);

        return () => {
            cancelled = true;
            cancelIdle();
        };
    }, []);

    useEffect(() => {
        if (programLoading || !defaultTemplate || program.length > 0) return;
        setProgram(defaultTemplate);
    }, [programLoading, defaultTemplate, program, setProgram]);

    useEffect(() => {
        if (exLoading || !defaultLibrary || exercises.length > 0) return;
        setExercises(defaultLibrary);
    }, [exLoading, defaultLibrary, exercises, setExercises]);

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
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'FLUSH_SYNC_QUEUE') {
                void syncService.flushQueue();
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateEffectsMode = () => {
            const connection = (navigator as any).connection;
            const saveData = !!connection?.saveData;
            const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
            const lowMemory = typeof (navigator as any).deviceMemory === 'number' && (navigator as any).deviceMemory <= 4;
            const shouldReduce = media.matches || saveData || lowCpu || lowMemory;

            setReducedEffects(shouldReduce);
            document.documentElement.dataset.effects = shouldReduce ? 'reduced' : 'full';
        };

        updateEffectsMode();
        media.addEventListener('change', updateEffectsMode);
        window.addEventListener('pageshow', updateEffectsMode);
        return () => {
            media.removeEventListener('change', updateEffectsMode);
            window.removeEventListener('pageshow', updateEffectsMode);
        };
    }, []);

    trackDirtySection('program', [program, isAppLoading, hasCheckedSync]);
    trackDirtySection('activeMeso', [activeMeso, isAppLoading, hasCheckedSync]);
    trackDirtySection('exercises', [exercises, isAppLoading, hasCheckedSync]);
    trackDirtySection('logs', [logs, isAppLoading, hasCheckedSync]);
    trackDirtySection('config', [showRIR, rpEnabled, rpTargetRIR, keepScreenOn, isAppLoading, hasCheckedSync]);
    trackDirtySection('rpFeedback', [rpFeedback, isAppLoading, hasCheckedSync]);
    trackDirtySection('userProfile', [userProfile, isAppLoading, hasCheckedSync]);
    trackDirtySection('nutritionLogs', [nutritionLogs, isAppLoading, hasCheckedSync]);
    trackDirtySection('cardioSessions', [cardioSessions, isAppLoading, hasCheckedSync]);
    trackDirtySection('nutritionGoal', [nutritionGoal, isAppLoading, hasCheckedSync]);
    trackDirtySection('bodyLogs', [bodyLogs, isAppLoading, hasCheckedSync]);
    trackDirtySection('macroGoals', [macroGoals, isAppLoading, hasCheckedSync]);
    trackDirtySection('customFoods', [customFoods, isAppLoading, hasCheckedSync]);

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
    }, [deferredPrompt]);

    // --- INITIAL CLOUD DOWNLOAD ---
    useEffect(() => {
        if (!user || isAppLoading || !isOnline || pendingCloudData || hasCheckedSync) return;

        const checkCloudData = async () => {
            try {
                // Only trigger if we haven't checked since login or if local is empty
                const cloudData = await syncService.downloadState(user.uid);
                if (cloudData && cloudData.lastUpdated) {
                    const cloudSyncMeta = ((cloudData as Partial<AppState> & { syncMeta?: SectionSyncMeta }).syncMeta) || {};
                    const isLocalEmpty = !activeMeso && (!logs || logs.length === 0);

                    if (isLocalEmpty) {
                        console.log("Cloud data found on empty device. Applying automatically.");
                        await withDirtyTrackingSuppressed(async () => {
                            if (cloudData.program) setProgram(cloudData.program);
                            if (cloudData.activeMeso) useStore.getState().setActiveMeso(cloudData.activeMeso);
                            if (cloudData.activeSession) useStore.getState().setActiveSession(cloudData.activeSession);
                            if (cloudData.exercises) setExercises(cloudData.exercises);
                            if (cloudData.logs) setLogs(cloudData.logs);
                            if (cloudData.rpFeedback) setRpFeedback(cloudData.rpFeedback);

                            if (cloudData.config) {
                                if (cloudData.config.showRIR !== undefined) setShowRIR(cloudData.config.showRIR);
                                if (cloudData.config.rpEnabled !== undefined) setRpEnabled(cloudData.config.rpEnabled);
                                if (cloudData.config.rpTargetRIR !== undefined) setRpTargetRIR(cloudData.config.rpTargetRIR);
                                if (cloudData.config.keepScreenOn !== undefined) setKeepScreenOn(cloudData.config.keepScreenOn);
                            }

                            if (cloudData.userProfile) setUserProfile(cloudData.userProfile);
                            if (cloudData.nutritionLogs) setNutritionLogs(cloudData.nutritionLogs);
                            if (cloudData.bodyLogs) setBodyLogs(cloudData.bodyLogs);
                            if (cloudData.macroGoals) setMacroGoals(cloudData.macroGoals);
                            if (cloudData.customFoods) setCustomFoods(cloudData.customFoods);

                            setLocalLastUpdated(cloudData.lastUpdated ?? Date.now());
                            setLocalSectionSyncMeta(cloudSyncMeta);
                            setHasSeenOnboarding(true);
                            await dirtySyncState.clear();
                        });
                    } else if (cloudData.lastUpdated > (localLastUpdated || 0)) {
                        const newerSections = Object.entries(cloudSyncMeta)
                            .filter(([section, ts]) => typeof ts === 'number' && ts > (localSectionSyncMeta[section as DirtySyncSection] || 0))
                            .map(([section]) => section as DirtySyncSection);

                        if (newerSections.length === 0) return;

                        console.log("Cloud data is newer than local. Offering sync.");
                        setPendingCloudData(cloudData);
                        setPendingCloudSections(newerSections);
                    }
                }
            } catch (error) {
                console.error("Initial cloud sync check failed", error);
            } finally {
                setHasCheckedSync(true); // Always mark as checked so it doesn't loop
            }
        };

        checkCloudData();
    }, [
        user, isOnline, isAppLoading, pendingCloudData, hasCheckedSync, activeMeso, logs, localLastUpdated, localSectionSyncMeta,
        setProgram, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated,
        setHasSeenOnboarding, setBodyLogs, setCustomFoods, setKeepScreenOn, setMacroGoals, setNutritionLogs, setLocalSectionSyncMeta,
        setRpTargetRIR, setUserProfile
    ]); // Re-run when dependencies change

    // --- SYNC LOGIC ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (user) {
                if (subscription.isPro) {
                    void (async () => {
                        const dirtySections = await dirtySyncState.list();
                        await syncService.flushQueue();
                        if (dirtySections.length === 0) return;

                        const now = Date.now();
                        setLocalLastUpdated(now);
                        await syncService.uploadState(user.uid, {
                            program, activeMeso, exercises, logs,
                            config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn },
                            rpFeedback,
                            userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods,
                            email: user.email || null,
                            lastUpdated: now,
                        }, dirtySections);
                    })();
                } else {
                    void syncService.flushQueue();
                    syncService.uploadUserIdentity(user.uid, user.email || "");
                }
            }
        };

        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, [user, subscription.isPro, program, activeMeso, activeSession, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, rpFeedback, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, setLocalLastUpdated]);

    // ── Debounce A: session-only write (fast, lightweight) ─────────────────────
    // activeSession changes on every set completion or weight input during a workout.
    // Writing only this one field (~1-5 KB) instead of the full state document
    // (~50-200 KB) reduces Firestore write cost by 95%+ during an active session.
    useEffect(() => {
        if (!user || isAppLoading || !hasCheckedSync || !!pendingCloudData) return;
        if (!subscription.isPro) return; // free users: identity-only (handled in online handler)
        const timer = setTimeout(() => {
            const now = Date.now();
            setLocalLastUpdated(now);
            void syncService.flushQueue();
            syncService.uploadSessionOnly(user.uid, activeSession, now);
        }, 3000);
        return () => clearTimeout(timer);
    }, [user, subscription.isPro, isAppLoading, hasCheckedSync, pendingCloudData, activeSession, setLocalLastUpdated]);

    // ── Debounce B: full-state write (slower, only when program/data changes) ──
    // Excludes activeSession (handled above). Fires only when program, exercises,
    // logs, nutrition or config change — much less frequent than session updates.
    // Uses 10s debounce: these changes are deliberate edits, not keystrokes.
    useEffect(() => {
        if (!user || isAppLoading || !hasCheckedSync || !!pendingCloudData) return;
        const timer = setTimeout(() => {
            if (subscription.isPro) {
                void (async () => {
                    const dirtySections = await dirtySyncState.list();
                    if (dirtySections.length === 0) return;

                    const now = Date.now();
                    setLocalLastUpdated(now);
                    void syncService.flushQueue();
                    syncService.uploadState(user.uid, {
                        program, activeMeso, exercises, logs,
                        config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn },
                        rpFeedback,
                        userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods,
                        email: user.email || null,
                        lastUpdated: now,
                    }, dirtySections);
                })();
            } else {
                syncService.uploadUserIdentity(user.uid, user.email || "");
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [user, subscription.isPro, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, rpFeedback, isAppLoading, hasCheckedSync, pendingCloudData, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, setLocalLastUpdated]);

    const confirmCloudSync = useCallback(() => {
        if (!pendingCloudData) return;

        console.log("Applying newer cloud sections...");
        void withDirtyTrackingSuppressed(async () => {
            const cloudSyncMeta = ((pendingCloudData as Partial<AppState> & { syncMeta?: SectionSyncMeta }).syncMeta) || {};

            if (pendingCloudSections.includes('program') && pendingCloudData.program) setProgram(pendingCloudData.program);
            if (pendingCloudSections.includes('activeMeso') && pendingCloudData.activeMeso) useStore.getState().setActiveMeso(pendingCloudData.activeMeso);
            if (pendingCloudSections.includes('exercises') && pendingCloudData.exercises) setExercises(pendingCloudData.exercises);
            if (pendingCloudSections.includes('logs') && pendingCloudData.logs) setLogs(pendingCloudData.logs);
            if (pendingCloudSections.includes('rpFeedback') && pendingCloudData.rpFeedback) setRpFeedback(pendingCloudData.rpFeedback);

            if (pendingCloudSections.includes('config') && pendingCloudData.config) {
                if (pendingCloudData.config.showRIR !== undefined) setShowRIR(pendingCloudData.config.showRIR);
                if (pendingCloudData.config.rpEnabled !== undefined) setRpEnabled(pendingCloudData.config.rpEnabled);
                if (pendingCloudData.config.rpTargetRIR !== undefined) setRpTargetRIR(pendingCloudData.config.rpTargetRIR);
                if (pendingCloudData.config.keepScreenOn !== undefined) setKeepScreenOn(pendingCloudData.config.keepScreenOn);
            }

            if (pendingCloudSections.includes('userProfile') && pendingCloudData.userProfile) setUserProfile(pendingCloudData.userProfile);
            if (pendingCloudSections.includes('nutritionLogs') && pendingCloudData.nutritionLogs) setNutritionLogs(pendingCloudData.nutritionLogs);
            if (pendingCloudSections.includes('cardioSessions') && pendingCloudData.cardioSessions) setCardioSessions(pendingCloudData.cardioSessions);
            if (pendingCloudSections.includes('nutritionGoal') && pendingCloudData.nutritionGoal) setNutritionGoal(pendingCloudData.nutritionGoal);
            if (pendingCloudSections.includes('bodyLogs') && pendingCloudData.bodyLogs) setBodyLogs(pendingCloudData.bodyLogs);
            if (pendingCloudSections.includes('macroGoals') && pendingCloudData.macroGoals) setMacroGoals(pendingCloudData.macroGoals);
            if (pendingCloudSections.includes('customFoods') && pendingCloudData.customFoods) setCustomFoods(pendingCloudData.customFoods);

            setLocalLastUpdated(pendingCloudData.lastUpdated ?? Date.now());
            setLocalSectionSyncMeta(prev => {
                const next = { ...prev };
                pendingCloudSections.forEach(section => {
                    const cloudTs = cloudSyncMeta[section];
                    if (typeof cloudTs === 'number') next[section] = cloudTs;
                });
                return next;
            });
            await dirtySyncState.clear(pendingCloudSections);

            setHasSeenOnboarding(true);
            setPendingCloudData(null);
            setPendingCloudSections([]);
            console.log("Cloud sections applied.");
        });
    }, [pendingCloudData, pendingCloudSections, setProgram, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated, setHasSeenOnboarding, setBodyLogs, setCustomFoods, setKeepScreenOn, setMacroGoals, setNutritionLogs, setRpTargetRIR, setUserProfile, setLocalSectionSyncMeta, setCardioSessions, setNutritionGoal]);

    const cancelCloudSync = useCallback(() => {
        setPendingCloudData(null);
        setPendingCloudSections([]);
        setLocalLastUpdated(Date.now());
        setLocalSectionSyncMeta(prev => {
            const now = Date.now();
            return FULL_SYNC_SECTIONS.reduce<SectionSyncMeta>((acc, section) => {
                acc[section] = now;
                return acc;
            }, { ...prev });
        });
        void dirtySyncState.mark(FULL_SYNC_SECTIONS);
    }, [setLocalLastUpdated, setLocalSectionSyncMeta]);

    // --- THEME & WAKELOCK ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'system') root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        else root.classList.add(theme);
    }, [theme]);

    useEffect(() => { window.document.documentElement.setAttribute('data-theme', colorTheme); }, [colorTheme]);

    useEffect(() => {
        const requestWakeLock = async () => {
            if (keepScreenOn && 'wakeLock' in navigator) {
                try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { }
            } else if (!keepScreenOn && wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
                wakeLockRef.current = null;
            }
        };
        requestWakeLock();
        const handleVis = () => { if (document.visibilityState === 'visible' && keepScreenOn) requestWakeLock(); };
        document.addEventListener('visibilitychange', handleVis);
        return () => { document.removeEventListener('visibilitychange', handleVis); if (wakeLockRef.current) wakeLockRef.current.release().catch(() => { }); };
    }, [keepScreenOn]);

    const setConfig = useCallback((newConfig: any) => {
        if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
        if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
        if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        if (newConfig.keepScreenOn !== undefined) setKeepScreenOn(newConfig.keepScreenOn);
    }, [setShowRIR, setRpEnabled, setRpTargetRIR, setKeepScreenOn]);

    const markTutorialSeen = useCallback((section: keyof TutorialState) => setTutorialProgress(prev => ({ ...prev, [section]: true })), [setTutorialProgress]);
    const resetTutorials = useCallback(() => setTutorialProgress(INITIAL_TUTORIAL_STATE), [setTutorialProgress]);


    const configState = useMemo(() => ({ showRIR, rpEnabled, rpTargetRIR, keepScreenOn }), [showRIR, rpEnabled, rpTargetRIR, keepScreenOn]);
    const preferencesValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        deferredPrompt, installApp, isStandalone, reducedEffects,
    }), [lang, setLang, theme, setTheme, colorTheme, setColorTheme, deferredPrompt, installApp, isStandalone, reducedEffects]);
    const configValue = useMemo(() => ({
        config: configState,
        setConfig,
    }), [configState, setConfig]);
    const tutorialValue = useMemo(() => ({
        tutorialProgress,
        markTutorialSeen,
        resetTutorials,
    }), [tutorialProgress, markTutorialSeen, resetTutorials]);

    const contextValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        reducedEffects,
        program, setProgram,
        exercises, setExercises,
        logs, setLogs,
        config: configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync, localLastUpdated, localSectionSyncMeta,
        isOnline,
        syncStatus,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal,
        bodyLogs, setBodyLogs,
        macroGoals, setMacroGoals,
        customFoods, setCustomFoods,
    }), [
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        reducedEffects,
        program, setProgram,
        exercises, setExercises,
        logs, setLogs,
        configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync, localLastUpdated, localSectionSyncMeta,
        isOnline,
        syncStatus,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal,
        bodyLogs, setBodyLogs,
        macroGoals, setMacroGoals,
        customFoods, setCustomFoods,
    ]);

    if (isAppLoading) return <HomeSkeleton />;

    return (
        <AppContext.Provider value={contextValue}>
            <AppPreferencesContext.Provider value={preferencesValue}>
                <AppConfigContext.Provider value={configValue}>
                    <TutorialContext.Provider value={tutorialValue}>
                        <TimerProvider>
                            {children}
                        </TimerProvider>
                    </TutorialContext.Provider>
                </AppConfigContext.Provider>
            </AppPreferencesContext.Provider>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

export const useAppPreferences = () => {
    const context = useContext(AppPreferencesContext);
    if (!context) throw new Error('useAppPreferences must be used within an AppProvider');
    return context;
};

export const useAppConfig = () => {
    const context = useContext(AppConfigContext);
    if (!context) throw new Error('useAppConfig must be used within an AppProvider');
    return context;
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) throw new Error('useTutorial must be used within an AppProvider');
    return context;
};
