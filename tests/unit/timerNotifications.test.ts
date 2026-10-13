import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';

vi.mock('../../utils/audio', () => ({
    playTimerFinishSound: vi.fn(),
    triggerHaptic: vi.fn(),
    scheduleNativeRestTimer: vi.fn(),
    getNativeRestTimerState: vi.fn(async () => null),
    cancelNativeRestTimer: vi.fn(),
    // Q9: useTimer's command-sync effect imports these; idle defaults keep
    // this suite's scheduling assertions unaffected.
    consumePendingTimerCommands: vi.fn(async () => ({ epoch: -1, commands: [] })),
    subscribeTimerCommands: vi.fn(async () => () => {}),
}));

let activeWorker: any = null;
class MockWorker {
    onmessage: any = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() {
        activeWorker = this;
    }
}
(globalThis as any).Worker = MockWorker;
if (!globalThis.URL) {
    (globalThis as any).URL = {} as any;
}
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
(globalThis as any).URL.revokeObjectURL = vi.fn();

import { useTimer, requestTimerNotificationPermission } from '../../hooks/useTimer';
import { scheduleNativeRestTimer, cancelNativeRestTimer } from '../../utils/audio';
import { TRANSLATIONS } from '../../constants';
import { useStore } from '../../lib/store';

describe('Task U2: Rest Timer Notification Permission and Visibility Scoping', () => {
    let mockRequestPermission: any;
    let originalNotification: any;

    beforeEach(() => {
        originalNotification = (globalThis as any).Notification;
        mockRequestPermission = vi.fn().mockResolvedValue('granted');
        (globalThis as any).Notification = {
            permission: 'default',
            requestPermission: mockRequestPermission,
        };
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    });

    afterEach(() => {
        (globalThis as any).Notification = originalNotification;
        vi.restoreAllMocks();
    });

    it('does NOT request notification permission on initial mount', () => {
        renderHook(() => useTimer('es'));
        expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('does NOT request notification permission when the timer starts (Settings-only)', async () => {
        const { result } = renderHook(() => useTimer('es'));

        expect(mockRequestPermission).not.toHaveBeenCalled();

        // Start timer
        act(() => {
            result.current.setRestTimer({
                active: true,
                duration: 60,
                timeLeft: 60,
                endAt: Date.now() + 60000,
            });
        });

        // Microtask to allow async request
        await Promise.resolve();
        expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('requestTimerNotificationPermission respects Capacitor native platform and skips web Notification', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

        const perm = await requestTimerNotificationPermission();
        expect(perm).toBeNull();
        expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('does not show system notification when document is visible', async () => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'visible',
        });

        const notificationSpy = vi.fn();
        (globalThis as any).Notification = class MockNotification {
            constructor(public title: string, public options?: any) {
                notificationSpy(title, options);
            }
            static permission = 'granted';
            static requestPermission = vi.fn();
        };

        const { result } = renderHook(() => useTimer('es'));

        // Advance to 0
        act(() => {
            result.current.setRestTimer({
                active: true,
                duration: 1,
                timeLeft: 1,
                endAt: Date.now() - 1000,
            });
        });

        // Trigger tick via activeWorker onmessage
        act(() => {
            activeWorker?.onmessage?.();
        });

        // When visible, system Notification constructor must NOT be called
        expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('shows system notification when document is hidden (background tab)', async () => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
        });

        const notificationSpy = vi.fn();
        (globalThis as any).Notification = class MockNotification {
            constructor(public title: string, public options?: any) {
                notificationSpy(title, options);
            }
            static permission = 'granted';
            static requestPermission = vi.fn();
        };

        const { result } = renderHook(() => useTimer('es'));

        act(() => {
            result.current.setRestTimer({
                active: true,
                duration: 1,
                timeLeft: 1,
                endAt: Date.now() - 1000,
            });
        });

        act(() => {
            activeWorker?.onmessage?.();
        });

        expect(notificationSpy).toHaveBeenCalled();
    });

    it('initial Android schedule already includes the real upcoming exercise and set', async () => {
        const originalState = useStore.getState();
        const session = {
                id: 41, dayIdx: 0, name: 'Torso', startTime: Date.now(), mesoId: 1, week: 1,
                exercises: [{
                    id: 'bench', instanceId: 3, muscle: 'CHEST',
                    name: { es: 'Press banca', en: 'Bench press' },
                    sets: [1, 2, 3, 4].map((index) => ({
                        id: index + 10, weight: 80, reps: 8, rpe: '',
                        completed: index <= 2, type: 'regular' as const,
                    })),
                }],
            };
        // The full test suite runs other store mutations concurrently in
        // separate fixtures. Pin this lookup to a deterministic snapshot.
        const lookup = vi.spyOn(useStore, 'getState').mockReturnValue({
            ...originalState, activeSession: session,
        });
        try {
            vi.clearAllMocks();
            vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
            const { result } = renderHook(() => useTimer('es'));
            const endAt = Date.now() + 120000;
            act(() => {
                result.current.setRestTimer({
                    active: true, duration: 120, timeLeft: 120, endAt,
                    source: { exerciseInstanceId: 3, setId: 12 },
                });
            });
            await waitFor(() => expect(scheduleNativeRestTimer).toHaveBeenCalledWith(
                endAt, TRANSLATIONS.es.timer.finished, TRANSLATIONS.es.timer.getBack,
                'Descansando · Press banca', 'Próxima serie: 3 de 4', 120,
                { exerciseInstanceId: 3, setId: 12 }, 'Omitir',
            ));
        } finally {
            lookup.mockRestore();
        }
    });

    it('P7-3: on native, an active user-started rest schedules the OS alarm after restoring', async () => {
        vi.clearAllMocks();
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
        const { result } = renderHook(() => useTimer('es'));
        // Mount cancels any stale alarm (initial state is inactive); measure
        // only what the rest transitions below trigger.
        vi.clearAllMocks();

        const endAt = Date.now() + 90000;
        act(() => {
            result.current.setRestTimer({ active: true, duration: 90, timeLeft: 90, endAt });
        });

        await waitFor(() => expect(scheduleNativeRestTimer).toHaveBeenCalledWith(
            endAt,
            TRANSLATIONS.es.timer.finished,
            TRANSLATIONS.es.timer.getBack,
            TRANSLATIONS.es.timer.resting,
            TRANSLATIONS.es.timer.restingBody,
            90,
            undefined,
            'Omitir',
        ));
        expect(cancelNativeRestTimer).not.toHaveBeenCalled();
    });

    it('P7-3: user skip or expiration cancels the OS alarm instead', async () => {
        vi.clearAllMocks();
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
        const { result } = renderHook(() => useTimer('es'));
        vi.clearAllMocks();

        act(() => {
            result.current.setRestTimer({ active: true, duration: 90, timeLeft: 90, endAt: Date.now() + 90000 });
        });
        await waitFor(() => expect(scheduleNativeRestTimer).toHaveBeenCalledTimes(1));

        // Skipping (inactive) cancels the pending alarm.
        act(() => {
            result.current.setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
        });
        await waitFor(() => expect(cancelNativeRestTimer).toHaveBeenCalledTimes(1));

        // So does an already-expired endAt.
        act(() => {
            result.current.setRestTimer({ active: true, duration: 1, timeLeft: 1, endAt: Date.now() - 1000 });
        });
        expect(cancelNativeRestTimer).toHaveBeenCalledTimes(2);
        expect(scheduleNativeRestTimer).toHaveBeenCalledTimes(1);
    });

    it('J2: user +30s re-schedules with the new endAt and live texts', async () => {
        vi.clearAllMocks();
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
        const { result } = renderHook(() => useTimer('en'));
        vi.clearAllMocks();

        const endAt = Date.now() + 90000;
        act(() => {
            result.current.setRestTimer({ active: true, duration: 90, timeLeft: 90, endAt });
        });
        await waitFor(() => expect(scheduleNativeRestTimer).toHaveBeenCalledTimes(1));

        // +30s adjustment changes endAt: the same notification id is updated.
        const adjustedEndAt = endAt + 30000;
        act(() => {
            result.current.setRestTimer((prev) => ({ ...prev, endAt: adjustedEndAt, timeLeft: 120 }));
        });
        expect(scheduleNativeRestTimer).toHaveBeenCalledTimes(2);
        expect(scheduleNativeRestTimer).toHaveBeenLastCalledWith(
            adjustedEndAt,
            TRANSLATIONS.en.timer.finished,
            TRANSLATIONS.en.timer.getBack,
            TRANSLATIONS.en.timer.resting,
            TRANSLATIONS.en.timer.restingBody,
            90,
            undefined,
            'Skip',
        );
        expect(cancelNativeRestTimer).not.toHaveBeenCalled();
    });

    it('P7-3: on web, rests never touch the native alarm bridge', () => {
        vi.clearAllMocks();
        const { result } = renderHook(() => useTimer('es'));

        act(() => {
            result.current.setRestTimer({ active: true, duration: 90, timeLeft: 90, endAt: Date.now() + 90000 });
        });

        expect(scheduleNativeRestTimer).not.toHaveBeenCalled();
        expect(cancelNativeRestTimer).not.toHaveBeenCalled();
    });

    it('announces natural completion with ironlog:rest-completed (skips do not)', async () => {
        const completions: Event[] = [];
        const onCompleted = (event: Event) => completions.push(event);
        window.addEventListener('ironlog:rest-completed', onCompleted);

        try {
            const { result } = renderHook(() => useTimer('es'));

            // A running rest that reaches zero announces completion.
            act(() => {
                result.current.setRestTimer({
                    active: true,
                    duration: 1,
                    timeLeft: 1,
                    endAt: Date.now() - 1000,
                });
            });
            act(() => {
                activeWorker?.onmessage?.();
            });
            expect(result.current.restTimer.active).toBe(false);
            expect(completions).toHaveLength(1);

            // A fresh running rest that is skipped (not completed) stays silent.
            act(() => {
                result.current.setRestTimer({
                    active: true,
                    duration: 60,
                    timeLeft: 60,
                    endAt: Date.now() + 60000,
                });
            });
            act(() => {
                result.current.setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
            });
            expect(completions).toHaveLength(1);
        } finally {
            window.removeEventListener('ironlog:rest-completed', onCompleted);
        }
    });
});
