// S6: initial cloud download on login (apply on empty device / offer newer sections), moved verbatim from context/AppContext.tsx.
import { useEffect } from 'react';
import { AppState, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, GlobalTemplate, UserProfile, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, CustomFood, DirtySyncSection, WeightUnit } from '../../types';
import { syncService } from '../../services/syncService';
import { useStore } from '../../lib/store';
import { dirtySyncState } from '../../services/dirtySyncState';
import { isMeaningfullyEmptyLocalState } from '../../services/syncHelpers';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { FeedbackEntry } from '../../types';
import type { User } from 'firebase/auth';

export interface UseInitialCloudDownloadDeps {
    user: User;
    setShowRIR: (value: boolean | ((val: boolean) => boolean)) => void;
    setRpEnabled: (value: boolean | ((val: boolean) => boolean)) => void;
    setRpTargetRIR: (value: number | ((val: number) => number)) => void;
    setKeepScreenOn: (value: boolean | ((val: boolean) => boolean)) => void;
    setWeightUnit: (value: WeightUnit | ((val: WeightUnit) => WeightUnit)) => void;
    setProgram: (value: ProgramDay[] | ((val: ProgramDay[]) => ProgramDay[])) => void;
    exercises: ExerciseDef[];
    setExercises: (value: ExerciseDef[] | ((val: ExerciseDef[]) => ExerciseDef[])) => void;
    logs: Log[];
    setLogs: (value: Log[] | ((val: Log[]) => Log[])) => void;
    nutritionLogs: NutritionLog[];
    setNutritionLogs: (value: NutritionLog[] | ((val: NutritionLog[]) => NutritionLog[])) => void;
    cardioSessions: CardioSession[];
    setCardioSessions: (value: CardioSession[] | ((val: CardioSession[]) => CardioSession[])) => void;
    setNutritionGoal: (value: NutritionGoal | ((val: NutritionGoal) => NutritionGoal)) => void;
    userProfile: UserProfile;
    setUserProfile: (value: UserProfile | ((val: UserProfile) => UserProfile)) => void;
    personalTemplates: GlobalTemplate[];
    setPersonalTemplates: (value: GlobalTemplate[] | ((val: GlobalTemplate[]) => GlobalTemplate[])) => void;
    setRpFeedback: (value: Record<string, Record<string, Record<string, FeedbackEntry>>> | ((val: Record<string, Record<string, Record<string, FeedbackEntry>>>) => Record<string, Record<string, Record<string, FeedbackEntry>>>)) => void;
    setHasSeenOnboarding: (value: boolean | ((val: boolean) => boolean)) => void;
    setLocalLastUpdated: (value: number | ((val: number) => number)) => void;
    setLocalSectionSyncMeta: (value: Partial<Record<DirtySyncSection, number>> | ((val: Partial<Record<DirtySyncSection, number>>) => Partial<Record<DirtySyncSection, number>>)) => void;
    localLastUpdatedRef: MutableRefObject<number>;
    localSectionSyncMetaRef: MutableRefObject<Partial<Record<DirtySyncSection, number>>>;
    bodyLogs: BodyLog[];
    setBodyLogs: (value: BodyLog[] | ((val: BodyLog[]) => BodyLog[])) => void;
    setMacroGoals: (value: MacroGoals | ((val: MacroGoals) => MacroGoals)) => void;
    customFoods: CustomFood[];
    setCustomFoods: (value: CustomFood[] | ((val: CustomFood[]) => CustomFood[])) => void;
    pendingCloudData: Partial<AppState>;
    setPendingCloudData: Dispatch<SetStateAction<Partial<AppState>>>;
    setPendingCloudSections: Dispatch<SetStateAction<DirtySyncSection[]>>;
    hasCheckedSync: boolean;
    setHasCheckedSync: Dispatch<SetStateAction<boolean>>;
    isOnline: boolean;
    activeSession: ActiveSession;
    activeMeso: MesoCycle;
    isAppLoading: boolean;
    withDirtyTrackingSuppressed: (callback: () => void | Promise<void>) => Promise<void>;
}

/** S6: initial cloud download on login (apply on empty device / offer newer sections) (moved verbatim from AppProvider; same hook order). */
export const useInitialCloudDownload = ({
    user,
    setShowRIR,
    setRpEnabled,
    setRpTargetRIR,
    setKeepScreenOn,
    setWeightUnit,
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
    setPersonalTemplates,
    setRpFeedback,
    setHasSeenOnboarding,
    setLocalLastUpdated,
    setLocalSectionSyncMeta,
    localLastUpdatedRef,
    localSectionSyncMetaRef,
    bodyLogs,
    setBodyLogs,
    setMacroGoals,
    customFoods,
    setCustomFoods,
    pendingCloudData,
    setPendingCloudData,
    setPendingCloudSections,
    hasCheckedSync,
    setHasCheckedSync,
    isOnline,
    activeSession,
    activeMeso,
    isAppLoading,
    withDirtyTrackingSuppressed,
}: UseInitialCloudDownloadDeps) => {
    // --- INITIAL CLOUD DOWNLOAD ---
    useEffect(() => {
        if (!user || isAppLoading || !isOnline || pendingCloudData || hasCheckedSync) return;

        const checkCloudData = async () => {
            try {
                // Only trigger if we haven't checked since login or if local is empty
                const cloudData = await syncService.downloadState(user.uid);
                if (cloudData && cloudData.lastUpdated) {
                    const cloudSyncMeta = cloudData.syncMeta || {};
                    const isLocalEmpty = isMeaningfullyEmptyLocalState({
                        activeSession,
                        activeMeso,
                        logs,
                        nutritionLogs,
                        cardioSessions,
                        bodyLogs,
                        customFoods,
                        personalTemplates,
                        exercises,
                        userProfile,
                    });
                    const isCachedSnapshot = cloudData.source === 'cache';

                    if (isLocalEmpty) {
                        console.log(isCachedSnapshot
                            ? "Applying cached cloud snapshot on empty device."
                            : "Cloud data found on empty device. Applying automatically.");
                        await withDirtyTrackingSuppressed(async () => {
                            if (cloudData.program) setProgram(cloudData.program);
                            if (cloudData.activeMeso) useStore.getState().setActiveMeso(cloudData.activeMeso);
                            if (cloudData.activeSession) useStore.getState().setActiveSession(cloudData.activeSession);
                            if (cloudData.exercises) setExercises(cloudData.exercises);
                            if (cloudData.logs) {
                                setLogs(cloudData.logs);
                                await syncService.adoptCloudLogs(user.uid, cloudData.logs);
                            }
                            if (cloudData.rpFeedback) setRpFeedback(cloudData.rpFeedback);

                            if (cloudData.config) {
                                if (cloudData.config.showRIR !== undefined) setShowRIR(cloudData.config.showRIR);
                                if (cloudData.config.rpEnabled !== undefined) setRpEnabled(cloudData.config.rpEnabled);
                                if (cloudData.config.rpTargetRIR !== undefined) setRpTargetRIR(cloudData.config.rpTargetRIR);
                                if (cloudData.config.keepScreenOn !== undefined) setKeepScreenOn(cloudData.config.keepScreenOn);
                                if (cloudData.config.weightUnit === 'kg' || cloudData.config.weightUnit === 'lb') setWeightUnit(cloudData.config.weightUnit);
                            }

                            if (cloudData.userProfile) setUserProfile(cloudData.userProfile);
                            if (cloudData.nutritionLogs) setNutritionLogs(cloudData.nutritionLogs);
                            if (cloudData.cardioSessions) setCardioSessions(cloudData.cardioSessions);
                            if (cloudData.nutritionGoal) setNutritionGoal(cloudData.nutritionGoal);
                            if (cloudData.bodyLogs) setBodyLogs(cloudData.bodyLogs);
                            if (cloudData.macroGoals) setMacroGoals(cloudData.macroGoals);
                            if (cloudData.customFoods) setCustomFoods(cloudData.customFoods);
                            await syncService.adoptCloudSections(user.uid, cloudData);
                            if (cloudData.personalTemplates) setPersonalTemplates(cloudData.personalTemplates);

                            setLocalLastUpdated(cloudData.lastUpdated ?? Date.now());
                            setLocalSectionSyncMeta(cloudSyncMeta);
                            setHasSeenOnboarding(true);
                            await dirtySyncState.clear();
                        });
                    } else if (!isCachedSnapshot && cloudData.lastUpdated > (localLastUpdatedRef.current || 0)) {
                        const newerSections = Object.entries(cloudSyncMeta)
                            .filter(([section, ts]) => typeof ts === 'number' && ts > (localSectionSyncMetaRef.current[section as DirtySyncSection] || 0))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [
        user, isOnline, isAppLoading, pendingCloudData, hasCheckedSync, activeSession, activeMeso, logs, nutritionLogs,
        cardioSessions, bodyLogs, customFoods, personalTemplates, exercises, userProfile,
        setProgram, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated,
        setHasSeenOnboarding, setBodyLogs, setCustomFoods, setPersonalTemplates, setKeepScreenOn, setWeightUnit, setMacroGoals, setNutritionLogs, setLocalSectionSyncMeta,
        setRpTargetRIR, setUserProfile, setCardioSessions, setNutritionGoal
    ]); // Re-run when dependencies change
};
