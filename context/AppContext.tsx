import React, { useContext, useEffect, useRef, useState, PropsWithChildren, useMemo, useCallback } from 'react';
import { AppState, Lang, Theme, ColorTheme, EffectsMode, ResolvedEffects, ExerciseDef, Log, ProgramDay, TutorialState, GlobalTemplate, TemplateFolder, UserProfile, BeforeInstallPromptEvent, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, MeasurementLog, CustomFood, DirtySyncSection, SectionSyncMeta, WeightUnit, PreviousScope, IncompleteSets, RestIncrement, BodyWeightUnit, DistanceUnit, SizeUnit, WeekStart, OneRmFormula, TrainingConfigFields } from '../types';
import { TRAINING_CONFIG_DEFAULTS, TRAINING_CONFIG_KEYS, sanitizeTrainingConfig } from '../utils/strongTraining';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePersistedState } from '../hooks/usePersistedState';
import { TimerProvider } from './TimerContext';
import { HomeSkeleton } from '../components/ui/SkeletonLoader';
import { useAuth } from './AuthContext';
import { useStore } from '../lib/store';
import { isMeaningfullyEmptyLocalState } from '../services/syncHelpers';
import { SyncMetaContextType, SyncStatusContextType, AppContext, SyncMetaContext, SyncStatusContext, AppPreferencesContext, AppConfigContext, TutorialContext, INITIAL_TUTORIAL_STATE } from './app/appContexts';
import { useDefaultsBootstrap } from './app/useDefaultsBootstrap';
import { useAppBootstrapEffects } from './app/useAppBootstrapEffects';
import { useLanguage } from './app/useLanguage';
import type { DirtyTrackingContext } from './app/useDirtySection';
import { useInitialCloudDownload } from './app/useInitialCloudDownload';
import { useCloudUploads } from './app/useCloudUploads';
import { useThemeAndWakeLock } from './app/useThemeAndWakeLock';

if (typeof window !== 'undefined') {
    (window as any).__ironlog_isMeaningfullyEmptyLocalState = isMeaningfullyEmptyLocalState;
}

// S6: types/contexts moved to context/app/appContexts; re-exported for existing importers.
export type { SyncMetaContextType, SyncStatusContextType } from './app/appContexts';

export const AppProvider = ({ children }: PropsWithChildren) => {
    const { user } = useAuth();

    // --- Synchronous Config ---
    // S7: language preference + lazy dictionary loading.
    const { lang, setLang } = useLanguage();

    const [theme, setTheme] = useLocalStorage<Theme>('il_theme_v1', 'dark');
    const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('il_color_theme_v1', 'royal');

    // FIXED: Default to FALSE for PRO features
    const [showRIR, setShowRIR] = useLocalStorage('il_cfg_rir', false);
    const [rpEnabled, setRpEnabled] = useLocalStorage('il_cfg_rp', false);

    const [rpTargetRIR, setRpTargetRIR] = useLocalStorage('il_cfg_rp_rir', 2);
    const [keepScreenOn, setKeepScreenOn] = useLocalStorage('il_cfg_screen', false);
    const [weightUnit, setWeightUnit] = useLocalStorage<WeightUnit>('il_cfg_weight_unit', 'kg');
    const [restTimerDisplay, setRestTimerDisplay] = useLocalStorage<'compact' | 'expanded'>('il_cfg_rest_display', 'compact');
    // Strong-parity training prefs: same keys/encoding as TRAINING_CONFIG_KEYS,
    // so values stored by earlier versions are picked up verbatim.
    const [previousScope, setPreviousScope] = useLocalStorage<PreviousScope>(TRAINING_CONFIG_KEYS.previousScope, TRAINING_CONFIG_DEFAULTS.previousScope);
    const [incompleteSets, setIncompleteSets] = useLocalStorage<IncompleteSets>(TRAINING_CONFIG_KEYS.incompleteSets, TRAINING_CONFIG_DEFAULTS.incompleteSets);
    const [defaultSets, setDefaultSets] = useLocalStorage<number>(TRAINING_CONFIG_KEYS.defaultSets, TRAINING_CONFIG_DEFAULTS.defaultSets);
    const [defaultRestSeconds, setDefaultRestSeconds] = useLocalStorage<number>(TRAINING_CONFIG_KEYS.defaultRestSeconds, TRAINING_CONFIG_DEFAULTS.defaultRestSeconds);
    const [warmupRestSeconds, setWarmupRestSeconds] = useLocalStorage<number>(TRAINING_CONFIG_KEYS.warmupRestSeconds, TRAINING_CONFIG_DEFAULTS.warmupRestSeconds);
    const [restIncrementSeconds, setRestIncrementSeconds] = useLocalStorage<RestIncrement>(TRAINING_CONFIG_KEYS.restIncrementSeconds, TRAINING_CONFIG_DEFAULTS.restIncrementSeconds);
    const [restSound, setRestSound] = useLocalStorage<boolean>(TRAINING_CONFIG_KEYS.restSound, TRAINING_CONFIG_DEFAULTS.restSound);
    const [restVibrate, setRestVibrate] = useLocalStorage<boolean>(TRAINING_CONFIG_KEYS.restVibrate, TRAINING_CONFIG_DEFAULTS.restVibrate);
    const [autoStartRest, setAutoStartRest] = useLocalStorage<boolean>(TRAINING_CONFIG_KEYS.autoStartRest, TRAINING_CONFIG_DEFAULTS.autoStartRest);
    const [bodyWeightUnit, setBodyWeightUnit] = useLocalStorage<BodyWeightUnit>(TRAINING_CONFIG_KEYS.bodyWeightUnit, TRAINING_CONFIG_DEFAULTS.bodyWeightUnit);
    const [distanceUnit, setDistanceUnit] = useLocalStorage<DistanceUnit>(TRAINING_CONFIG_KEYS.distanceUnit, TRAINING_CONFIG_DEFAULTS.distanceUnit);
    const [sizeUnit, setSizeUnit] = useLocalStorage<SizeUnit>(TRAINING_CONFIG_KEYS.sizeUnit, TRAINING_CONFIG_DEFAULTS.sizeUnit);
    const [weekStart, setWeekStart] = useLocalStorage<WeekStart>(TRAINING_CONFIG_KEYS.weekStart, TRAINING_CONFIG_DEFAULTS.weekStart);
    const [oneRmFormula, setOneRmFormula] = useLocalStorage<OneRmFormula>(TRAINING_CONFIG_KEYS.oneRmFormula, TRAINING_CONFIG_DEFAULTS.oneRmFormula);
    const [plateBarKg, setPlateBarKg] = useLocalStorage<number>(TRAINING_CONFIG_KEYS.plateBarKg, TRAINING_CONFIG_DEFAULTS.plateBarKg);
    const [platePlatesKg, setPlatePlatesKg] = useLocalStorage<number[]>(TRAINING_CONFIG_KEYS.platePlatesKg, TRAINING_CONFIG_DEFAULTS.platePlatesKg);
    const [tutorialProgress, setTutorialProgress] = useLocalStorage<TutorialState>('il_tutorial_v2', INITIAL_TUTORIAL_STATE);

    // --- Heavy Data (IndexedDB) ---
    const [program, setProgram, programLoading] = usePersistedState<ProgramDay[]>('il_prog_v16', [], 1000);
    const [exercises, setExercises, exLoading] = usePersistedState<ExerciseDef[]>('il_ex_v16', [], 1000);
    const [logs, setLogs, logsLoading] = usePersistedState<Log[]>('il_logs_v16', [], 1000);

    const DEFAULT_NUTRITION_GOAL: NutritionGoal = { calories: 2500, protein: 180, carbs: 280, fat: 70 };
    const [nutritionLogs, setNutritionLogs] = usePersistedState<NutritionLog[]>('il_nutrition_v1', [], 1000);
    const [cardioSessions, setCardioSessions] = usePersistedState<CardioSession[]>('il_cardio_v1', [], 1000);
    const [nutritionGoal, setNutritionGoal] = usePersistedState<NutritionGoal>('il_nut_goal_v1', DEFAULT_NUTRITION_GOAL, 500);

    // NEW: User Profile Persistence
    const [userProfile, setUserProfile, profileLoading] = usePersistedState<UserProfile>('il_profile_v1', {
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium'
    }, 1000);

    const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
    const [personalTemplates, setPersonalTemplates] = usePersistedState<GlobalTemplate[]>('il_personal_templates_v1', [], 1000);
    const [templateFolders, setTemplateFolders] = usePersistedState<TemplateFolder[]>('il_template_folders_v1', [], 1000);
    const [defaultLibrary, setDefaultLibrary] = useState<ExerciseDef[] | null>(null);
    const [defaultTemplate, setDefaultTemplate] = useState<ProgramDay[] | null>(null);
    const [baseTemplates, setBaseTemplates] = useState<GlobalTemplate[] | null>(null);
    const [defaultsLoading, setDefaultsLoading] = useState(true);
    const [rpFeedback, setRpFeedback, fbLoading] = usePersistedState<AppState['rpFeedback']>('il_rp_fb_v1', {}, 1000);
    const [hasSeenOnboarding, setHasSeenOnboarding, onboardingLoading] = usePersistedState<boolean>('il_onboarded_v2', false, 1000);
    const [localLastUpdated, setLocalLastUpdated] = usePersistedState<number>('il_last_sync_ts', 0, 1000);
    const [localSectionSyncMeta, setLocalSectionSyncMeta] = usePersistedState<SectionSyncMeta>('il_section_sync_meta_v1', {}, 1000);

    const localLastUpdatedRef = useRef(localLastUpdated);
    localLastUpdatedRef.current = localLastUpdated;
    const localSectionSyncMetaRef = useRef(localSectionSyncMeta);
    localSectionSyncMetaRef.current = localSectionSyncMeta;

    const getLocalLastUpdated = useCallback(() => localLastUpdatedRef.current, []);
    const getLocalSectionSyncMeta = useCallback(() => localSectionSyncMetaRef.current, []);

    // NEW: Nutrition & Body Tracking Persistence
    const [bodyLogs, setBodyLogs] = usePersistedState<BodyLog[]>('il_body_v1', [], 1000);
    const [measurementLogs, setMeasurementLogs] = usePersistedState<MeasurementLog[]>('il_measurements_v1', [], 1000);
    const [macroGoals, setMacroGoals] = usePersistedState<MacroGoals | null>('il_macros_v1', null, 500);
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
    const [effectsMode, setEffectsMode] = useLocalStorage<EffectsMode>('il_effects_mode', 'system');
    const [resolvedEffects, setResolvedEffects] = useState<ResolvedEffects>('balanced');
    const [reducedEffects, setReducedEffects] = useState(false);

    const isStoreLoading = useStore(state => state.isStoreLoading);
    const activeMeso = useStore(state => state.activeMeso);

    const needsDefaultBootstrap =
        defaultsLoading &&
        !programLoading &&
        !exLoading &&
        (program.length === 0 || exercises.length === 0 || globalTemplates.length === 0);

    // Keep the training core atomic at launch, but do not hold the first
    // interactive Home render behind data that is only used by Nutrition.
    // Those stores still hydrate safely in the background before their lazy
    // view is opened; this only removes an unnecessary global loading gate.
    const isAppLoading =
        isStoreLoading ||
        programLoading ||
        exLoading ||
        logsLoading ||
        fbLoading ||
        onboardingLoading ||
        profileLoading ||
        needsDefaultBootstrap;
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const dirtyInitRef = useRef(new Set<DirtySyncSection>());
    const suppressDirtyRef = useRef(false);
    const foregroundFlushRef = useRef(false);

    // T4: context for useDirtySection (dirty tracking per synced section).
    const dirtyTracking: DirtyTrackingContext = {
        isAppLoading, hasCheckedSync, suppressDirtyRef, dirtyInitRef, setLocalSectionSyncMeta,
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

    // S6: bootstrap effects, cloud sync and theme/wake-lock live in context/app/.
    useDefaultsBootstrap({
        program,
        setProgram,
        programLoading,
        exercises,
        setExercises,
        exLoading,
        setGlobalTemplates,
        defaultLibrary,
        setDefaultLibrary,
        defaultTemplate,
        setDefaultTemplate,
        setBaseTemplates,
        setDefaultsLoading,
    });

    const { installApp } = useAppBootstrapEffects({
        user,
        showRIR,
        rpEnabled,
        rpTargetRIR,
        keepScreenOn,
        weightUnit,
        restTimerDisplay,
        previousScope,
        incompleteSets,
        defaultSets,
        defaultRestSeconds,
        warmupRestSeconds,
        restIncrementSeconds,
        restSound,
        restVibrate,
        autoStartRest,
        bodyWeightUnit,
        distanceUnit,
        sizeUnit,
        weekStart,
        oneRmFormula,
        plateBarKg,
        platePlatesKg,
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
        templateFolders,
        baseTemplates,
        defaultsLoading,
        rpFeedback,
        bodyLogs,
        measurementLogs,
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
        dirtyTracking,
    });

    useInitialCloudDownload({
        user,
        setShowRIR,
        setRpEnabled,
        setRpTargetRIR,
        setKeepScreenOn,
        setWeightUnit,
        setPreviousScope,
        setIncompleteSets,
        setDefaultSets,
        setDefaultRestSeconds,
        setWarmupRestSeconds,
        setRestIncrementSeconds,
        setRestSound,
        setRestVibrate,
        setAutoStartRest,
        setBodyWeightUnit,
        setDistanceUnit,
        setSizeUnit,
        setWeekStart,
        setOneRmFormula,
        setPlateBarKg,
        setPlatePlatesKg,
        setProgram,
        exercises,
        setExercises,
        logs,
        setLogs,
        nutritionLogs,
        setNutritionLogs,
        cardioSessions,
        setCardioSessions,
        setNutritionGoal,
        userProfile,
        setUserProfile,
        personalTemplates,
        templateFolders,
        setTemplateFolders,
        setPersonalTemplates,
        setRpFeedback,
        setHasSeenOnboarding,
        setLocalLastUpdated,
        setLocalSectionSyncMeta,
        localLastUpdatedRef,
        localSectionSyncMetaRef,
        bodyLogs,
        setBodyLogs,
        measurementLogs,
        setMeasurementLogs,
        setMacroGoals,
        customFoods,
        setCustomFoods,
        pendingCloudData,
        setPendingCloudData,
        setPendingCloudSections,
        hasCheckedSync,
        setHasCheckedSync,
        isOnline,
        activeMeso,
        isAppLoading,
        withDirtyTrackingSuppressed,
        setRestTimerDisplay,
    });

    const { confirmCloudSync, cancelCloudSync } = useCloudUploads({
        user,
        showRIR,
        setShowRIR,
        rpEnabled,
        setRpEnabled,
        rpTargetRIR,
        setRpTargetRIR,
        keepScreenOn,
        setKeepScreenOn,
        weightUnit,
        previousScope,
        incompleteSets,
        defaultSets,
        defaultRestSeconds,
        warmupRestSeconds,
        restIncrementSeconds,
        restSound,
        restVibrate,
        autoStartRest,
        bodyWeightUnit,
        distanceUnit,
        sizeUnit,
        weekStart,
        oneRmFormula,
        plateBarKg,
        platePlatesKg,
        setWeightUnit,
        setPreviousScope,
        setIncompleteSets,
        setDefaultSets,
        setDefaultRestSeconds,
        setWarmupRestSeconds,
        setRestIncrementSeconds,
        setRestSound,
        setRestVibrate,
        setAutoStartRest,
        setBodyWeightUnit,
        setDistanceUnit,
        setSizeUnit,
        setWeekStart,
        setOneRmFormula,
        setPlateBarKg,
        setPlatePlatesKg,
        program,
        setProgram,
        exercises,
        setExercises,
        logs,
        setLogs,
        nutritionLogs,
        setNutritionLogs,
        cardioSessions,
        setCardioSessions,
        nutritionGoal,
        setNutritionGoal,
        userProfile,
        setUserProfile,
        personalTemplates,
        setPersonalTemplates,
        templateFolders,
        setTemplateFolders,
        rpFeedback,
        setRpFeedback,
        setHasSeenOnboarding,
        setLocalLastUpdated,
        setLocalSectionSyncMeta,
        bodyLogs,
        setBodyLogs,
        measurementLogs,
        setMeasurementLogs,
        macroGoals,
        setMacroGoals,
        customFoods,
        setCustomFoods,
        pendingCloudData,
        setPendingCloudData,
        pendingCloudSections,
        setPendingCloudSections,
        hasCheckedSync,
        setIsOnline,
        activeMeso,
        isAppLoading,
        withDirtyTrackingSuppressed,
        restTimerDisplay,
        setRestTimerDisplay,
    });

    useThemeAndWakeLock({
        lang,
        theme,
        colorTheme,
        keepScreenOn,
        wakeLockRef,
    });

    const setConfig = useCallback((newConfig: Partial<AppState['config']>) => {
        if (newConfig.showRIR !== undefined) setShowRIR(newConfig.showRIR);
        if (newConfig.rpEnabled !== undefined) setRpEnabled(newConfig.rpEnabled);
        if (newConfig.rpTargetRIR !== undefined) setRpTargetRIR(newConfig.rpTargetRIR);
        if (newConfig.keepScreenOn !== undefined) setKeepScreenOn(newConfig.keepScreenOn);
        const rawDisplay = newConfig.restTimerDisplay as string | undefined;
        if (rawDisplay === 'compact' || rawDisplay === 'expanded') {
            setRestTimerDisplay(rawDisplay);
        } else if (rawDisplay === 'Overlay' || rawDisplay === 'Banner') {
            // Legacy pre-compact/expanded values: both rendered as the compact pill.
            setRestTimerDisplay('compact');
        }
        if (newConfig.weightUnit === 'kg' || newConfig.weightUnit === 'lb') setWeightUnit(newConfig.weightUnit);
        const p = newConfig as Partial<TrainingConfigFields>;
        if (
            p.previousScope !== undefined || p.incompleteSets !== undefined || p.defaultSets !== undefined ||
            p.defaultRestSeconds !== undefined || p.warmupRestSeconds !== undefined || p.restIncrementSeconds !== undefined ||
            p.restSound !== undefined || p.restVibrate !== undefined || p.autoStartRest !== undefined ||
            p.bodyWeightUnit !== undefined || p.distanceUnit !== undefined || p.sizeUnit !== undefined ||
            p.weekStart !== undefined || p.oneRmFormula !== undefined || p.plateBarKg !== undefined || p.platePlatesKg !== undefined
        ) {
            // Single sanitized write: invalid values fall back to defaults (cross-device consistency).
            const next = sanitizeTrainingConfig({
                previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds,
                restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit,
                distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg,
                ...p,
            });
            setPreviousScope(next.previousScope);
            setIncompleteSets(next.incompleteSets);
            setDefaultSets(next.defaultSets);
            setDefaultRestSeconds(next.defaultRestSeconds);
            setWarmupRestSeconds(next.warmupRestSeconds);
            setRestIncrementSeconds(next.restIncrementSeconds);
            setRestSound(next.restSound);
            setRestVibrate(next.restVibrate);
            setAutoStartRest(next.autoStartRest);
            setBodyWeightUnit(next.bodyWeightUnit);
            setDistanceUnit(next.distanceUnit);
            setSizeUnit(next.sizeUnit);
            setWeekStart(next.weekStart);
            setOneRmFormula(next.oneRmFormula);
            setPlateBarKg(next.plateBarKg);
            setPlatePlatesKg(next.platePlatesKg);
        }
    }, [setShowRIR, setRpEnabled, setRpTargetRIR, setKeepScreenOn, setRestTimerDisplay, setWeightUnit, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg, setPreviousScope, setIncompleteSets, setDefaultSets, setDefaultRestSeconds, setWarmupRestSeconds, setRestIncrementSeconds, setRestSound, setRestVibrate, setAutoStartRest, setBodyWeightUnit, setDistanceUnit, setSizeUnit, setWeekStart, setOneRmFormula, setPlateBarKg, setPlatePlatesKg]);

    const markTutorialSeen = useCallback((section: keyof TutorialState) => setTutorialProgress(prev => ({ ...prev, [section]: true })), [setTutorialProgress]);
    const resetTutorials = useCallback(() => setTutorialProgress(INITIAL_TUTORIAL_STATE), [setTutorialProgress]);


    const configState: AppState['config'] = useMemo(() => ({
        showRIR,
        rpEnabled,
        rpTargetRIR,
        keepScreenOn,
        restTimerDisplay,
        weightUnit,
        previousScope,
        incompleteSets,
        defaultSets,
        defaultRestSeconds,
        warmupRestSeconds,
        restIncrementSeconds,
        restSound,
        restVibrate,
        autoStartRest,
        bodyWeightUnit,
        distanceUnit,
        sizeUnit,
        weekStart,
        oneRmFormula,
        plateBarKg,
        platePlatesKg,
    }), [showRIR, rpEnabled, rpTargetRIR, keepScreenOn, restTimerDisplay, weightUnit, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg]);
    const preferencesValue = useMemo(() => ({
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        effectsMode, setEffectsMode, resolvedEffects,
        deferredPrompt, installApp, isStandalone, reducedEffects,
    }), [lang, setLang, theme, setTheme, colorTheme, setColorTheme, effectsMode, setEffectsMode, resolvedEffects, deferredPrompt, installApp, isStandalone, reducedEffects]);
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
        effectsMode, setEffectsMode, resolvedEffects,
        reducedEffects,
        program, setProgram,
        exercises, setExercises,
        logs, setLogs,
        config: configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync, getLocalLastUpdated, getLocalSectionSyncMeta,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        personalTemplates, setPersonalTemplates,
        templateFolders, setTemplateFolders,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal,
        bodyLogs, setBodyLogs,
        measurementLogs, setMeasurementLogs,
        macroGoals, setMacroGoals,
        customFoods, setCustomFoods,
    }), [
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        effectsMode, setEffectsMode, resolvedEffects,
        reducedEffects,
        program, setProgram,
        exercises, setExercises,
        logs, setLogs,
        configState, setConfig,
        rpFeedback, setRpFeedback,
        hasSeenOnboarding, setHasSeenOnboarding,
        tutorialProgress, markTutorialSeen, resetTutorials,
        isAppLoading,
        pendingCloudData, pendingCloudSections, confirmCloudSync, cancelCloudSync, getLocalLastUpdated, getLocalSectionSyncMeta,
        deferredPrompt, installApp, isStandalone,
        globalTemplates, setGlobalTemplates,
        personalTemplates, setPersonalTemplates,
        templateFolders, setTemplateFolders,
        userProfile, setUserProfile,
        nutritionLogs, setNutritionLogs,
        cardioSessions, setCardioSessions,
        nutritionGoal, setNutritionGoal,
        bodyLogs, setBodyLogs,
        measurementLogs, setMeasurementLogs,
        macroGoals, setMacroGoals,
        customFoods, setCustomFoods,
    ]);

    const syncMetaValue = useMemo(() => ({
        localLastUpdated,
        localSectionSyncMeta,
        getLocalLastUpdated,
        getLocalSectionSyncMeta,
        setLocalLastUpdated,
    }), [localLastUpdated, localSectionSyncMeta, getLocalLastUpdated, getLocalSectionSyncMeta, setLocalLastUpdated]);

    const syncStatusValue = useMemo(() => ({
        isOnline,
        syncStatus,
    }), [isOnline, syncStatus]);

    if (isAppLoading) return <HomeSkeleton />;

    return (
        <AppContext.Provider value={contextValue}>
            <SyncMetaContext.Provider value={syncMetaValue}>
                <SyncStatusContext.Provider value={syncStatusValue}>
                    <AppPreferencesContext.Provider value={preferencesValue}>
                        <AppConfigContext.Provider value={configValue}>
                            <TutorialContext.Provider value={tutorialValue}>
                                <TimerProvider lang={lang} soundEnabled={configState.restSound} vibrateEnabled={configState.restVibrate}>
                                    {children}
                                </TimerProvider>
                            </TutorialContext.Provider>
                        </AppConfigContext.Provider>
                    </AppPreferencesContext.Provider>
                </SyncStatusContext.Provider>
            </SyncMetaContext.Provider>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

export const useSyncMeta = () => {
    const context = useContext(SyncMetaContext);
    if (!context) throw new Error('useSyncMeta must be used within an AppProvider');
    return context;
};

export const useSyncStatus = () => {
    const context = useContext(SyncStatusContext);
    if (!context) throw new Error('useSyncStatus must be used within an AppProvider');
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
