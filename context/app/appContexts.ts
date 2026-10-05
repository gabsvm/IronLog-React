// S6: AppContext types, context objects and constants, moved verbatim from
// context/AppContext.tsx (the provider and the consumer hooks stay there).
import React, { createContext } from 'react';
import { AppState, Lang, Theme, ColorTheme, EffectsMode, ResolvedEffects, ExerciseDef, Log, ProgramDay, TutorialState, GlobalTemplate, UserProfile, BeforeInstallPromptEvent, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, CustomFood, DirtySyncSection, SectionSyncMeta } from '../../types';

export const FULL_SYNC_SECTIONS: DirtySyncSection[] = [
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
    'personalTemplates',
];

export interface AppContextType extends Omit<AppState, 'activeSession' | 'activeMeso'> {
    lang: Lang;
    theme: Theme;
    colorTheme: ColorTheme;
    effectsMode: EffectsMode;
    resolvedEffects: ResolvedEffects;
    reducedEffects: boolean;
    setLang: (l: Lang) => void;
    setTheme: (t: Theme) => void;
    setColorTheme: (t: ColorTheme) => void;
    setEffectsMode: (m: EffectsMode) => void;

    setProgram: (val: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => void;
    setExercises: (val: ExerciseDef[] | ((prev: ExerciseDef[]) => ExerciseDef[])) => void;
    setLogs: (val: Log[] | ((prev: Log[]) => Log[])) => void;
    setConfig: (val: Partial<AppState['config']>) => void;
    setRpFeedback: (val: AppState['rpFeedback'] | ((prev: AppState['rpFeedback']) => AppState['rpFeedback'])) => void;
    setHasSeenOnboarding: (val: boolean) => void;
    setGlobalTemplates: (val: GlobalTemplate[] | ((prev: GlobalTemplate[]) => GlobalTemplate[])) => void;
    personalTemplates: GlobalTemplate[];
    setPersonalTemplates: (val: GlobalTemplate[] | ((prev: GlobalTemplate[]) => GlobalTemplate[])) => void;

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
    getLocalLastUpdated: () => number;
    getLocalSectionSyncMeta: () => SectionSyncMeta;

    // PWA Install State
    deferredPrompt: BeforeInstallPromptEvent | null;
    installApp: () => void;
    isStandalone: boolean;
}

export interface SyncMetaContextType {
    localLastUpdated: number;
    localSectionSyncMeta: SectionSyncMeta;
    getLocalLastUpdated: () => number;
    getLocalSectionSyncMeta: () => SectionSyncMeta;
    setLocalLastUpdated: React.Dispatch<React.SetStateAction<number>>;
}

export interface SyncStatusContextType {
    isOnline: boolean;
    syncStatus: {
        pending: number;
        isSyncing: boolean;
        lastSyncedAt: number | null;
    };
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
export const SyncMetaContext = createContext<SyncMetaContextType | undefined>(undefined);
export const SyncStatusContext = createContext<SyncStatusContextType | undefined>(undefined);
export type AppPreferencesContextType = Pick<AppContextType, 'lang' | 'setLang' | 'theme' | 'setTheme' | 'colorTheme' | 'setColorTheme' | 'deferredPrompt' | 'installApp' | 'isStandalone' | 'reducedEffects' | 'effectsMode' | 'setEffectsMode' | 'resolvedEffects'>;
export type AppConfigContextType = Pick<AppContextType, 'config' | 'setConfig'>;
export type TutorialContextType = Pick<AppContextType, 'tutorialProgress' | 'markTutorialSeen' | 'resetTutorials'>;

export const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);
export const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);
export const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const INITIAL_TUTORIAL_STATE: TutorialState = {
    home: false, workout: false, history: false, stats: false, mesoSettings: false, nutrition: false
};
