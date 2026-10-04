// Q9: notification-action commands — apply/epoch/idempotency, consume/subscribe
// wrappers with a simulated bridge, and the useTimer sync effect.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { sim } = vi.hoisted(() => {
    const sim = {
        isNative: false,
        consumeResult: { epoch: 1, commands: [] as { id: number; action: 'add30' | 'skip'; endAt: number }[] },
        consume: null as unknown as ReturnType<typeof vi.fn>,
        listenerCb: null as null | ((data: unknown) => void),
        removeListener: vi.fn(async () => {}),
    };
    sim.consume = vi.fn(async () => sim.consumeResult);
    return { sim };
});

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => sim.isNative,
        getPlatform: () => 'android',
    },
    registerPlugin: () => ({
        haptic: async () => {},
        scheduleRestTimer: async () => {},
        cancelRestTimer: async () => {},
        canScheduleExactAlarms: async () => ({ granted: true, sdkInt: 34 }),
        openExactAlarmSettings: async () => {},
        consumePendingTimerCommands: () => sim.consume(),
        addListener: async (_event: string, cb: (data: unknown) => void) => {
            sim.listenerCb = cb;
            return { remove: () => sim.removeListener() };
        },
    }),
}));

import {
    consumePendingTimerCommands,
    subscribeTimerCommands,
    type TimerCommandPayload,
} from '../../utils/audio';
import { applyTimerCommands, useTimer, type TimerState } from '../../hooks/useTimer';

const CURSOR_KEY = 'il_timer_cmd_cursor_v1';

const ACTIVE_REST: TimerState = {
    active: true,
    timeLeft: 60,
    duration: 90,
    endAt: Date.now() + 60000,
};

const runUpdaters = (initial: TimerState, calls: unknown[][]): TimerState => {
    let state = initial;
    for (const [updater] of calls) {
        state =
            typeof updater === 'function'
                ? (updater as (p: TimerState) => TimerState)(state)
                : (updater as TimerState);
    }
    return state;
};

describe('Q9: applyTimerCommands', () => {
    beforeEach(() => {
        window.localStorage.removeItem(CURSOR_KEY);
        vi.useRealTimers();
    });

    it('add30 adopts the native endAt and extends the duration on an active rest', () => {
        const setRestTimer = vi.fn();
        const endAt = Date.now() + 90000;
        applyTimerCommands([{ id: 1, action: 'add30', endAt }], 1, setRestTimer);
        expect(setRestTimer).toHaveBeenCalledTimes(1);
        const next = runUpdaters(ACTIVE_REST, setRestTimer.mock.calls);
        expect(next.endAt).toBe(endAt);
        expect(next.duration).toBe(ACTIVE_REST.duration + 30);
        expect(next.timeLeft).toBeGreaterThan(0);
        expect(next.active).toBe(true);
        expect(window.localStorage.getItem(CURSOR_KEY)).toBe(JSON.stringify({ epoch: 1, lastId: 1 }));
    });

    it('ignores add30 on an inactive rest but still advances the cursor', () => {
        const setRestTimer = vi.fn();
        applyTimerCommands([{ id: 1, action: 'add30', endAt: Date.now() + 30000 }], 1, setRestTimer);
        const next = runUpdaters({ ...ACTIVE_REST, active: false }, setRestTimer.mock.calls);
        expect(next.active).toBe(false);
        expect(next.endAt).toBe(ACTIVE_REST.endAt);
        // Redelivery applies nothing.
        setRestTimer.mockClear();
        applyTimerCommands([{ id: 1, action: 'add30', endAt: Date.now() + 30000 }], 1, setRestTimer);
        expect(setRestTimer).not.toHaveBeenCalled();
    });

    it('skip deactivates like the pill skip', () => {
        const setRestTimer = vi.fn();
        applyTimerCommands([{ id: 1, action: 'skip', endAt: 0 }], 1, setRestTimer);
        const next = runUpdaters(ACTIVE_REST, setRestTimer.mock.calls);
        expect(next).toMatchObject({ active: false, timeLeft: 0, endAt: 0 });
        expect(next.source).toBeUndefined();
    });

    it('applies out-of-order batches in id order, exactly once', () => {
        const setRestTimer = vi.fn();
        const t1 = Date.now() + 90000;
        const t2 = Date.now() + 120000;
        applyTimerCommands(
            [
                { id: 2, action: 'add30', endAt: t2 },
                { id: 1, action: 'add30', endAt: t1 },
            ],
            1,
            setRestTimer,
        );
        expect(setRestTimer).toHaveBeenCalledTimes(2);
        const next = runUpdaters(ACTIVE_REST, setRestTimer.mock.calls);
        expect(next.endAt).toBe(t2);
        expect(next.duration).toBe(ACTIVE_REST.duration + 60);

        setRestTimer.mockClear();
        applyTimerCommands(
            [
                { id: 1, action: 'add30', endAt: t1 },
                { id: 2, action: 'add30', endAt: t2 },
            ],
            1,
            setRestTimer,
        );
        expect(setRestTimer).not.toHaveBeenCalled();
    });

    it('a new epoch resets the cursor so fresh rests accept id 1 again', () => {
        const setRestTimer = vi.fn();
        applyTimerCommands([{ id: 1, action: 'skip', endAt: 0 }], 1, setRestTimer);
        expect(setRestTimer).toHaveBeenCalledTimes(1);
        applyTimerCommands([{ id: 1, action: 'skip', endAt: 0 }], 2, setRestTimer);
        expect(setRestTimer).toHaveBeenCalledTimes(2);
        expect(window.localStorage.getItem(CURSOR_KEY)).toBe(JSON.stringify({ epoch: 2, lastId: 1 }));
    });

    it('skips malformed commands without advancing past them', () => {
        const setRestTimer = vi.fn();
        applyTimerCommands(
            [
                { id: 1, action: 'add30', endAt: Number.NaN },
                { id: 2, action: 'skip', endAt: 0 },
            ] as TimerCommandPayload[],
            1,
            setRestTimer,
        );
        expect(setRestTimer).toHaveBeenCalledTimes(1);
        const next = runUpdaters(ACTIVE_REST, setRestTimer.mock.calls);
        expect(next.active).toBe(false);
    });
});

describe('Q9: command stream wrappers', () => {
    beforeEach(() => {
        sim.isNative = false;
        sim.consume.mockClear();
    });

    it('consume returns empty off native, validated stream on native', async () => {
        expect(await consumePendingTimerCommands()).toEqual({ epoch: -1, commands: [] });
        expect(sim.consume).not.toHaveBeenCalled();

        sim.isNative = true;
        sim.consumeResult = {
            epoch: 4,
            commands: [
                { id: 1, action: 'add30', endAt: 123 },
                { id: 2, action: 'nope', endAt: 5 },
            ] as never,
        };
        expect(await consumePendingTimerCommands()).toEqual({
            epoch: 4,
            commands: [{ id: 1, action: 'add30', endAt: 123 }],
        });
    });

    it('subscribe delivers validated live events and unsubscribes', async () => {
        const cb = vi.fn();
        const remove = await subscribeTimerCommands(cb);
        await remove();
        expect(sim.listenerCb).toBeNull();

        sim.isNative = true;
        const removeLive = await subscribeTimerCommands(cb);
        expect(sim.listenerCb).not.toBeNull();
        sim.listenerCb?.({ epoch: 4, command: { id: 9, action: 'skip', endAt: 0 } });
        sim.listenerCb?.({ epoch: 4, command: { id: 10, action: 'bogus', endAt: 0 } });
        sim.listenerCb?.('garbage');
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith({ epoch: 4, commands: [{ id: 9, action: 'skip', endAt: 0 }] });
        await removeLive();
        expect(sim.removeListener).toHaveBeenCalledTimes(1);
    });
});

describe('Q9: useTimer drains commands on mount and resume', () => {
    class MockWorker {
        onmessage: ((e: unknown) => void) | null = null;
        postMessage = vi.fn();
        terminate = vi.fn();
    }

    // Module-level like timerNotifications.test.ts: RTL auto-cleanup unmounts
    // after afterEach hooks, so per-test restore would break worker teardown.
    (globalThis as Record<string, unknown>).Worker = MockWorker;
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();

    beforeEach(() => {
        window.localStorage.removeItem(CURSOR_KEY);
        sim.isNative = true;
        sim.listenerCb = null;
        sim.consume.mockClear();
        sim.consumeResult = { epoch: 1, commands: [] };
    });

    it('applies a drained add30 to the live rest', async () => {
        const endAt = Date.now() + 120000;
        sim.consumeResult = { epoch: 3, commands: [{ id: 1, action: 'add30', endAt }] };
        const { result } = renderHook(() => useTimer('es'));
        act(() => {
            result.current.setRestTimer({ ...ACTIVE_REST });
        });
        await waitFor(() => expect(result.current.restTimer.endAt).toBe(endAt));
        expect(result.current.restTimer.duration).toBe(ACTIVE_REST.duration + 30);
    });

    it('drains again on foregrounding', async () => {
        sim.consumeResult = { epoch: 3, commands: [] };
        const { result } = renderHook(() => useTimer('es'));
        act(() => {
            result.current.setRestTimer({ ...ACTIVE_REST });
        });
        await waitFor(() => expect(sim.consume).toHaveBeenCalled());

        sim.consumeResult = { epoch: 3, commands: [{ id: 1, action: 'skip', endAt: 0 }] };
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await waitFor(() => expect(result.current.restTimer.active).toBe(false));
    });

    it('does nothing on web', async () => {
        sim.isNative = false;
        sim.consumeResult = { epoch: 3, commands: [{ id: 1, action: 'skip', endAt: 0 }] };
        const { result } = renderHook(() => useTimer('es'));
        act(() => {
            result.current.setRestTimer({ ...ACTIVE_REST });
        });
        await new Promise((r) => setTimeout(r, 100));
        expect(sim.consume).not.toHaveBeenCalled();
        expect(result.current.restTimer.active).toBe(true);
    });
});
