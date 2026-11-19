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

    it('recommends Ultimate Bridge (nh_ult_bridge) for 4 days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 4 });
        expect(rec.mesoType).toBe('nh_ult_bridge');
        expect(rec.stageId).toBe('bridge');
        expect(rec.reasonKey).toBe('rec_4_day');
        expect(rec.template.length).toBe(4);
    });

    it('recommends Ultimate Novice (nh_ult_novice) for 3 days per week intermediate', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 3 });
        expect(rec.mesoType).toBe('nh_ult_novice');
        expect(rec.stageId).toBe('novice');
        expect(rec.reasonKey).toBe('rec_wizard');
        expect(rec.template.length).toBe(3);
    });

    it('recommends Ultimate Beginner for <= 2 days per week', () => {
        const rec = recommendProgram({ ...baseProfile, daysPerWeek: 2 });
        expect(rec.mesoType).toBe('nh_ult_beginner');
        expect(rec.stageId).toBe('beginner');
        expect(rec.reasonKey).toBe('rec_low_freq');
    });

    it('recommends Ultimate Intermediate (nh_ult_intermediate) for 5 days and Doom Slayer PPL for 6+ days', () => {
        const rec5 = recommendProgram({ ...baseProfile, daysPerWeek: 5 });
        expect(rec5.mesoType).toBe('nh_ult_intermediate');
        expect(rec5.stageId).toBe('intermediate');
        expect(rec5.reasonKey).toBe('rec_ppl');

        const rec6 = recommendProgram({ ...baseProfile, daysPerWeek: 6 });
        expect(rec6.mesoType).toBe('nh_doom_slayer');
        expect(rec6.stageId).toBeUndefined();
        expect(rec6.reasonKey).toBe('rec_ppl');
    });

    it('overrides with Tokita Ohma Program for endurance goal', () => {
        const rec = recommendProgram({ ...baseProfile, goal: 'endurance', daysPerWeek: 4 });
        expect(rec.mesoType).toBe('tokita');
        expect(rec.stageId).toBe('barbell');
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
