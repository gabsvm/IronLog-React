import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimerOverlay } from '../../components/ui/RestTimerOverlay';
import * as TimerContext from '../../context/TimerContext';
import * as AppContext from '../../context/AppContext';
import { useStore } from '../../lib/store';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playRestBeep: vi.fn(),
}));

describe('G2: rest pill exposes its height as --rest-pill-height', () => {
    const originalResizeObserver = (window as any).ResizeObserver;
    const roInstances: Array<{
        callback: ResizeObserverCallback;
        observe: ReturnType<typeof vi.fn>;
        disconnect: ReturnType<typeof vi.fn>;
    }> = [];

    let timerState: any;

    const pillVar = () =>
        document.documentElement.style.getPropertyValue('--rest-pill-height');

    beforeEach(() => {
        vi.clearAllMocks();
        roInstances.length = 0;
        document.documentElement.style.removeProperty('--rest-pill-height');

        (window as any).ResizeObserver = class {
            callback: ResizeObserverCallback;
            observe = vi.fn();
            disconnect = vi.fn();
            constructor(callback: ResizeObserverCallback) {
                this.callback = callback;
                roInstances.push(this as any);
            }
        };

        timerState = {
            active: true,
            timeLeft: 90,
            duration: 90,
            endAt: Date.now() + 90000,
            source: { exerciseInstanceId: 1, setId: 101 },
        };

        useStore.setState({
            activeSession: {
                id: 1,
                name: 'Chest Day',
                startTime: Date.now(),
                dayIdx: 0,
                mesoId: 1,
                week: 1,
                exercises: [
                    {
                        id: 'ex-1',
                        instanceId: 1,
                        name: 'Bench Press',
                        sets: [
                            { id: 101, weight: 100, reps: 8, completed: true, rpe: '8' },
                            { id: 102, weight: 100, reps: 8, completed: false },
                        ],
                    },
                ] as any,
            },
        });

        vi.spyOn(TimerContext, 'useTimerState').mockImplementation(() => timerState);
        vi.spyOn(TimerContext, 'useTimerActions').mockReturnValue({
            setRestTimer: vi.fn(),
        } as any);
        vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({
            lang: 'es',
            reducedEffects: false,
        } as any);
        vi.spyOn(AppContext, 'useAppConfig').mockReturnValue({
            config: { showRIR: true, rpEnabled: false, restTimerDisplay: 'compact' } as any,
            setConfig: vi.fn(),
        } as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.documentElement.style.removeProperty('--rest-pill-height');
        if (originalResizeObserver) {
            (window as any).ResizeObserver = originalResizeObserver;
        } else {
            delete (window as any).ResizeObserver;
        }
    });

    it('observes the pill element and publishes its measured height', () => {
        render(<RestTimerOverlay />);
        expect(screen.getByText('1:30')).toBeInTheDocument();

        expect(roInstances).toHaveLength(1);
        const observed = roInstances[0].observe.mock.calls[0][0] as HTMLElement;
        expect(observed.tagName).toBe('ASIDE');

        // Simulate the browser reporting a 130px pill.
        vi.spyOn(observed, 'getBoundingClientRect').mockReturnValue({ height: 130 } as DOMRect);
        act(() => {
            roInstances[0].callback([], roInstances[0] as unknown as ResizeObserver);
        });

        expect(pillVar()).toBe('130px');
    });

    it('resets the var to 0px when the timer stops or the pill unmounts', () => {
        // Start from a published height.
        document.documentElement.style.setProperty('--rest-pill-height', '130px');

        const { rerender, unmount } = render(<RestTimerOverlay />);
        expect(roInstances).toHaveLength(1);

        timerState = { ...timerState, active: false };
        rerender(<RestTimerOverlay />);
        expect(pillVar()).toBe('0px');
        expect(roInstances[0].disconnect).toHaveBeenCalled();

        unmount();
        expect(pillVar()).toBe('0px');
    });

    it('publishes 0px in expanded mode (no compact pill mounted)', () => {
        render(<RestTimerOverlay />);
        expect(roInstances).toHaveLength(1);

        fireEvent.click(screen.getByLabelText(/Descansando: 1:30/i));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        expect(pillVar()).toBe('0px');
    });
});
