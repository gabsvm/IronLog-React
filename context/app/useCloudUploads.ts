// S6: online flush, session/state upload debounces and cloud-merge confirm/cancel, moved verbatim from context/AppContext.tsx.
import { useEffect, useCallback } from 'react';
import { AppState, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, GlobalTemplate, TemplateFolder, UserProfile, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, MeasurementLog, CustomFood, DirtySyncSection, SectionSyncMeta, WeightUnit, PreviousScope, IncompleteSets, RestIncrement, BodyWeightUnit, DistanceUnit, SizeUnit, WeekStart, OneRmFormula, TrainingConfigFields } from '../../types';
import { sanitizeTrainingConfig } from '../../utils/strongTraining';
import { syncService } from '../../services/syncService';
import { useStore } from '../../lib/store';
import { dirtySyncState } from '../../services/dirtySyncState';
import type { Dispatch, SetStateAction } from 'react';
import type { FeedbackEntry } from '../../types';
import type { User } from 'firebase/auth';

export interface UseCloudUploadsDeps {
    user: User;
    showRIR: boolean;
    setShowRIR: (value: boolean | ((val: boolean) => boolean)) => void;
    rpEnabled: boolean;
    setRpEnabled: (value: boolean | ((val: boolean) => boolean)) => void;
    rpTargetRIR: number;
    setRpTargetRIR: (value: number | ((val: number) => number)) => void;
    keepScreenOn: boolean;
    setKeepScreenOn: (value: boolean | ((val: boolean) => boolean)) => void;
    weightUnit: WeightUnit;
    previousScope: PreviousScope;
    incompleteSets: IncompleteSets;
    defaultSets: number;
    defaultRestSeconds: number;
    warmupRestSeconds: number;
    restIncrementSeconds: RestIncrement;
    restSound: boolean;
    restVibrate: boolean;
    autoStartRest: boolean;
    bodyWeightUnit: BodyWeightUnit;
    distanceUnit: DistanceUnit;
    sizeUnit: SizeUnit;
    weekStart: WeekStart;
    oneRmFormula: OneRmFormula;
    plateBarKg: number;
    platePlatesKg: number[];
    setWeightUnit: (value: WeightUnit | ((val: WeightUnit) => WeightUnit)) => void;
    setPreviousScope: (value: PreviousScope | ((val: PreviousScope) => PreviousScope)) => void;
    setIncompleteSets: (value: IncompleteSets | ((val: IncompleteSets) => IncompleteSets)) => void;
    setDefaultSets: (value: number | ((val: number) => number)) => void;
    setDefaultRestSeconds: (value: number | ((val: number) => number)) => void;
    setWarmupRestSeconds: (value: number | ((val: number) => number)) => void;
    setRestIncrementSeconds: (value: RestIncrement | ((val: RestIncrement) => RestIncrement)) => void;
    setRestSound: (value: boolean | ((val: boolean) => boolean)) => void;
    setRestVibrate: (value: boolean | ((val: boolean) => boolean)) => void;
    setAutoStartRest: (value: boolean | ((val: boolean) => boolean)) => void;
    setBodyWeightUnit: (value: BodyWeightUnit | ((val: BodyWeightUnit) => BodyWeightUnit)) => void;
    setDistanceUnit: (value: DistanceUnit | ((val: DistanceUnit) => DistanceUnit)) => void;
    setSizeUnit: (value: SizeUnit | ((val: SizeUnit) => SizeUnit)) => void;
    setWeekStart: (value: WeekStart | ((val: WeekStart) => WeekStart)) => void;
    setOneRmFormula: (value: OneRmFormula | ((val: OneRmFormula) => OneRmFormula)) => void;
    setPlateBarKg: (value: number | ((val: number) => number)) => void;
    setPlatePlatesKg: (value: number[] | ((val: number[]) => number[])) => void;
    program: ProgramDay[];
    setProgram: (value: ProgramDay[] | ((val: ProgramDay[]) => ProgramDay[])) => void;
    exercises: ExerciseDef[];
    setExercises: (value: ExerciseDef[] | ((val: ExerciseDef[]) => ExerciseDef[])) => void;
    logs: Log[];
    setLogs: (value: Log[] | ((val: Log[]) => Log[])) => void;
    nutritionLogs: NutritionLog[];
    setNutritionLogs: (value: NutritionLog[] | ((val: NutritionLog[]) => NutritionLog[])) => void;
    cardioSessions: CardioSession[];
    setCardioSessions: (value: CardioSession[] | ((val: CardioSession[]) => CardioSession[])) => void;
    nutritionGoal: NutritionGoal;
    setNutritionGoal: (value: NutritionGoal | ((val: NutritionGoal) => NutritionGoal)) => void;
    userProfile: UserProfile;
    setUserProfile: (value: UserProfile | ((val: UserProfile) => UserProfile)) => void;
    personalTemplates: GlobalTemplate[];
    templateFolders: TemplateFolder[];
    setTemplateFolders: (value: TemplateFolder[] | ((val: TemplateFolder[]) => TemplateFolder[])) => void;
    setPersonalTemplates: (value: GlobalTemplate[] | ((val: GlobalTemplate[]) => GlobalTemplate[])) => void;
    rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
    setRpFeedback: (value: Record<string, Record<string, Record<string, FeedbackEntry>>> | ((val: Record<string, Record<string, Record<string, FeedbackEntry>>>) => Record<string, Record<string, Record<string, FeedbackEntry>>>)) => void;
    setHasSeenOnboarding: (value: boolean | ((val: boolean) => boolean)) => void;
    setLocalLastUpdated: (value: number | ((val: number) => number)) => void;
    setLocalSectionSyncMeta: (value: Partial<Record<DirtySyncSection, number>> | ((val: Partial<Record<DirtySyncSection, number>>) => Partial<Record<DirtySyncSection, number>>)) => void;
    bodyLogs: BodyLog[];
    setBodyLogs: (value: BodyLog[] | ((val: BodyLog[]) => BodyLog[])) => void;
    measurementLogs: MeasurementLog[];
    setMeasurementLogs: (value: MeasurementLog[] | ((val: MeasurementLog[]) => MeasurementLog[])) => void;
    macroGoals: MacroGoals;
    setMacroGoals: (value: MacroGoals | ((val: MacroGoals) => MacroGoals)) => void;
    customFoods: CustomFood[];
    setCustomFoods: (value: CustomFood[] | ((val: CustomFood[]) => CustomFood[])) => void;
    pendingCloudData: Partial<AppState>;
    setPendingCloudData: Dispatch<SetStateAction<Partial<AppState>>>;
    pendingCloudSections: DirtySyncSection[];
    setPendingCloudSections: Dispatch<SetStateAction<DirtySyncSection[]>>;
    hasCheckedSync: boolean;
    setIsOnline: Dispatch<SetStateAction<boolean>>;
    activeSession?: ActiveSession;
    activeMeso: MesoCycle;
    isAppLoading: boolean;
    withDirtyTrackingSuppressed: (callback: () => void | Promise<void>) => Promise<void>;
    restTimerDisplay?: 'compact' | 'expanded';
    setRestTimerDisplay?: (value: 'compact' | 'expanded' | ((val: 'compact' | 'expanded') => 'compact' | 'expanded')) => void;
}

/** S6: online flush, session/state upload debounces and cloud-merge confirm/cancel (moved verbatim from AppProvider; same hook order). */
export const useCloudUploads = ({
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
    templateFolders,
    setTemplateFolders,
    setPersonalTemplates,
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
    activeSession: _activeSession,
    activeMeso,
    isAppLoading,
    withDirtyTrackingSuppressed,
    restTimerDisplay,
    setRestTimerDisplay,
}: UseCloudUploadsDeps) => {
    // --- SYNC LOGIC ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Cloud sync is free for every signed-in user (open source, no PRO tier).
            if (user) {
                void (async () => {
                    const dirtySections = await dirtySyncState.list();
                    await syncService.flushQueue();
                    if (dirtySections.length === 0) return;

                    const now = Date.now();
                    setLocalLastUpdated(now);
                    await syncService.uploadState(user.uid, {
                        program, activeMeso, exercises, logs,
                        config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, restTimerDisplay, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg },
                        rpFeedback,
                        userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, measurementLogs, macroGoals, customFoods, personalTemplates, templateFolders,
                        email: user.email || null,
                        lastUpdated: now,
                    }, dirtySections);
                })();
            }
        };

        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [user, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, restTimerDisplay, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg, rpFeedback, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, measurementLogs, macroGoals, customFoods, personalTemplates, templateFolders, setLocalLastUpdated]);

    // ── Debounce A: session-only write (fast, lightweight) ─────────────────────
    // Watches state.activeSession via useStore.subscribe with a 5000ms debounce
    // so active workout edits don't trigger AppProvider re-renders.
    useEffect(() => {
        if (!user || isAppLoading || !hasCheckedSync || !!pendingCloudData) return;

        let timer: ReturnType<typeof setTimeout> | null = null;
        let lastSession = useStore.getState().activeSession;

        const unsubscribe = useStore.subscribe((state) => {
            const nextSession = state.activeSession;
            if (nextSession === lastSession) return;
            lastSession = nextSession;

            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                const now = Date.now();
                setLocalLastUpdated(now);
                void syncService.flushQueue();
                syncService.uploadSessionOnly(user.uid, nextSession, now);
            }, 5000);
        });

        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };
    }, [user, isAppLoading, hasCheckedSync, pendingCloudData, setLocalLastUpdated]);

    // ── Debounce B: full-state write (slower, only when program/data changes) ──
    // Excludes activeSession (handled above). Fires only when program, exercises,
    // logs, nutrition or config change — much less frequent than session updates.
    // Uses 10s debounce: these changes are deliberate edits, not keystrokes.
    useEffect(() => {
        if (!user || isAppLoading || !hasCheckedSync || !!pendingCloudData) return;
        const timer = setTimeout(() => {
            void (async () => {
                const dirtySections = await dirtySyncState.list();
                if (dirtySections.length === 0) return;

                const now = Date.now();
                setLocalLastUpdated(now);
                void syncService.flushQueue();
                syncService.uploadState(user.uid, {
                    program, activeMeso, exercises, logs,
                    config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, restTimerDisplay, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg },
                    rpFeedback,
                    userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, measurementLogs, macroGoals, customFoods, personalTemplates, templateFolders,
                    email: user.email || null,
                    lastUpdated: now,
                }, dirtySections);
            })();
        }, 10000);
        return () => clearTimeout(timer);
    }, [user, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, restTimerDisplay, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg, rpFeedback, isAppLoading, hasCheckedSync, pendingCloudData, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, measurementLogs, macroGoals, customFoods, personalTemplates, templateFolders, setLocalLastUpdated]);

    const confirmCloudSync = useCallback(() => {
        if (!pendingCloudData) return;

        console.log("Applying newer cloud sections...");
        void withDirtyTrackingSuppressed(async () => {
            const cloudSyncMeta = ((pendingCloudData as Partial<AppState> & { syncMeta?: SectionSyncMeta }).syncMeta) || {};

            if (pendingCloudSections.includes('program') && pendingCloudData.program) setProgram(pendingCloudData.program);
            if (pendingCloudSections.includes('activeMeso') && pendingCloudData.activeMeso) useStore.getState().setActiveMeso(pendingCloudData.activeMeso);
            if (pendingCloudSections.includes('exercises') && pendingCloudData.exercises) setExercises(pendingCloudData.exercises);
            if (pendingCloudSections.includes('logs') && pendingCloudData.logs) {
                setLogs(pendingCloudData.logs);
                if (user) await syncService.adoptCloudLogs(user.uid, pendingCloudData.logs);
            }
            if (pendingCloudSections.includes('rpFeedback') && pendingCloudData.rpFeedback) setRpFeedback(pendingCloudData.rpFeedback);

            if (pendingCloudSections.includes('config') && pendingCloudData.config) {
                if (pendingCloudData.config.showRIR !== undefined) setShowRIR(pendingCloudData.config.showRIR);
                if (pendingCloudData.config.rpEnabled !== undefined) setRpEnabled(pendingCloudData.config.rpEnabled);
                if (pendingCloudData.config.rpTargetRIR !== undefined) setRpTargetRIR(pendingCloudData.config.rpTargetRIR);
                if (pendingCloudData.config.keepScreenOn !== undefined) setKeepScreenOn(pendingCloudData.config.keepScreenOn);
                if (pendingCloudData.config.weightUnit === 'kg' || pendingCloudData.config.weightUnit === 'lb') setWeightUnit(pendingCloudData.config.weightUnit);
                const rawDisplay = pendingCloudData.config.restTimerDisplay as string | undefined;
                if (setRestTimerDisplay && (rawDisplay === 'compact' || rawDisplay === 'expanded')) {
                    setRestTimerDisplay(rawDisplay);
                } else if (setRestTimerDisplay && (rawDisplay === 'Overlay' || rawDisplay === 'Banner')) {
                    // Legacy pre-compact/expanded values: both rendered as the compact pill.
                    setRestTimerDisplay('compact');
                }
                // Sanitized merge over local values: unknown/invalid cloud values fall back to defaults.
                const currentTraining = { previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg };
                const cloudTraining = pendingCloudData.config as Partial<TrainingConfigFields>;
                const hasTraining = (Object.keys(currentTraining) as (keyof TrainingConfigFields)[]).some((k) => cloudTraining[k] !== undefined);
                if (hasTraining) {
                    const merged = sanitizeTrainingConfig({ ...currentTraining, ...cloudTraining });
                    setPreviousScope(merged.previousScope);
                    setIncompleteSets(merged.incompleteSets);
                    setDefaultSets(merged.defaultSets);
                    setDefaultRestSeconds(merged.defaultRestSeconds);
                    setWarmupRestSeconds(merged.warmupRestSeconds);
                    setRestIncrementSeconds(merged.restIncrementSeconds);
                    setRestSound(merged.restSound);
                    setRestVibrate(merged.restVibrate);
                    setAutoStartRest(merged.autoStartRest);
                    setBodyWeightUnit(merged.bodyWeightUnit);
                    setDistanceUnit(merged.distanceUnit);
                    setSizeUnit(merged.sizeUnit);
                    setWeekStart(merged.weekStart);
                    setOneRmFormula(merged.oneRmFormula);
                    setPlateBarKg(merged.plateBarKg);
                    setPlatePlatesKg(merged.platePlatesKg);
                }
            }

            if (pendingCloudSections.includes('userProfile') && pendingCloudData.userProfile) setUserProfile(pendingCloudData.userProfile);
            if (pendingCloudSections.includes('nutritionLogs') && pendingCloudData.nutritionLogs) setNutritionLogs(pendingCloudData.nutritionLogs);
            if (pendingCloudSections.includes('cardioSessions') && pendingCloudData.cardioSessions) setCardioSessions(pendingCloudData.cardioSessions);
            if (pendingCloudSections.includes('nutritionGoal') && pendingCloudData.nutritionGoal) setNutritionGoal(pendingCloudData.nutritionGoal);
            if (pendingCloudSections.includes('bodyLogs') && pendingCloudData.bodyLogs) setBodyLogs(pendingCloudData.bodyLogs);
            if (pendingCloudSections.includes('measurementLogs') && pendingCloudData.measurementLogs) setMeasurementLogs(pendingCloudData.measurementLogs);
            if (pendingCloudSections.includes('macroGoals') && pendingCloudData.macroGoals) setMacroGoals(pendingCloudData.macroGoals);
            if (user) {
                await syncService.adoptCloudSections(user.uid, {
                    nutritionLogs: pendingCloudSections.includes('nutritionLogs') ? pendingCloudData.nutritionLogs : undefined,
                    cardioSessions: pendingCloudSections.includes('cardioSessions') ? pendingCloudData.cardioSessions : undefined,
                    bodyLogs: pendingCloudSections.includes('bodyLogs') ? pendingCloudData.bodyLogs : undefined,
                    measurementLogs: pendingCloudSections.includes('measurementLogs') ? pendingCloudData.measurementLogs : undefined,
                    customFoods: pendingCloudSections.includes('customFoods') ? pendingCloudData.customFoods : undefined,
                });
            }
            if (pendingCloudSections.includes('personalTemplates') && pendingCloudData.personalTemplates) setPersonalTemplates(pendingCloudData.personalTemplates);
            if (pendingCloudSections.includes('templateFolders') && pendingCloudData.templateFolders) setTemplateFolders(pendingCloudData.templateFolders);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [user, pendingCloudData, pendingCloudSections, setProgram, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated, setHasSeenOnboarding, setBodyLogs, setMeasurementLogs, setCustomFoods, setPersonalTemplates, setTemplateFolders, setKeepScreenOn, setWeightUnit, setRestTimerDisplay, setMacroGoals, setNutritionLogs, setRpTargetRIR, setUserProfile, setLocalSectionSyncMeta, setCardioSessions, setNutritionGoal, previousScope, incompleteSets, defaultSets, defaultRestSeconds, warmupRestSeconds, restIncrementSeconds, restSound, restVibrate, autoStartRest, bodyWeightUnit, distanceUnit, sizeUnit, weekStart, oneRmFormula, plateBarKg, platePlatesKg, setPreviousScope, setIncompleteSets, setDefaultSets, setDefaultRestSeconds, setWarmupRestSeconds, setRestIncrementSeconds, setRestSound, setRestVibrate, setAutoStartRest, setBodyWeightUnit, setDistanceUnit, setSizeUnit, setWeekStart, setOneRmFormula, setPlateBarKg, setPlatePlatesKg]);

    const cancelCloudSync = useCallback(() => {
        // "Keep Local": user explicitly decided to retain their local state for the conflicting sections.
        // We only mark the disputed sections as dirty/preferred, rather than arbitrarily marking all 14 domains dirty.
        const sectionsToPreserve = pendingCloudSections.length > 0 ? pendingCloudSections : [];
        setPendingCloudData(null);
        setPendingCloudSections([]);
        if (sectionsToPreserve.length > 0) {
            const now = Date.now();
            setLocalLastUpdated(now);
            setLocalSectionSyncMeta(prev => {
                const next = { ...prev };
                sectionsToPreserve.forEach(section => {
                    next[section] = now;
                });
                return next;
            });
            void dirtySyncState.mark(sectionsToPreserve);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [pendingCloudSections, setLocalLastUpdated, setLocalSectionSyncMeta]);

    return { confirmCloudSync, cancelCloudSync };
};
