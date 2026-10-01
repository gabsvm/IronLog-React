import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { recommendProgram } from '../../utils/recommendationEngine';
import { UserProfile } from '../../types';

const { mockSetUserProfile, mockSetProgram, mockSetActiveMeso, storedProfile } = vi.hoisted(() => ({
    mockSetUserProfile: vi.fn(),
    mockSetProgram: vi.fn(),
    mockSetActiveMeso: vi.fn(),
    storedProfile: {
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
    },
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        setLang: vi.fn(),
        setProgram: mockSetProgram,
        userProfile: storedProfile,
        setUserProfile: mockSetUserProfile,
    }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ setActiveMeso: mockSetActiveMeso }),
}));

import { SetupWizard } from '../../components/onboarding/SetupWizard';

describe('onboarding outcomes (real SetupWizard)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Drive the wizard through steps 0-3 to the recommendation screen.
    const reachRecommendation = (onComplete: (outcome: any) => void) => {
        render(<SetupWizard onComplete={onComplete} />);
        for (let step = 0; step < 3; step++) {
            fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
        }
        fireEvent.click(screen.getByRole('button', { name: /Analizar mi perfil/ }));
    };

    it('merges onboarding answers into existing profile preserving body stats', () => {
        reachRecommendation(vi.fn());
        fireEvent.click(screen.getByRole('button', { name: /Crear mi propia plantilla/ }));

        expect(mockSetUserProfile).toHaveBeenCalledTimes(1);
        const updater = mockSetUserProfile.mock.calls[0][0];
        expect(typeof updater).toBe('function');

        const merged = updater({ ...(storedProfile as UserProfile), experience: 'stale' });

        // Onboarding answers applied.
        expect(merged.experience).toBe('beginner');
        expect(merged.daysPerWeek).toBe(3);
        expect(merged.goal).toBe('hypertrophy');
        expect(merged.sessionDuration).toBe('medium');

        // Existing body metrics preserved.
        expect(merged.bodyWeight).toBe(82);
        expect(merged.height).toBe(180);
        expect(merged.age).toBe(29);
        expect(merged.gender).toBe('male');
        expect(merged.activityLevel).toBe('active');
        expect(merged.nutritionGoal).toBe('bulk');
    });

    it('suggested outcome generates a valid recommendation and applies it', () => {
        // The pure engine behind the recommendation screen.
        const rec = recommendProgram({
            ...(storedProfile as unknown as UserProfile),
            daysPerWeek: 4,
            goal: 'hypertrophy',
        });
        expect(rec.template.length).toBe(4);
        expect(rec.mesoType).toBe('hyp_2');
        expect(rec.reasonKey).toBe('rec_4_day');

        // The wizard applies the recommendation it computed.
        const onComplete = vi.fn();
        reachRecommendation(onComplete);
        fireEvent.click(screen.getByRole('button', { name: /Comenzar con rutina sugerida/ }));

        expect(mockSetProgram).toHaveBeenCalledTimes(1);
        const template = mockSetProgram.mock.calls[0][0];
        expect(template.length).toBeGreaterThan(0);

        expect(mockSetActiveMeso).toHaveBeenCalledTimes(1);
        const meso = mockSetActiveMeso.mock.calls[0][0];
        expect(meso.week).toBe(1);
        expect(meso.targetWeeks).toBe(5);
        expect(meso.plan.length).toBe(template.length);

        expect(onComplete).toHaveBeenCalledWith({ mode: 'suggested', template });
    });

    it('custom outcome produces a blank new program day', () => {
        const onComplete = vi.fn();
        reachRecommendation(onComplete);
        fireEvent.click(screen.getByRole('button', { name: /Crear mi propia plantilla/ }));

        expect(mockSetProgram).toHaveBeenCalledTimes(1);
        const blankProgram = mockSetProgram.mock.calls[0][0];
        expect(blankProgram.length).toBe(1);
        expect(blankProgram[0].id).toMatch(/^d_\d+$/);
        expect(blankProgram[0].slots).toEqual([]);
        expect(blankProgram[0].dayName.en).toBe('Day 1');
        expect(blankProgram[0].dayName.es).toBe('Día 1');

        expect(mockSetActiveMeso).toHaveBeenCalledWith(null);
        expect(onComplete).toHaveBeenCalledWith({ mode: 'custom', template: blankProgram });
    });

    it('freestyle outcome completes without program or mesocycle', () => {
        const onComplete = vi.fn();
        reachRecommendation(onComplete);
        fireEvent.click(screen.getByRole('button', { name: /Registrar sesiones libres/ }));

        expect(mockSetActiveMeso).toHaveBeenCalledWith(null);
        expect(mockSetProgram).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledWith({ mode: 'freestyle' });
    });
});
