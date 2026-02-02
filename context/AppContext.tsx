
import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, PropsWithChildren, useMemo, useCallback } from 'react';
import { AppState, Lang, Theme, ColorTheme, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, TutorialState } from '../types';
import { DEFAULT_LIBRARY, DEFAULT_TEMPLATE } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { Icon } from '../components/ui/Icon';
import { Logo } from '../components/ui/Logo';
import { TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { AuthProvider, useAuth } from './AuthContext'; // Import Auth
import { syncService } from '../services/syncService'; // Import Sync

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
    deferredPrompt: any;
    installApp: () => void;
    isStandalone: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Separated component to handle Sync Logic inside AuthProvider
const AppStateProvider = ({ children }: PropsWithChildren) => {
    const { user, subscription } = useAuth(); // Access User & Subscription

    // --- Synchronous Config ---
    const [langStored, setLang] = useLocalStorage<Lang>('il_lang_v1', 'en');
    const lang: Lang = (langStored === 'en' || langStored === 'es') ? langStored : 'en';

    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('il_color_theme_v1', 'iron');
    
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', true);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', true);
    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);

    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v1', {
        home: false, workout: false, history: false, stats: false
    });

    // --- Heavy Data (IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', DEFAULT_TEMPLATE, 1000);
    const [activeMeso, setActiveMeso, mesoLoading] = usePersistedState<MesoCycle | null>('il_meso_v16', null, 500);
    const [activeSession, setActiveSession, sessionLoading] = usePersistedState<ActiveSession | null>('il_session_v16', null, 500);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', DEFAULT_LIBRARY, 1000);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', [], 1000);
    
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {}, 1000);
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false, 1000);
    
    // NEW: Persist local timestamp to compare with cloud
    const [localLastUpdated, setLocalLastUpdated] = usePersistedState<number>('il_last_sync_ts', 0, 0);

    const [pendingCloudData, setPendingCloudData] = useState<Partial<AppState> | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // PWA Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    const isAppLoading = programLoading || mesoLoading || sessionLoading || exLoading || logsLoading || fbLoading || onboardingLoading;
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // --- PWA INSTALL HANDLER ---
    useEffect(() => {
        // Detect if already installed
        const isStandaloneQuery = window.matchMedia('(display-mode: standalone)');
        setIsStandalone(isStandaloneQuery.matches);
        
        isStandaloneQuery.addEventListener('change', (e) => {
            setIsStandalone(e.matches);
        });

        const handler = (e: any) => {
            // Prevent Chrome 67+ from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log("📲 Install Prompt captured");
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = useCallback(async () => {
        if (!deferredPrompt) {
            console.warn("Install prompt not available");
            return;
        }
        // Show the native install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        if(outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    // --- CLOUD SYNC LOGIC ---
    
    // 0. Network Status Listener & Reconnection Sync
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log("🌐 Back Online! Checking sync...");
            // Only trigger sync if PRO
            if(user && subscription.isPro) {
                const now = Date.now();
                setLocalLastUpdated(now);
                syncService.uploadState(user.uid, {
                    program, activeMeso, exercises, logs, config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn }, rpFeedback, activeSession, lastUpdated: now
                });
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user, subscription.isPro, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, rpFeedback, activeSession]);

    // 1. Download & Compare on Login (Check PRO)
    useEffect(() => {
        if (user && !isAppLoading && isOnline && subscription.isPro) {
            syncService.downloadState(user.uid).then((cloudData: any) => {
                if (cloudData) {
                    const cloudTS = cloudData.lastUpdated || 0;
                    const localTS = localLastUpdated || 0;

                    if (cloudTS > localTS) {
                        setPendingCloudData(cloudData);
                    }
                } else {
                    // No cloud data -> Upload local to init
                    const now = Date.now();
                    setLocalLastUpdated(now);
                    syncService.uploadState(user.uid, { program, activeMeso, exercises, logs, config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn }, rpFeedback, activeSession, lastUpdated: now });
                }
            });
        }
    }, [user, isAppLoading, isOnline, subscription.isPro]); 

    // 2. Upload on Data Change (Debounced) - Gate with PRO check
    useEffect(() => {
        if (!user || isAppLoading || !subscription.isPro) return;

        const timer = setTimeout(() => {
            const now = Date.now();
            setLocalLastUpdated(now);
            
            syncService.uploadState(user.uid, {
                program,
                activeMeso,
                activeSession,
                exercises,
                logs,
                config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn },
                rpFeedback,
                lastUpdated: now
            });
        }, 5000); 

        return () => clearTimeout(timer);
    }, [user, subscription.isPro, program, activeMeso, activeSession, exercises, logs, showRIR, rpEnabled, rpFeedback, isAppLoading]);

    const confirmCloudSync = useCallback(() => {
        if (pendingCloudData) {
            if (pendingCloudData.program) setProgram(pendingCloudData.program);
            if (pendingCloudData.activeMeso) setActiveMeso(pendingCloudData.activeMeso);
            if (pendingCloudData.activeSession) setActiveSession(pendingCloudData.activeSession);
            if (pendingCloudData.exercises) setExercises(pendingCloudData.exercises);
            if (pendingCloudData.logs) setLogs(pendingCloudData.logs);
            if (pendingCloudData.rpFeedback) setRpFeedback(pendingCloudData.rpFeedback);
            
            if (pendingCloudData.config) {
                if (pendingCloudData.config.showRIR !== undefined) setShowRIR(pendingCloudData.config.showRIR);
                if (pendingCloudData.config.rpEnabled !== undefined) setRpEnabled(pendingCloudData.config.rpEnabled);
            }
            // @ts-ignore
            if (pendingCloudData.lastUpdated) setLocalLastUpdated(pendingCloudData.lastUpdated);
            
            setPendingCloudData(null);
        }
    }, [pendingCloudData]);

    const cancelCloudSync = useCallback(() => {
        setPendingCloudData(null);
    }, []);


    // --- THEME & WAKELOCK EFFECTS ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', colorTheme);
    }, [colorTheme]);

    useEffect(() => {
        const requestWakeLock = async () => {
            if (keepScreenOn && 'wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch (err: any) {
                    if (err.name !== 'NotAllowedError') console.warn('Wake Lock failed:', err);
                }
            } else if (!keepScreenOn && wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => {});
                wakeLockRef.current = null;
            }
        };
        requestWakeLock();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && keepScreenOn) requestWakeLock();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
        };
    }, [keepScreenOn]);

    const setConfig = useCallback((newConfig: any) => {
        if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
        if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
        if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        if (newConfig.keepScreenOn !== undefined) setKeepScreenOn(newConfig.keepScreenOn);
    }, [setShowRIR, setRpEnabled, setRpTargetRIR, setKeepScreenOn]);

    const markTutorialSeen = useCallback((section: keyof TutorialState) => {
        setTutorialProgress(prev => ({ ...prev, [section]: true }));
    }, [setTutorialProgress]);

    const resetTutorials = useCallback(() => {
        setTutorialProgress({ home: false, workout: false, history: false, stats: false });
    }, [setTutorialProgress]);

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
        deferredPrompt, installApp, isStandalone
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
        deferredPrompt, installApp, isStandalone
    ]);

    if (isAppLoading) {
        return <HomeSkeleton />;
    }

    return (
        <AppContext.Provider value={contextValue}>
            <TimerProvider>
                {children}
            </TimerProvider>
        </AppContext.Provider>
    );
};

// Root Provider Wrapper
export const AppProvider = ({ children }: PropsWithChildren) => {
    return (
        <AuthProvider>
            <AppStateProvider>
                {children}
            </AppStateProvider>
        </AuthProvider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
