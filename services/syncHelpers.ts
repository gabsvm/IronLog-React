import { DirtySyncSection, SectionSyncMeta } from "../types";

export const buildSectionSyncMeta = (sections: DirtySyncSection[] | undefined, lastUpdated: number): SectionSyncMeta => {
    if (!sections || sections.length === 0) return {};
    return sections.reduce<SectionSyncMeta>((acc, section) => {
        acc[section] = lastUpdated;
        return acc;
    }, {});
};

export const detectConflictSections = (
    localMeta: SectionSyncMeta = {},
    cloudMeta: SectionSyncMeta = {}
): DirtySyncSection[] => {
    return (Object.entries(cloudMeta) as [DirtySyncSection, number | undefined][])
        .filter(([section, ts]) => typeof ts === 'number' && ts > (localMeta[section] || 0))
        .map(([section]) => section);
};

export const mergeSectionSyncMeta = (
    baseMeta: SectionSyncMeta = {},
    updatedMeta: SectionSyncMeta = {}
): SectionSyncMeta => {
    const result: SectionSyncMeta = { ...baseMeta };
    (Object.entries(updatedMeta) as [DirtySyncSection, number | undefined][]).forEach(([section, ts]) => {
        if (typeof ts === 'number') {
            result[section] = Math.max(result[section] || 0, ts);
        }
    });
    return result;
};

export const serializeMeso = (meso: any) => {
    if (!meso || !Array.isArray(meso.plan)) return meso;

    const planMap: Record<string, any[]> = {};
    meso.plan.forEach((daySlot: any[], idx: number) => {
        planMap[String(idx)] = daySlot || [];
    });

    return { ...meso, plan: planMap };
};

export const deserializeMeso = (meso: any) => {
    if (!meso) return null;
    if (Array.isArray(meso.plan)) return meso;

    if (meso.plan && typeof meso.plan === 'object') {
        const planArray: any[][] = [];
        const keys = Object.keys(meso.plan).map(Number).sort((a, b) => a - b);
        const maxIdx = keys.length > 0 ? keys[keys.length - 1] : -1;

        for (let i = 0; i <= maxIdx; i++) {
            planArray[i] = meso.plan[String(i)] || [];
        }

        return { ...meso, plan: planArray };
    }

    return meso;
};

export interface MeaningfulLocalStateInput {
    activeSession?: any | null;
    activeMeso?: any | null;
    logs?: any[] | null;
    nutritionLogs?: any[] | null;
    cardioSessions?: any[] | null;
    bodyLogs?: any[] | null;
    customFoods?: any[] | null;
    personalTemplates?: any[] | null;
    exercises?: any[] | null;
    userProfile?: any | null;
}

/**
 * Pure classifier to determine whether local storage contains meaningful user data.
 * Prevents unsafe "empty device" automatic cloud overwrite when local user data
 * exists (such as nutrition logs, body logs, custom foods, personal templates, or custom exercises),
 * even if there is currently no active workout mesocycle or historical workout logs.
 * Deterministic bundled catalog seed data is NOT counted as user-owned state.
 */
export const isMeaningfullyEmptyLocalState = (state: MeaningfulLocalStateInput | null | undefined): boolean => {
    if (!state) return true;

    // 1. Active workout session with exercises
    if (state.activeSession && Array.isArray(state.activeSession.exercises) && state.activeSession.exercises.length > 0) {
        return false;
    }

    // 2. Active mesocycle (has a title or scheduled days)
    if (state.activeMeso && (state.activeMeso.name || (Array.isArray(state.activeMeso.plan) && state.activeMeso.plan.length > 0))) {
        return false;
    }

    // 3. Historical workout logs
    if (Array.isArray(state.logs) && state.logs.length > 0) {
        return false;
    }

    // 4. Daily nutrition tracking logs
    if (Array.isArray(state.nutritionLogs) && state.nutritionLogs.length > 0) {
        return false;
    }

    // 5. Cardio workout sessions
    if (Array.isArray(state.cardioSessions) && state.cardioSessions.length > 0) {
        return false;
    }

    // 6. Body composition logs
    if (Array.isArray(state.bodyLogs) && state.bodyLogs.length > 0) {
        return false;
    }

    // 7. Custom food items created by user
    if (Array.isArray(state.customFoods) && state.customFoods.length > 0) {
        return false;
    }

    // 8. Personal routines / templates created by user
    if (Array.isArray(state.personalTemplates) && state.personalTemplates.length > 0) {
        return false;
    }

    // 9. Custom exercises created by user (ignore built-in library exercises)
    if (Array.isArray(state.exercises)) {
        const hasCustom = state.exercises.some((e) =>
            Boolean(e?.isCustom) || (typeof e?.id === 'string' && e.id.startsWith('custom_'))
        );
        if (hasCustom) return false;
    }

    // 10. Meaningful user profile answers (non-empty onboarding responses or customized goals)
    if (state.userProfile && typeof state.userProfile === 'object') {
        const p = state.userProfile;
        if (p.experience || p.goal || p.daysPerWeek || p.targetWeight || p.currentWeight) {
            return false;
        }
    }

    return true;
};

