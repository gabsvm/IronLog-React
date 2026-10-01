import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('scheduleWhenIdle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetModules();
        delete (window as any).requestIdleCallback;
        delete (window as any).cancelIdleCallback;
        vi.restoreAllMocks();
    });

    it('defers the callback with setTimeout when requestIdleCallback is unavailable', async () => {
        expect(typeof (window as any).requestIdleCallback).not.toBe('function');
        const { scheduleWhenIdle } = await import('../../lib/idle');

        const cb = vi.fn();
        scheduleWhenIdle(cb);

        expect(cb).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(250);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('caps the setTimeout fallback delay at 250ms', async () => {
        const { scheduleWhenIdle } = await import('../../lib/idle');

        const cb = vi.fn();
        scheduleWhenIdle(cb, 10_000);

        await vi.advanceTimersByTimeAsync(250);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending fallback callback', async () => {
        const { scheduleWhenIdle } = await import('../../lib/idle');

        const cb = vi.fn();
        const cancel = scheduleWhenIdle(cb);
        cancel();

        await vi.advanceTimersByTimeAsync(1000);
        expect(cb).not.toHaveBeenCalled();
    });

    it('uses requestIdleCallback with the given timeout when available', async () => {
        const callbacks: Array<() => void> = [];
        (window as any).requestIdleCallback = vi.fn((cb: () => void) => {
            callbacks.push(cb);
            return callbacks.length;
        });
        (window as any).cancelIdleCallback = vi.fn();

        vi.resetModules();
        const { scheduleWhenIdle } = await import('../../lib/idle');

        const cb = vi.fn();
        scheduleWhenIdle(cb, 1000);

        expect((window as any).requestIdleCallback).toHaveBeenCalledTimes(1);
        expect((window as any).requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 1000 });
        expect(cb).not.toHaveBeenCalled();

        callbacks[0]();
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending requestIdleCallback handle', async () => {
        (window as any).requestIdleCallback = vi.fn(() => 42);
        const cancelIdleCallback = vi.fn();
        (window as any).cancelIdleCallback = cancelIdleCallback;

        vi.resetModules();
        const { scheduleWhenIdle } = await import('../../lib/idle');

        const cancel = scheduleWhenIdle(vi.fn());
        cancel();

        expect(cancelIdleCallback).toHaveBeenCalledWith(42);
    });
});
