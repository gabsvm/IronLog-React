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
