import { describe, it, expect } from 'vitest';
import { recommendProgram } from '../../utils/recommendationEngine';
import { UserProfile } from '../../types';

describe('onboarding outcomes and profile persistence', () => {
    const existingProfileWithBodyStats: UserProfile = {
        experience: 'beginner',
        daysPerWeek: 3,
        goal: 'hypertrophy',
        sessionDuration: 'medium',
        bodyWeight: 82,
        height: 180,
        age: 29,
        gender: 'male',
        activityLevel: 'active',
        nutritionGoal: 'bulk',
    };

    it('merges onboarding answers into existing profile preserving body stats', () => {
        const wizardAnswers = {
            experience: 'advanced' as const,
            daysPerWeek: 5,
            goal: 'strength' as const,
            sessionDuration: 'short' as const,
        };

        const updatedProfile: UserProfile = {
            ...existingProfileWithBodyStats,
            ...wizardAnswers,
        };

        // Onboarding answers updated
        expect(updatedProfile.experience).toBe('advanced');
        expect(updatedProfile.daysPerWeek).toBe(5);
        expect(updatedProfile.goal).toBe('strength');
        expect(updatedProfile.sessionDuration).toBe('short');

        // Existing body metrics preserved
        expect(updatedProfile.bodyWeight).toBe(82);
        expect(updatedProfile.height).toBe(180);
        expect(updatedProfile.age).toBe(29);
        expect(updatedProfile.gender).toBe('male');
        expect(updatedProfile.activityLevel).toBe('active');
        expect(updatedProfile.nutritionGoal).toBe('bulk');
    });

    it('suggested outcome generates valid recommendation and template', () => {
        const rec = recommendProgram({
            ...existingProfileWithBodyStats,
            daysPerWeek: 4,
            goal: 'hypertrophy',
        });

        expect(rec.template.length).toBe(4);
        expect(rec.mesoType).toBe('hyp_2');
        expect(rec.reasonKey).toBe('rec_4_day');
    });

    it('custom outcome produces a blank new program day', () => {
        const blankProgram = [{
            id: `d_${Date.now()}`,
            dayName: { en: 'Day 1', es: 'Día 1' },
            slots: [],
        }];

        expect(blankProgram.length).toBe(1);
        expect(blankProgram[0].slots).toEqual([]);
        expect(blankProgram[0].dayName.en).toBe('Day 1');
    });

    it('freestyle outcome creates an active detached session with id -1 for meso and week', () => {
        const freeSession = {
            id: Date.now(),
            dayIdx: -1,
            name: 'Freestyle Session',
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: [],
        };

        expect(freeSession.dayIdx).toBe(-1);
        expect(freeSession.mesoId).toBe(-1);
        expect(freeSession.week).toBe(-1);
        expect(freeSession.exercises).toEqual([]);
    });
});
