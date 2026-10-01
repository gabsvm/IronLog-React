import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

const mockPlayFinishSound = vi.fn();
const mockTriggerHaptic = vi.fn();

vi.mock('../../utils/audio', () => ({
    playTimerFinishSound: () => mockPlayFinishSound(),
    triggerHaptic: (arg: string) => mockTriggerHaptic(arg),
    scheduleNativeRestTimer: vi.fn(),
    cancelNativeRestTimer: vi.fn(),
}));

let activeWorkerInstance: any = null;

class MockWorker {
    onmessage: any = null;
    postMessage = vi.fn((msg: string) => {});
    terminate = vi.fn();

    constructor() {
        activeWorkerInstance = this;
    }
}

(globalThis as any).Worker = MockWorker;
if (!globalThis.URL) {
    (globalThis as any).URL = {};
}
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
(globalThis as any).URL.revokeObjectURL = vi.fn();

import { useTimer } from '../../hooks/useTimer';

describe('R5: useTimer side-effect isolation and StrictMode safety', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        activeWorkerInstance = null;
    });

    it('emits sound and haptic feedback exactly once when reaching zero in React.StrictMode', async () => {
        let timerController: any = null;

        const TimerComponent: React.FC = () => {
            const { restTimer, setRestTimer } = useTimer('es');
            timerController = { restTimer, setRestTimer };
            return <div data-testid="time">{restTimer.timeLeft}</div>;
        };

        const { findByTestId } = render(
            <React.StrictMode>
                <TimerComponent />
            </React.StrictMode>
        );

        await findByTestId('time');

        // Start timer set to expire in 500ms
        act(() => {
            timerController.setRestTimer({
                active: true,
                timeLeft: 1,
                duration: 60,
                endAt: Date.now() - 100, // already expired
            });
        });

        expect(activeWorkerInstance).not.toBeNull();

        // Simulate worker tick
        act(() => {
            activeWorkerInstance.onmessage?.();
        });

        // Feedback should have been triggered EXACTLY once
        expect(mockPlayFinishSound).toHaveBeenCalledTimes(1);
        expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
        expect(mockTriggerHaptic).toHaveBeenCalledWith('success');

        // Subsequent ticks should NOT re-trigger feedback because active is now false
        act(() => {
            activeWorkerInstance.onmessage?.();
        });

        expect(mockPlayFinishSound).toHaveBeenCalledTimes(1);
        expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    });
});
