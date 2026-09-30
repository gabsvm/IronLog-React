import { describe, it, expect } from 'vitest';
import { recommendProgram } from '../../utils/recommendationEngine';
import { UserProfile } from '../../types';

describe('recommendProgram', () => {
    const baseProfile: UserProfile = {
        experience: 'intermediate',
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium',
        bodyWeight: 75,
        height: 175,
        age: 28,
        gender: 'male',
        activityLevel: 'moderate',
    };

    it('recommends Upper/Lower (hyp_2) for 4 days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 4 });
        expect(rec.mesoType).toBe('hyp_2');
        expect(rec.reasonKey).toBe('rec_4_day');
        expect(rec.template.length).toBe(4);
    });

    it('recommends Wizard v3 (wizard) for 3 days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 3 });
        expect(rec.mesoType).toBe('wizard');
        expect(rec.reasonKey).toBe('rec_wizard');
        expect(rec.template.length).toBe(3);
    });

    it('recommends Resensitization for <= 2 days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 2 });
        expect(rec.mesoType).toBe('resensitization');
        expect(rec.reasonKey).toBe('rec_low_freq');
    });

    it('recommends PPL (hyp_1) for 5+ days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 5 });
        expect(rec.mesoType).toBe('hyp_1');
        expect(rec.reasonKey).toBe('rec_ppl');
    });

    it('overrides with Metabolite for endurance goal', () => {
        const rec = recommendProgram({ ...baseProfile, goal: 'endurance', daysPerWeek: 4 });
        expect(rec.mesoType).toBe('metabolite');
        expect(rec.reasonKey).toBe('rec_endurance');
    });

    it('reduces set count when sessionDuration is short (<45 mins)', () => {
        const normal = recommendProgram({ ...baseProfile, sessionDuration: 'medium', daysPerWeek: 4 });
        const short = recommendProgram({ ...baseProfile, sessionDuration: 'short', daysPerWeek: 4 });

        expect(short.adjustedVolume).toBe(true);
        const normalFirstSlotSets = normal.template[0].slots[0].setTarget;
        const shortFirstSlotSets = short.template[0].slots[0].setTarget;
        expect(shortFirstSlotSets).toBe(Math.max(2, normalFirstSlotSets - 1));
    });
});
