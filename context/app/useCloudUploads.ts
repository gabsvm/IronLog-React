// S6: online flush, session/state upload debounces and cloud-merge confirm/cancel, moved verbatim from context/AppContext.tsx.
import { useEffect, useCallback } from 'react';
import { AppState, ExerciseDef, ActiveSession, MesoCycle, Log, ProgramDay, GlobalTemplate, UserProfile, NutritionLog, CardioSession, NutritionGoal, MacroGoals, BodyLog, CustomFood, DirtySyncSection, SectionSyncMeta, WeightUnit } from '../../types';
import { syncService } from '../../services/syncService';
import { useStore } from '../../lib/store';
import { dirtySyncState } from '../../services/dirtySyncState';
import type { Dispatch, SetStateAction } from 'react';
import type { FeedbackEntry, UserSubscription } from '../../types';
import type { User } from 'firebase/auth';

export interface UseCloudUploadsDeps {
    user: User;
    subscription: UserSubscription;
    showRIR: boolean;
    setShowRIR: (value: boolean | ((val: boolean) => boolean)) => void;
    rpEnabled: boolean;
    setRpEnabled: (value: boolean | ((val: boolean) => boolean)) => void;
    rpTargetRIR: number;
    setRpTargetRIR: (value: number | ((val: number) => number)) => void;
    keepScreenOn: boolean;
    setKeepScreenOn: (value: boolean | ((val: boolean) => boolean)) => void;
    weightUnit: WeightUnit;
    setWeightUnit: (value: WeightUnit | ((val: WeightUnit) => WeightUnit)) => void;
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
    setPersonalTemplates: (value: GlobalTemplate[] | ((val: GlobalTemplate[]) => GlobalTemplate[])) => void;
    rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
    setRpFeedback: (value: Record<string, Record<string, Record<string, FeedbackEntry>>> | ((val: Record<string, Record<string, Record<string, FeedbackEntry>>>) => Record<string, Record<string, Record<string, FeedbackEntry>>>)) => void;
    setHasSeenOnboarding: (value: boolean | ((val: boolean) => boolean)) => void;
    setLocalLastUpdated: (value: number | ((val: number) => number)) => void;
    setLocalSectionSyncMeta: (value: Partial<Record<DirtySyncSection, number>> | ((val: Partial<Record<DirtySyncSection, number>>) => Partial<Record<DirtySyncSection, number>>)) => void;
    bodyLogs: BodyLog[];
    setBodyLogs: (value: BodyLog[] | ((val: BodyLog[]) => BodyLog[])) => void;
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
    activeSession: ActiveSession;
    activeMeso: MesoCycle;
    isAppLoading: boolean;
    withDirtyTrackingSuppressed: (callback: () => void | Promise<void>) => Promise<void>;
}

/** S6: online flush, session/state upload debounces and cloud-merge confirm/cancel (moved verbatim from AppProvider; same hook order). */
export const useCloudUploads = ({
    user,
    subscription,
    showRIR,
    setShowRIR,
    rpEnabled,
    setRpEnabled,
    rpTargetRIR,
    setRpTargetRIR,
    keepScreenOn,
    setKeepScreenOn,
    weightUnit,
    setWeightUnit,
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
    rpFeedback,
    setRpFeedback,
    setHasSeenOnboarding,
    setLocalLastUpdated,
    setLocalSectionSyncMeta,
    bodyLogs,
    setBodyLogs,
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
    activeSession,
    activeMeso,
    isAppLoading,
    withDirtyTrackingSuppressed,
}: UseCloudUploadsDeps) => {
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
                            config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit },
                            rpFeedback,
                            userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, personalTemplates,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, [user, subscription.isPro, program, activeMeso, activeSession, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, rpFeedback, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, personalTemplates, setLocalLastUpdated]);

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
                        config: { showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit },
                        rpFeedback,
                        userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, personalTemplates,
                        email: user.email || null,
                        lastUpdated: now,
                    }, dirtySections);
                })();
            } else {
                syncService.uploadUserIdentity(user.uid, user.email || "");
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [user, subscription.isPro, program, activeMeso, exercises, logs, showRIR, rpEnabled, rpTargetRIR, keepScreenOn, weightUnit, rpFeedback, isAppLoading, hasCheckedSync, pendingCloudData, userProfile, nutritionLogs, cardioSessions, nutritionGoal, bodyLogs, macroGoals, customFoods, personalTemplates, setLocalLastUpdated]);

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
            }

            if (pendingCloudSections.includes('userProfile') && pendingCloudData.userProfile) setUserProfile(pendingCloudData.userProfile);
            if (pendingCloudSections.includes('nutritionLogs') && pendingCloudData.nutritionLogs) setNutritionLogs(pendingCloudData.nutritionLogs);
            if (pendingCloudSections.includes('cardioSessions') && pendingCloudData.cardioSessions) setCardioSessions(pendingCloudData.cardioSessions);
            if (pendingCloudSections.includes('nutritionGoal') && pendingCloudData.nutritionGoal) setNutritionGoal(pendingCloudData.nutritionGoal);
            if (pendingCloudSections.includes('bodyLogs') && pendingCloudData.bodyLogs) setBodyLogs(pendingCloudData.bodyLogs);
            if (pendingCloudSections.includes('macroGoals') && pendingCloudData.macroGoals) setMacroGoals(pendingCloudData.macroGoals);
            if (pendingCloudSections.includes('customFoods') && pendingCloudData.customFoods) setCustomFoods(pendingCloudData.customFoods);
            if (user) {
                await syncService.adoptCloudSections(user.uid, {
                    nutritionLogs: pendingCloudSections.includes('nutritionLogs') ? pendingCloudData.nutritionLogs : undefined,
                    cardioSessions: pendingCloudSections.includes('cardioSessions') ? pendingCloudData.cardioSessions : undefined,
                    bodyLogs: pendingCloudSections.includes('bodyLogs') ? pendingCloudData.bodyLogs : undefined,
                    customFoods: pendingCloudSections.includes('customFoods') ? pendingCloudData.customFoods : undefined,
                });
            }
            if (pendingCloudSections.includes('personalTemplates') && pendingCloudData.personalTemplates) setPersonalTemplates(pendingCloudData.personalTemplates);

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
    }, [user, pendingCloudData, pendingCloudSections, setProgram, setExercises, setLogs, setRpFeedback, setShowRIR, setRpEnabled, setLocalLastUpdated, setHasSeenOnboarding, setBodyLogs, setCustomFoods, setPersonalTemplates, setKeepScreenOn, setWeightUnit, setMacroGoals, setNutritionLogs, setRpTargetRIR, setUserProfile, setLocalSectionSyncMeta, setCardioSessions, setNutritionGoal]);

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
