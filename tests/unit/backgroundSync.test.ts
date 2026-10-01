import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestBackgroundSync, requestPeriodicSync } from '../../services/backgroundSync';

describe('Background Sync Best-Effort Registration (S4)', () => {
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
    });

    it('returns false when serviceWorker is not supported in navigator', async () => {
        Object.defineProperty(globalThis, 'navigator', {
            value: {},
            writable: true,
            configurable: true,
        });

        expect(await requestBackgroundSync()).toBe(false);
        expect(await requestPeriodicSync()).toBe(false);
    });

    it('returns false when sync/periodicSync capabilities are not supported by browser', async () => {
        Object.defineProperty(globalThis, 'navigator', {
            value: {
                serviceWorker: {
                    ready: Promise.resolve({}),
                },
            },
            writable: true,
            configurable: true,
        });

        expect(await requestBackgroundSync()).toBe(false);
        expect(await requestPeriodicSync()).toBe(false);
    });

    it('registers sync tag and returns true when supported', async () => {
        const mockSyncRegister = vi.fn().mockResolvedValue(undefined);
        const mockPeriodicSyncRegister = vi.fn().mockResolvedValue(undefined);

        Object.defineProperty(globalThis, 'navigator', {
            value: {
                serviceWorker: {
                    ready: Promise.resolve({
                        sync: { register: mockSyncRegister },
                        periodicSync: { register: mockPeriodicSyncRegister },
                    }),
                },
            },
            writable: true,
            configurable: true,
        });

        const syncResult = await requestBackgroundSync();
        expect(syncResult).toBe(true);
        expect(mockSyncRegister).toHaveBeenCalledWith('sync-workouts');

        const periodicResult = await requestPeriodicSync();
        expect(periodicResult).toBe(true);
        expect(mockPeriodicSyncRegister).toHaveBeenCalledWith('update-workouts-data', {
            minInterval: 6 * 60 * 60 * 1000,
        });
    });

    it('handles registration rejections gracefully without throwing', async () => {
        Object.defineProperty(globalThis, 'navigator', {
            value: {
                serviceWorker: {
                    ready: Promise.resolve({
                        sync: { register: vi.fn().mockRejectedValue(new Error('Permission denied')) },
                        periodicSync: { register: vi.fn().mockRejectedValue(new Error('Permission denied')) },
                    }),
                },
            },
            writable: true,
            configurable: true,
        });

        expect(await requestBackgroundSync()).toBe(false);
        expect(await requestPeriodicSync()).toBe(false);
    });
});
