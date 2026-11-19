import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeMesoSettingsModal } from '../../views/home/HomeMesoSettingsModal';
import { HomeTopSection } from '../../views/home/HomeTopSection';
import { useHomeViewState } from '../../views/home/useHomeViewState';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { NH_TOJI, NH_TOJI_STAGE_2 } from '../../data/naturalHypertrophy';
import { useStore } from '../../lib/store';

import { ProgramDay } from '../../types';

const mockSetProgram = vi.fn();
let currentProgram: ProgramDay[] = NH_TOJI;

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        program: currentProgram,
        logs: [],
        isAppLoading: false,
        setProgram: (prog: ProgramDay[]) => {
            mockSetProgram(prog);
            currentProgram = prog;
        },
        globalTemplates: INITIAL_TEMPLATES,
        personalTemplates: [],
        userProfile: { subscription: { isPro: true, tier: 'lifetime', expiryDate: null } },
        exercises: [],
    }),
    useAppConfig: () => ({
        config: { showRIR: false, rpEnabled: false, rpTargetRIR: 2, keepScreenOn: false },
    }),
    useAppPreferences: () => ({
        lang: 'en',
    }),
    useTutorial: () => ({
        tutorialProgress: { home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true },
        markTutorialSeen: vi.fn(),
    }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: true,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: '',
    }),
}));

const TestHarness: React.FC = () => {
    const state = useHomeViewState({
        startSession: vi.fn(),
        onEditProgram: vi.fn(),
    });
    return (
        <div>
            <HomeTopSection state={state} />
            <HomeMesoSettingsModal state={state} />
        </div>
    );
};

describe('Active Plan Multi-Stage Selection UI & State', () => {
    beforeEach(() => {
        mockSetProgram.mockClear();
        currentProgram = NH_TOJI;
        useStore.setState({
            activeMeso: {
                id: 101,
                name: 'Toji Fushiguro (V-Taper Workout)',
                mesoType: 'nh_toji',
                week: 1,
                targetWeeks: 5,
                isDeload: false,
                plan: NH_TOJI.map((d) => d.slots.map((s) => s.exerciseId || null)),
                duration: 5,
                stageId: 'stage_3',
            },
            activeSession: null,
        });
    });

    it('renders active-stage-badge and switches from Stage 3 (4 days) to Stage 2 (3 days) in HomeMesoSettingsModal', () => {
        render(<TestHarness />);

        // Active stage badge should display Stage 3
        const badge = screen.getByTestId('active-stage-badge');
        expect(badge.textContent).toContain('Stage 3');

        // Clicking badge opens HomeMesoSettingsModal
        fireEvent.click(badge);

        const stage1Opt = screen.getByTestId('meso-stage-option-stage_1');
        const stage2Opt = screen.getByTestId('meso-stage-option-stage_2');
        const stage3Opt = screen.getByTestId('meso-stage-option-stage_3');

        expect(stage1Opt).toBeTruthy();
        expect(stage2Opt).toBeTruthy();
        expect(stage3Opt).toBeTruthy();

        // Select Stage 2
        fireEvent.click(stage2Opt);

        // Save Stage 2 and adjust weeks from 5 to 8
        const durationButtons = document.querySelectorAll('#tut-meso-duration button');
        const plusWeekBtn = durationButtons[1];
        expect(plusWeekBtn).toBeTruthy();
        fireEvent.click(plusWeekBtn);
        fireEvent.click(plusWeekBtn);
        fireEvent.click(plusWeekBtn);

        const saveBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveBtn);

        const updatedMeso = useStore.getState().activeMeso;
        expect(updatedMeso?.stageId).toBe('stage_2');
        expect(updatedMeso?.targetWeeks).toBe(8);
        expect(updatedMeso?.duration).toBe(8);
        expect(updatedMeso?.plan.length).toBe(3);
        expect(mockSetProgram).toHaveBeenCalledWith(NH_TOJI_STAGE_2);
        expect(currentProgram.length).toBe(3);
        expect(screen.getByTestId('active-stage-badge').textContent).toContain('Stage 2');
    });
});
