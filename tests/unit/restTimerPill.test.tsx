import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimerOverlay } from '../../components/ui/RestTimerOverlay';
import * as TimerContext from '../../context/TimerContext';
import * as AppContext from '../../context/AppContext';
import { useStore } from '../../lib/store';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playRestBeep: vi.fn(),
}));

describe('Task U1: RestTimerOverlay as non-modal compact floating pill by default', () => {
    const mockSetRestTimer = vi.fn();
    const mockRestTimer = {
        active: true,
        timeLeft: 90,
        duration: 90,
        endAt: Date.now() + 90000,
        source: {
            exerciseInstanceId: 1,
            setId: 101,
        },
    };

    const mockExercises = [
        {
            id: 'ex-1',
            instanceId: 1,
            name: 'Bench Press',
            targetSets: 3,
            sets: [
                { id: 101, setNumber: 1, weight: 100, reps: 8, completed: true, rpe: '8' },
                { id: 102, setNumber: 2, weight: 100, reps: 8, completed: false },
            ],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useStore.setState({
            activeSession: {
                id: 'sess-1',
                name: 'Chest Day',
                startTime: Date.now(),
                exercises: mockExercises as any,
            },
        });

        vi.spyOn(TimerContext, 'useTimerState').mockReturnValue(mockRestTimer as any);
        vi.spyOn(TimerContext, 'useTimerActions').mockReturnValue({
            setRestTimer: mockSetRestTimer,
        } as any);

        vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({
            lang: 'es',
            reducedEffects: false,
        } as any);

        vi.spyOn(AppContext, 'useAppConfig').mockReturnValue({
            config: {
                showRIR: false,
                rpEnabled: false,
                restTimerDisplay: 'compact',
            } as any,
            setConfig: vi.fn(),
        } as any);
    });

    it('renders in compact non-modal pill mode by default without backdrop-blur', () => {
        render(<RestTimerOverlay />);

        // In compact mode, the floating pill is rendered
        expect(screen.getByText('1:30')).toBeDefined();
        expect(screen.getByText('-10s')).toBeDefined();
        expect(screen.getByText('+30s')).toBeDefined();

        // Should NOT have dialog role or circular timer svg in compact mode
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByText(/Saltar descanso/i)).toBeNull();
    });

    it('expands to full panel when the pill is clicked', () => {
        render(<RestTimerOverlay />);

        const expandBtn = screen.getByLabelText(/Descansando: 1:30/i);
        fireEvent.click(expandBtn);

        // Now dialog is rendered
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByText(/Saltar descanso/i)).toBeDefined();
        expect(screen.getByText(/Siguiente serie/i)).toBeDefined();

        // Clicking minimize returns to compact mode
        const minimizeBtn = screen.getByLabelText(/Minimizar/i);
        fireEvent.click(minimizeBtn);

        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByText('1:30')).toBeDefined();
    });

    it('starts in expanded mode if config.restTimerDisplay is "expanded"', () => {
        vi.spyOn(AppContext, 'useAppConfig').mockReturnValue({
            config: {
                showRIR: false,
                rpEnabled: false,
                restTimerDisplay: 'expanded',
            } as any,
            setConfig: vi.fn(),
        } as any);

        render(<RestTimerOverlay />);

        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByText(/Saltar descanso/i)).toBeDefined();
    });

    it('triggers adjustTimer and skipTimer from compact pill buttons', () => {
        render(<RestTimerOverlay />);

        const minusBtn = screen.getByLabelText('-10s');
        fireEvent.click(minusBtn);
        expect(mockSetRestTimer).toHaveBeenCalled();

        const plusBtn = screen.getByLabelText('+30s');
        fireEvent.click(plusBtn);
        expect(mockSetRestTimer).toHaveBeenCalledTimes(2);

        const skipBtn = screen.getByLabelText(/Saltar descanso/i);
        fireEvent.click(skipBtn);
        expect(mockSetRestTimer).toHaveBeenCalledTimes(3);
    });
});
