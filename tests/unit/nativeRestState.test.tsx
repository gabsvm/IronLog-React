import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const { native } = vi.hoisted(() => ({
    native: {
        enabled: true,
        endAt: 0,
        duration: 120,
        epoch: 1,
        exercise: -1,
        set: -1,
        listener: null as null | ((data: unknown) => void),
        schedule: vi.fn(async (_options: unknown) => {}),
        cancel: vi.fn(async () => {}),
        read: vi.fn(async () => ({
            active: native.endAt > Date.now(),
            endAt: native.endAt,
            duration: native.duration,
            epoch: native.epoch,
            sourceExerciseInstanceId: native.exercise,
            sourceSetId: native.set,
        })),
        consume: vi.fn(async () => ({ epoch: native.epoch, commands: [] })),
    },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => native.enabled, getPlatform: () => 'android' },
    registerPlugin: () => ({
        haptic: async () => {},
        scheduleRestTimer: native.schedule,
        cancelRestTimer: native.cancel,
        getRestTimerState: native.read,
        consumePendingTimerCommands: native.consume,
        addListener: async (_event: string, listener: (data: unknown) => void) => {
            native.listener = listener;
            return { remove: async () => { native.listener = null; } };
        },
    }),
}));

class MockWorker {
    onmessage: ((value: unknown) => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
}
(globalThis as any).Worker = MockWorker;
URL.createObjectURL = vi.fn(() => 'blob:mock-rest');
URL.revokeObjectURL = vi.fn();

import { useTimer } from '../../hooks/useTimer';

describe('Android native rest state is authoritative', () => {
    beforeEach(() => {
        native.enabled = true;
        native.endAt = 0;
        native.duration = 120;
        native.epoch = 1;
        native.exercise = -1;
        native.set = -1;
        native.listener = null;
        native.read.mockClear();
        native.consume.mockClear();
        native.schedule.mockClear();
        native.cancel.mockClear();
    });

    it('restores a live deadline, original duration and source after process recreation without rescheduling', async () => {
        native.endAt = Date.now() + 91000;
        native.duration = 150;
        native.exercise = 543;
        native.set = 5;
        const { result } = renderHook(() => useTimer('es'));
        await waitFor(() => expect(result.current.restTimer.active).toBe(true));
        expect(result.current.restTimer.endAt).toBe(native.endAt);
        expect(result.current.restTimer.duration).toBe(150);
        expect(result.current.restTimer.source).toEqual({ exerciseInstanceId: 543, setId: 5 });
        expect(native.schedule).not.toHaveBeenCalled();
        expect(native.cancel).not.toHaveBeenCalled();
    });

    it('applies a native +30s action while JS is live, without rewriting the native epoch', async () => {
        native.endAt = Date.now() + 90000;
        native.duration = 90;
        const { result } = renderHook(() => useTimer('es'));
        await waitFor(() => expect(result.current.restTimer.active).toBe(true));
        await waitFor(() => expect(native.listener).not.toBeNull());
        const first = native.endAt;
        native.endAt += 30000;
        native.duration += 30;
        act(() => native.listener?.({ epoch: 1, command: { action: 'add30', id: 1, endAt: native.endAt } }));
        await waitFor(() => expect(result.current.restTimer.endAt).toBe(first + 30000));
        expect(result.current.restTimer.duration).toBe(120);
        expect(native.schedule).not.toHaveBeenCalled();
        expect(native.cancel).not.toHaveBeenCalled();
    });

    it('accepts a native skip without sending a redundant cancellation', async () => {
        native.endAt = Date.now() + 60000;
        const { result } = renderHook(() => useTimer('en'));
        await waitFor(() => expect(result.current.restTimer.active).toBe(true));
        await waitFor(() => expect(native.listener).not.toBeNull());
        native.endAt = 0;
        act(() => native.listener?.({ epoch: 1, command: { action: 'skip', id: 1, endAt: 0 } }));
        await waitFor(() => expect(result.current.restTimer.active).toBe(false));
        expect(native.cancel).not.toHaveBeenCalled();
    });

    it('an inactive native snapshot never cancels alarms on app mount', async () => {
        const { result } = renderHook(() => useTimer('es'));
        await waitFor(() => expect(native.read).toHaveBeenCalled());
        expect(result.current.restTimer.active).toBe(false);
        expect(native.cancel).not.toHaveBeenCalled();
        expect(native.schedule).not.toHaveBeenCalled();
    });

    it('a late startup snapshot cannot overwrite a rest that the user just started', async () => {
        let release!: (value: {
            active: boolean; endAt: number; duration: number; epoch: number;
            sourceExerciseInstanceId: number; sourceSetId: number;
        }) => void;
        native.read.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
        const { result } = renderHook(() => useTimer('en'));
        const endAt = Date.now() + 110000;
        act(() => result.current.setRestTimer({ active: true, endAt, duration: 110, timeLeft: 110 }));
        await waitFor(() => expect(native.read).toHaveBeenCalled());
        await act(async () => {
            release({
                active: true, endAt: Date.now() + 5000, duration: 5, epoch: 1,
                sourceExerciseInstanceId: -1, sourceSetId: -1,
            });
        });
        await waitFor(() => expect(native.schedule).toHaveBeenCalledTimes(1));
        expect(result.current.restTimer.endAt).toBe(endAt);
        expect(native.schedule).toHaveBeenCalledWith(expect.objectContaining({ endAt }));
    });

    it('user-started rests schedule the Android alarm after the initial reconciliation', async () => {
        const { result } = renderHook(() => useTimer('es'));
        await waitFor(() => expect(native.read).toHaveBeenCalled());
        const deadline = Date.now() + 100000;
        act(() => result.current.setRestTimer({
            active: true, endAt: deadline, duration: 100, timeLeft: 100,
            source: { exerciseInstanceId: 23, setId: 1 },
        }));
        await waitFor(() => expect(native.schedule).toHaveBeenCalledTimes(1));
        expect(native.schedule).toHaveBeenCalledWith(expect.objectContaining({
            endAt: deadline, duration: 100,
            sourceExerciseInstanceId: 23, sourceSetId: 1,
        }));
    });
});
