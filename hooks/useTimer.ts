import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    cancelNativeRestTimer,
    consumePendingTimerCommands,
    playTimerFinishSound,
    scheduleNativeRestTimer,
    subscribeTimerCommands,
    triggerHaptic,
    type TimerCommandPayload,
} from '../utils/audio';
import { TRANSLATIONS } from '../constants';
import { Lang } from '../types';

export interface TimerState {
    active: boolean;
    timeLeft: number;
    duration: number;
    endAt: number;
    source?: {
        exerciseInstanceId: number;
        setId: number;
    };
}

/**
 * Request notification permission safely, only from explicit user action
 * (the Settings notifications row), rather than unconditionally on app mount.
 *
 * NOTE FOR TEAM: In mobile PWA / browsers, background workers get suspended when the device
 * screen is locked or app is deeply frozen, making web background notifications best-effort.
 * In Capacitor native builds, native Android AlarmManager (scheduleNativeRestTimer) handles
 * reliable wakeups and background notifications.
 */
export const requestTimerNotificationPermission = async (): Promise<NotificationPermission | null> => {
    if (Capacitor.isNativePlatform() || !('Notification' in window)) return null;
    if (Notification.permission === 'default') {
        try {
            return await Notification.requestPermission();
        } catch {
            return null;
        }
    }
    return Notification.permission;
};

const TIMER_COMMAND_CURSOR_KEY = 'il_timer_cmd_cursor_v1';

interface TimerCommandCursor {
    epoch: number;
    lastId: number;
}

const readCommandCursor = (): TimerCommandCursor => {
    try {
        const raw = window.localStorage.getItem(TIMER_COMMAND_CURSOR_KEY);
        if (!raw) return { epoch: -1, lastId: 0 };
        const parsed = JSON.parse(raw) as Partial<TimerCommandCursor>;
        if (!Number.isInteger(parsed.epoch) || !Number.isInteger(parsed.lastId)) {
            return { epoch: -1, lastId: 0 };
        }
        return { epoch: parsed.epoch as number, lastId: parsed.lastId as number };
    } catch {
        return { epoch: -1, lastId: 0 };
    }
};

const writeCommandCursor = (cursor: TimerCommandCursor): void => {
    try {
        window.localStorage.setItem(TIMER_COMMAND_CURSOR_KEY, JSON.stringify(cursor));
    } catch {
        // Best-effort: worst case a command applies twice across reloads,
        // which the idempotent updates below tolerate.
    }
};

/**
 * Q9: applies native notification-action commands to the JS timer exactly
 * once. Commands arrive ordered by id; a new rest epoch resets the cursor so
 * stale streams can never leak into a fresh rest. add30 adopts the native
 * endAt (the alarm already moved); skip mirrors the pill's skip.
 */
export const applyTimerCommands = (
    commands: TimerCommandPayload[],
    epoch: number,
    setRestTimer: Dispatch<SetStateAction<TimerState>>,
): void => {
    let cursor = readCommandCursor();
    if (cursor.epoch !== epoch) cursor = { epoch, lastId: 0 };
    const ordered = [...commands].sort((a, b) => a.id - b.id);
    let applied = false;
    for (const cmd of ordered) {
        if (!Number.isInteger(cmd.id) || cmd.id <= cursor.lastId) continue;
        if (cmd.action === 'skip') {
            cursor.lastId = cmd.id;
            applied = true;
            setRestTimer((prev) => ({ ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined }));
        } else if (cmd.action === 'add30') {
            if (!Number.isFinite(cmd.endAt) || cmd.endAt <= 0) continue;
            cursor.lastId = cmd.id;
            applied = true;
            const endAt = cmd.endAt;
            setRestTimer((prev) => {
                if (!prev.active) return prev;
                return {
                    ...prev,
                    endAt,
                    timeLeft: Math.max(0, Math.round((endAt - Date.now()) / 1000)),
                    duration: prev.duration + 30,
                };
            });
        }
    }
    if (applied) writeCommandCursor(cursor);
};

export const useTimer = (lang: Lang) => {
    const [timer, setTimer] = useState<TimerState>({ active: false, timeLeft: 0, duration: 120, endAt: 0 });
    const timerRef = useRef<TimerState>(timer);
    timerRef.current = timer;
    const workerRef = useRef<Worker | null>(null);
    const langRef = useRef(lang);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        langRef.current = lang;
    }, [lang]);

    useEffect(() => {
        // The countdown is timestamp-based and only renders whole seconds, so a
        // 1 Hz wakeup is enough. This replaces the old 250 ms worker cadence.
        const workerCode = `
            let interval = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    if (interval) clearInterval(interval);
                    interval = setInterval(() => {
                        self.postMessage('tick');
                    }, 1000);
                } else if (e.data === 'stop') {
                    if (interval) clearInterval(interval);
                    interval = null;
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(blobUrl);

        return () => {
            workerRef.current?.terminate();
            URL.revokeObjectURL(blobUrl);
        };
    }, [isNative]);


    // Schedule/cancel the Android OS alarm only when the timer identity changes,
    // not on every displayed second.
    useEffect(() => {
        if (!isNative) return;

        if (timer.active && timer.endAt > Date.now()) {
            const t = TRANSLATIONS[lang]?.timer || TRANSLATIONS.en.timer;
            scheduleNativeRestTimer(timer.endAt, t.finished, t.getBack, t.resting, t.restingBody);
        } else {
            cancelNativeRestTimer();
        }
    }, [isNative, timer.active, timer.endAt, lang]);

    const handleTick = useCallback((suppressFeedback = false) => {
        const current = timerRef.current;
        if (!current || !current.active) return;

        const remainingMs = Math.max(0, (current.endAt || 0) - Date.now());
        const secondsLeft = Math.ceil(remainingMs / 1000);

        if (!isNative) {
            document.title = secondsLeft > 0
                ? `(${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}) Resting...`
                : 'GainsLab Pro';
        }

        if (secondsLeft <= 0) {
            // Visible JS owns immediate feedback. When native Android is in
            // background, RestTimerReceiver owns it instead. A visibility
            // resync passes suppressFeedback=true so reopening the app after
            // a native alarm does not beep/vibrate a second time.
            const shouldEmitFeedback = !suppressFeedback && (!isNative || document.visibilityState === 'visible');
            if (shouldEmitFeedback) {
                playTimerFinishSound();
                triggerHaptic('success');
            }

            const isWebInBackground = !isNative && document.visibilityState !== 'visible';
            if (isWebInBackground && 'Notification' in window && Notification.permission === 'granted') {
                const currentLang = langRef.current;
                const t = TRANSLATIONS[currentLang]?.timer || TRANSLATIONS.en.timer;
                const title = t.finished;
                const body = t.getBack;

                try {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(title, {
                                body,
                                icon: '/icon-192.png',
                                tag: 'gainslab-timer',
                                vibrate: [200, 100, 200]
                            } as any);
                        }).catch(() => {
                            try {
                                new Notification(title, {
                                    body,
                                    icon: '/icon-192.png',
                                    tag: 'gainslab-timer'
                                });
                            } catch (e) {}
                        });
                    } else {
                        new Notification(title, {
                            body,
                            icon: '/icon-192.png',
                            tag: 'gainslab-timer'
                        });
                    }
                } catch (e) {
                    console.warn('Notification failed', e);
                }
            }

            if (!isNative) document.title = 'GainsLab Pro';
            workerRef.current?.postMessage('stop');
            const nextState: TimerState = { ...current, active: false, timeLeft: 0, endAt: 0, source: undefined };
            timerRef.current = nextState;
            setTimer(nextState);
            // Announce natural completion (skips never reach this branch, so
            // listeners can tell a finished rest from a dismissed one).
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
            }
            return;
        }

        if (secondsLeft === current.timeLeft) return;
        const nextState: TimerState = { ...current, timeLeft: secondsLeft };
        timerRef.current = nextState;
        setTimer(nextState);
    }, [isNative]);

    useEffect(() => {
        if (!workerRef.current) return;
        workerRef.current.onmessage = () => handleTick(false);

        if (timer.active) {
            workerRef.current.postMessage('start');
        } else {
            workerRef.current.postMessage('stop');
            if (!isNative) document.title = 'GainsLab Pro';
        }
    }, [timer.active, handleTick, isNative]);

    // Recalculate immediately after returning from background. Native resync is
    // state-only because AlarmManager already owns background completion feedback.
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleTick(isNative);
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [handleTick, isNative]);

    // Q9: sync notification-action commands (+30s/skip tapped with frozen JS).
    // Drains the native stream on mount and on every return to foreground,
    // plus live events while the bridge is alive. No-op on web.
    useEffect(() => {
        if (!isNative) return;
        let cancelled = false;
        const drain = async () => {
            try {
                const stream = await consumePendingTimerCommands();
                if (!cancelled && stream.commands.length > 0) {
                    applyTimerCommands(stream.commands, stream.epoch, setTimer);
                }
            } catch {
                // Best-effort: the next resume retries.
            }
        };
        void drain();
        let unsubscribe: (() => void) | undefined;
        void subscribeTimerCommands((stream) => {
            if (!cancelled && stream.commands.length > 0) {
                applyTimerCommands(stream.commands, stream.epoch, setTimer);
            }
        }).then((remove) => {
            unsubscribe = remove;
        });
        const onResume = () => void drain();
        document.addEventListener('visibilitychange', onResume);
        window.addEventListener('focus', onResume);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onResume);
            window.removeEventListener('focus', onResume);
            unsubscribe?.();
        };
        // setTimer is a stable useState setter; drain on mount + resume only.
    }, [isNative]);

    const setRestTimer = useCallback((action: React.SetStateAction<TimerState>) => {
        setTimer(prev => {
            const next = typeof action === 'function' ? (action as (p: TimerState) => TimerState)(prev) : action;
            timerRef.current = next;
            return next;
        });
    }, []);

    return { restTimer: timer, setRestTimer };
};
