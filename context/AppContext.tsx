
import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, PropsWithChildren, useMemo, useCallback } from 'react';
import { AppState, Lang, Theme, ColorTheme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, TutorialState, GlobalTemplate, UserProfile, BeforeInstallPromptEvent, NutritionLog, CardioSession, NutritionGoal } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE, INITIAL_TEMPLATES } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { Icon } from '../components/ui/Icon';
import { Logo } from '../components/ui/Logo';
import { TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { AuthProvider, useAuth } from './AuthContext';
import { syncService } from '../services/syncService';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db as firestoreDb } from '../lib/firebase';



interface AppContextType extends AppState {
    lang: Lang;
    theme: Theme;
    colorTheme: ColorTheme;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    setColorTheme: (t: ColorTheme) => void;

    setProgram: (val: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    setActiveSession: (val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
    setExercises: (val: ExerciseDef[] | ((prev: ExerciseDef[]) => ExerciseDef[])) => void;
    setLogs: (val: Log[] | ((prev: Log[]) => Log[])) => void;
    setConfig: (val: AppState['config']) => void;
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

    // Tutorial Methods
    markTutorialSeen: (section: keyof TutorialState) => void;
    resetTutorials: () => void;

    // Sync UI State
    isAppLoading: boolean;
    pendingCloudData: Partial<AppState> | null;
    confirmCloudSync: () => void;
    cancelCloudSync: () => void;
    localLastUpdated: number;
    isOnline: boolean;

    // PWA Install State
    deferredPrompt: BeforeInstallPromptEvent | null;
    installApp: () => void;
    isStandalone: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v2', {
        home: false, workout: false, history: false, stats: false, mesoSettings: false
    });

    // --- Heavy Data (IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE, 1000);
    const [activeMeso, setActiveMeso, mesoLoading] = usePersistedState<MesoCycle | null>('il_meso_v16', null, 500);
    const [activeSession, setActiveSession, sessionLoading] = usePersistedState<ActiveSession | null>('il_session_v16', null, 500);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY, 1000);
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

    const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>(INITIAL_TEMPLATES);
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {}, 1000);
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false, 1000);
    const [localLastUpdated, setLocalLastUpdated] = usePersistedState<number>('il_last_sync_ts', 0, 0);

    const [pendingCloudData, setPendingCloudData] = useState<Partial<AppState> | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Initialize with global if available (captured in index.html)
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(window.deferredPrompt || null);
    const [isStandalone, setIsStandalone] = useState(false);

    const isAppLoading = programLoading || mesoLoading || sessionLoading || exLoading || logsLoading || fbLoading || onboardingLoading || authLoading || profileLoading || nutLoading || cardioLoading || goalLoading;
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // --- FETCH GLOBAL DATA ---
    useEffect(() => {
        if (!firestoreDb || !isOnline) return;
        const fetchData = async () => {
            try {
                const qTpl = query(collection(firestoreDb, "global_templates"), orderBy("order"));
                const tplSnapshot = await getDocs(qTpl);
                const fetchedTemplates: GlobalTemplate[] = [];
                tplSnapshot.forEach((doc) => fetchedTemplates.push({ id: doc.id, ...doc.data() } as GlobalTemplate));

                // MERGE STRATEGY: 
                let mergedTemplates = [...INITIAL_TEMPLATES];

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

                if (mergedTemplates.length > 0) setGlobalTemplates(mergedTemplates);

                const qEx = collection(firestoreDb, "global_exercises");
                const exSnapshot = await getDocs(qEx);
                const fetchedExercises: ExerciseDef[] = [];
                exSnapshot.forEach((doc) => fetchedExercises.push({ id: doc.id, ...doc.data() } as ExerciseDef));

                if (fetchedExercises.length > 0) {
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
        fetchData();
    }, [isOnline, user]);

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
        if (!user || isAppLoading || !isOnline || pendingCloudData) return;

        const checkCloudData = async () => {
            try {
                // Only trigger if we haven't checked since login or if local is empty
                const cloudData = await syncService.downloadState(user.uid);
                if (cloudData && cloudData.lastUpdated) {
                    // Strategy: If local is empty (new device) OR cloud is strictly newer
                    const isLocalEmpty = !activeMeso && (!logs || logs.length === 0);

                    if (isLocalEmpty || cloudData.lastUpdated > (localLastUpdated || 0)) {
                        console.log("☁️ Data mismatch found: Cloud is newer or Local is empty. Offering sync.");
                        setPendingCloudData(cloudData);
                    }
                }
            } catch (error) {
                console.error("Initial cloud sync check failed", error);
            }
        };

        checkCloudData();
    }, [user, isOnline, isAppLoading, pendingCloudData]); // Re-run when user or online status changes

    // --- SYNC LOGIC ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (user) {
                if (subscription.isPro) {
                    const now = Date.now();
                    setLocalLastUpdated(now);
                    syncService.uploadState(user.uid, {
                        program, activeMeso, exercises, logs, config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn }, rpFeedback, activeSession, lastUpdated: now
                    });
                } else {
                    syncService.uploadUserIdentity(user.uid, user.email || "");
                }
            }
        };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, [user, subscription.isPro, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, rpFeedback, activeSession, userProfile]);

    // Upload Debounce
    useEffect(() => {
        if (!user || isAppLoading) return;
        const timer = setTimeout(() => {
            if (subscription.isPro) {
                const now = Date.now();
                setLocalLastUpdated(now);
                syncService.uploadState(user.uid, {
                    program, activeMeso, activeSession, exercises, logs, config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn }, rpFeedback, lastUpdated: now
                });
            } else {
                syncService.uploadUserIdentity(user.uid, user.email || "");
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [user, subscription.isPro, program, activeMeso, activeSession, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, rpFeedback, isAppLoading, userProfile]);

    const confirmCloudSync = useCallback(() => {
        if (pendingCloudData) {
            console.log("📥 Applying Cloud Data...");

            // Apply all states
            if (pendingCloudData.program) setProgram(pendingCloudData.program);
            if (pendingCloudData.activeMeso) setActiveMeso(pendingCloudData.activeMeso);
            if (pendingCloudData.activeSession) setActiveSession(pendingCloudData.activeSession);
            if (pendingCloudData.exercises) setExercises(pendingCloudData.exercises);
            if (pendingCloudData.logs) setLogs(pendingCloudData.logs);
            if (pendingCloudData.rpFeedback) setRpFeedback(pendingCloudData.rpFeedback);

            if (pendingCloudData.config) {
                if (pendingCloudData.config.showRIR !== undefined) setShowRIR(pendingCloudData.config.showRIR);
                if (pendingCloudData.config.rpEnabled !== undefined) setRpEnabled(pendingCloudData.config.rpEnabled);
                if (pendingCloudData.config.rpTargetRIR !== undefined) setRpTargetRIR(pendingCloudData.config.rpTargetRIR);
                if (pendingCloudData.config.keepScreenOn !== undefined) setKeepScreenOn(pendingCloudData.config.keepScreenOn);
            }

            if (pendingCloudData.userProfile) setUserProfile(pendingCloudData.userProfile);

            // Sync timestamp to prevent immediate re-upload of old local state
            if (pendingCloudData.lastUpdated) {
                // @ts-ignore
                setLocalLastUpdated(pendingCloudData.lastUpdated);
            }

            // Mark onboarding as complete
            setHasSeenOnboarding(true);
            setPendingCloudData(null);

            // OPTIMIZATION: Instead of immediate reload, we let the reactive state handle it.
            // We only reload if we detect critical inconsistencies or if the user is in a state where a refresh is better.
            console.log("✅ Cloud Data Applied Reactively.");

            // Optional: You could add a 'sync_completed' event or toast here.
        }
    }, [pendingCloudData, setProgram, setActiveMeso, setActiveSession, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated, setHasSeenOnboarding]);

    const cancelCloudSync = useCallback(() => setPendingCloudData(null), []);

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
    const resetTutorials = useCallback(() => setTutorialProgress({ home: false, workout: false, history: false, stats: false, mesoSettings: false }), [setTutorialProgress]);

    const configState = useMemo(() => ({ showRIR, rpEnabled, rpTargetRIR, keepScreenOn }), [showRIR, rpEnabled, rpTargetRIR, keepScreenOn]);

    const contextValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        program, setProgram,
        activeMeso, setActiveMeso,
        activeSession, setActiveSession,
        exercises, setExercises,
        logs, setLogs,
        config: configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, confirmCloudSync, cancelCloudSync, localLastUpdated,
        isOnline,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal
    }), [
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        program, setProgram,
        activeMeso, setActiveMeso,
        activeSession, setActiveSession,
        exercises, setExercises,
        logs, setLogs,
        configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, confirmCloudSync, cancelCloudSync, localLastUpdated,
        isOnline,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal
    ]);

    if (isAppLoading) return <HomeSkeleton />;

    return (
        <AppContext.Provider value={contextValue}>
            <TimerProvider>
                {children}
            </TimerProvider>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
