
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppState, Lang, Theme, ColorTheme, MesoCycle, ActiveSession } from '../types';
import { initialAppState } from '../constants';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { upgradeToPro } from '../utils/subscriptions';

const DEBOUNCE_TIME = 2000; // 2 seconds

interface AppContextType extends AppState {
    lang: Lang;
    setLang: (lang: Lang) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colorTheme: ColorTheme;
    setColorTheme: (color: ColorTheme) => void;
    setInitialState: (data: Partial<AppState>) => void;
    resetState: () => void;
    resetTutorials: () => void;
    isSyncing: boolean;
    lastSyncTime: number | null;
    forceSync: () => Promise<void>;
    setActiveMeso: (meso: MesoCycle | null) => void;
    setActiveSession: (session: ActiveSession | null) => void;
    isAuthModalOpen: boolean; // New state for auth modal
    setIsAuthModalOpen: (isOpen: boolean) => void; // New state setter for auth modal
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isGuest } = useAuth();
    const [state, setState] = useState<AppState>(initialAppState);
    const [lang, setLang] = useState<Lang>('en');
    const [theme, setTheme] = useState<Theme>('dark');
    const [colorTheme, setColorTheme] = useState<ColorTheme>('iron');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Debounce state updates
    useEffect(() => {
        const handler = setTimeout(() => {
            if (user && db) {
                console.log("Syncing data with Firestore...");
                setIsSyncing(true);
                const userRef = doc(db, 'users', user.uid);
                setDoc(userRef, { appState: { ...state, lastUpdated: Date.now() } }, { merge: true })
                    .then(() => {
                        setLastSyncTime(Date.now());
                        console.log("Sync successful!");
                    })
                    .catch(e => console.error("Sync failed", e))
                    .finally(() => setIsSyncing(false));
            } else if (isGuest) {
                localStorage.setItem('guestAppState', JSON.stringify({ ...state, lastUpdated: Date.now() }));
                console.log("Saved state to localStorage for guest.");
            }
        }, DEBOUNCE_TIME);

        return () => clearTimeout(handler);
    }, [state, user, isGuest]);

    // Load data on user change
    useEffect(() => {
        const loadData = async () => {
            if (user && db) {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists() && docSnap.data().appState) {
                    console.log("Loading user data from Firestore.");
                    setState(prev => ({ ...prev, ...docSnap.data().appState }));
                } else {
                     console.log("No existing user data, checking localStorage.");
                     const guestData = localStorage.getItem('guestAppState');
                     if (guestData) {
                        setState(prev => ({ ...prev, ...JSON.parse(guestData) }));
                     } else {
                        setState(initialAppState);
                     }
                }
            } else if (isGuest) {
                const guestData = localStorage.getItem('guestAppState');
                if (guestData) {
                    console.log("Loading guest data from localStorage.");
                    setState(prev => ({ ...prev, ...JSON.parse(guestData) }));
                } else {
                    setState(initialAppState);
                }
            } else {
                setState(initialAppState);
            }
        };
        loadData();
    }, [user, isGuest]);

    // Local settings persistence
    useEffect(() => {
        const savedLang = localStorage.getItem('appLang') as Lang | null;
        if (savedLang) setLang(savedLang);

        const savedTheme = localStorage.getItem('appTheme') as Theme | null;
        const savedColor = localStorage.getItem('appColorTheme') as ColorTheme | null;

        if (savedTheme) setTheme(savedTheme);
        if (savedColor) setColorTheme(savedColor);
    }, []);

    const handleSetLang = (lang: Lang) => {
        setLang(lang);
        localStorage.setItem('appLang', lang);
    };

    const handleSetTheme = (theme: Theme) => {
        setTheme(theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('appTheme', theme);
    };

    const handleSetColorTheme = (color: ColorTheme) => {
        setColorTheme(color);
        localStorage.setItem('appColorTheme', color);
    };

    const setInitialState = (data: Partial<AppState>) => setState(prev => ({ ...prev, ...data }));
    const resetState = () => setState(initialAppState);
    const setActiveMeso = (meso: MesoCycle | null) => setState(prev => ({ ...prev, activeMeso: meso }));
    const setActiveSession = (session: ActiveSession | null) => setState(prev => ({...prev, activeSession: session }));

    const resetTutorials = () => {
        setState(prev => ({ ...prev, tutorialProgress: initialAppState.tutorialProgress }));
    };

    const forceSync = async () => {
        if (!user || !db) {
            console.warn("Cannot sync without user or db connection.");
            return;
        }
        setIsSyncing(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { appState: { ...state, lastUpdated: Date.now() } }, { merge: true });
            setLastSyncTime(Date.now());
            console.log("Manual sync successful!");
        } catch (e) {
            console.error("Manual sync failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const contextValue = useMemo(() => ({
        ...state,
        lang,
        setLang: handleSetLang,
        theme,
        setTheme: handleSetTheme,
        colorTheme,
        setColorTheme: handleSetColorTheme,
        setInitialState,
        resetState,
        resetTutorials,
        isSyncing,
        lastSyncTime,
        forceSync,
        setActiveMeso,
        setActiveSession,
        isAuthModalOpen,
        setIsAuthModalOpen
    }), [state, lang, theme, colorTheme, isSyncing, lastSyncTime, isAuthModalOpen]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within an AppProvider");
    return context;
};
