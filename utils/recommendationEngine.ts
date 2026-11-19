
import { ProgramDay, UserProfile, MesoType } from "../types";
import { NH_ULT_BEGINNER, NH_ULT_NOVICE, NH_ULT_BRIDGE, NH_ULT_INTERMEDIATE } from "../data/nh/ultimateSeries";
import { NH_DOOM_SLAYER } from "../data/nh/animeAndGaming";
import { TOKITA_TEMPLATE } from "../data/defaultTemplates";

export type { ProgressionSet, ProgressionSuggestion, ProgressionTexts } from "./progressionEngine";
export { recommendProgression, formatProgressionReason } from "./progressionEngine";

export interface RecommendationResult {
    template: ProgramDay[];
    mesoType: MesoType;
    stageId?: string;
    reasonKey: string; // Translation key for the explanation
    adjustedVolume?: boolean; // If true, volume was reduced for time constraints
}

export const recommendProgram = (profile: UserProfile): RecommendationResult => {
    const { experience, daysPerWeek, goal, sessionDuration } = profile;

    let selectedTemplate: ProgramDay[] = NH_ULT_NOVICE;
    let selectedType: MesoType = 'nh_ult_novice';
    let selectedStageId: string | undefined = 'novice';
    let reason = 'rec_default';

    // 1. Logic based on Frequency & Experience
    if (daysPerWeek <= 2) {
        selectedTemplate = NH_ULT_BEGINNER;
        selectedType = 'nh_ult_beginner';
        selectedStageId = 'beginner';
        reason = 'rec_low_freq';
    }
    else if (daysPerWeek === 3) {
        if (experience === 'beginner') {
            selectedTemplate = NH_ULT_BEGINNER;
            selectedType = 'nh_ult_beginner';
            selectedStageId = 'beginner';
        } else {
            selectedTemplate = NH_ULT_NOVICE;
            selectedType = 'nh_ult_novice';
            selectedStageId = 'novice';
        }
        reason = 'rec_wizard';
    }
    else if (daysPerWeek === 4) {
        selectedTemplate = NH_ULT_BRIDGE;
        selectedType = 'nh_ult_bridge';
        selectedStageId = 'bridge';
        reason = 'rec_4_day';
    }
    else if (daysPerWeek === 5) {
        selectedTemplate = NH_ULT_INTERMEDIATE;
        selectedType = 'nh_ult_intermediate';
        selectedStageId = 'intermediate';
        reason = 'rec_ppl';
    }
    else {
        selectedTemplate = NH_DOOM_SLAYER;
        selectedType = 'nh_doom_slayer';
        selectedStageId = undefined;
        reason = 'rec_ppl';
    }

    // 2. Goal Overrides
    if (goal === 'endurance') {
        selectedTemplate = TOKITA_TEMPLATE;
        selectedType = 'tokita';
        selectedStageId = 'barbell';
        reason = 'rec_endurance';
    }

    // 3. Time Constraints (Volume Adjustment)
    let finalTemplate = JSON.parse(JSON.stringify(selectedTemplate)); // Deep copy
    let adjustedVolume = false;

    if (sessionDuration === 'short') {
        // Reduce set count to fit in <45 mins
        finalTemplate = finalTemplate.map((day: ProgramDay) => ({
            ...day,
            slots: day.slots.map(slot => ({
                ...slot,
                setTarget: Math.max(2, slot.setTarget - 1) // Reduce by 1 set, min 2
            }))
        }));
        adjustedVolume = true;
    }

    return {
        template: finalTemplate,
        mesoType: selectedType,
        ...(selectedStageId ? { stageId: selectedStageId } : {}),
        reasonKey: reason,
        adjustedVolume
    };
};
