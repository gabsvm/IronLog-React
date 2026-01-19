
import { ProgramDay, UserProfile, MesoType } from "../types";
import { 
    DEFAULT_TEMPLATE, 
    UPPER_LOWER_TEMPLATE, 
    FULL_BODY_TEMPLATE, 
    METABOLITE_TEMPLATE, 
    RESENS_TEMPLATE,
    WIZARD_TEMPLATE
} from "../constants";

export interface RecommendationResult {
    template: ProgramDay[];
    mesoType: MesoType;
    reasonKey: string; // Translation key for the explanation
    adjustedVolume?: boolean; // If true, volume was reduced for time constraints
}

export const recommendProgram = (profile: UserProfile): RecommendationResult => {
    const { experience, daysPerWeek, goal, sessionDuration } = profile;

    let selectedTemplate: ProgramDay[] = DEFAULT_TEMPLATE;
    let selectedType: MesoType = 'hyp_1';
    let reason = 'rec_default';

    // 1. Logic based on Frequency & Experience
    if (daysPerWeek <= 2) {
        // Very low frequency -> Full Body or Resensitization style
        selectedTemplate = RESENS_TEMPLATE;
        selectedType = 'resensitization';
        reason = 'rec_low_freq';
    } 
    else if (daysPerWeek === 3) {
        // Updated: Recommend Wizard v3 for 3-day split (Ideally Intermediate+)
        // If absolute beginner, we might want simpler Full Body, but Wizard is scaleable.
        selectedTemplate = WIZARD_TEMPLATE; 
        selectedType = 'wizard';
        reason = 'rec_wizard';
    } 
    else if (daysPerWeek === 4) {
        // Sweet spot for Upper/Lower
        selectedTemplate = UPPER_LOWER_TEMPLATE;
        selectedType = 'hyp_2';
        reason = 'rec_4_day';
    } 
    else {
        // 5-6 Days -> PPL (Push Pull Legs)
        selectedTemplate = DEFAULT_TEMPLATE; // PPL is 3 days but meant to be rotated 2x (6 days)
        selectedType = 'hyp_1';
        reason = 'rec_ppl';
    }

    // 2. Goal Overrides
    if (goal === 'endurance') {
        selectedTemplate = METABOLITE_TEMPLATE;
        selectedType = 'metabolite';
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
        reasonKey: reason,
        adjustedVolume
    };
};
