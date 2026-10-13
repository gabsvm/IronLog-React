import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    cancelNativeRestTimer,
    consumePendingTimerCommands,
    getNativeRestTimerState,
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
    const [nativeReady, setNativeReady] = useState(!isNative);
    const [nativeUserRevision, setNativeUserRevision] = useState(0);
    const nativeUserRevisionRef = useRef(0);
    const nativeRefreshGeneration = useRef(0);
    const nativeReconcilingRef = useRef(false);

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


    // Only explicit JS controls schedule/cancel native alarms. Native actions,
    // process restoration and countdown ticks MUST NOT rewrite the native
    // deadline/epoch: doing so can erase a +30s action while JS is suspended.
    useEffect(() => {
        if (!isNative || !nativeReady || nativeUserRevision === 0) return;
        if (timer.active && timer.endAt > Date.now()) {
            const t = TRANSLATIONS[lang]?.timer || TRANSLATIONS.en.timer;
            scheduleNativeRestTimer(
                timer.endAt, t.finished, t.getBack, t.resting, t.restingBody,
                timer.duration, timer.source,
            );
        } else {
            cancelNativeRestTimer();
        }
        // Triggered by user actions only, never timer ticks or native restores.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNative, nativeReady, nativeUserRevision]);

    const handleTick = useCallback((suppressFeedback = false) => {
        const current = timerRef.current;
        if (!current || !current.active) return;
        // Android is the sole owner while backgrounded or during a native
        // reconciliation; a delayed JS tick must never end an extended rest.
        if (isNative && (nativeReconcilingRef.current || document.visibilityState !== 'visible')) return;

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

    // Web/PWA resyncs on resume. Native instead reads the OS snapshot FIRST.
    useEffect(() => {
        if (isNative) return;
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleTick(false);
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [handleTick, isNative]);

    // Native state is authoritative after WebView recreation or background
    // notification actions. Command stream is drained before reading the
    // snapshot so +30s/Skip can never be undone by stale JS scheduling.
    useEffect(() => {
        if (!isNative) return;
        let cancelled = false;
        let removeListener: (() => void) | undefined;
        const reconcile = async (fallbackCommands: TimerCommandPayload[] = [], fallbackEpoch = -1) => {
            const generation = ++nativeRefreshGeneration.current;
            const userRevision = nativeUserRevisionRef.current;
            nativeReconcilingRef.current = true;
            try {
                const stream = await consumePendingTimerCommands();
                const native = await getNativeRestTimerState();
                if (cancelled || generation !== nativeRefreshGeneration.current
                    || userRevision !== nativeUserRevisionRef.current) return;
                if (native) {
                    const validActive = native.active && native.endAt > Date.now();
                    setTimer(prev => validActive ? {
                        ...prev,
                        active: true,
                        endAt: native.endAt,
                        timeLeft: Math.ceil((native.endAt - Date.now()) / 1000),
                        duration: Math.max(1, native.duration),
                        source: native.sourceExerciseInstanceId >= 0 && native.sourceSetId >= 0
                            ? { exerciseInstanceId: native.sourceExerciseInstanceId, setId: native.sourceSetId }
                            : undefined,
                    } : {
                        ...prev, active: false, timeLeft: 0, endAt: 0, source: undefined,
                    });
                } else {
                    // Older native shell / test double without snapshot API.
                    const commands = stream.commands.length ? stream.commands : fallbackCommands;
                    const epoch = stream.commands.length ? stream.epoch : fallbackEpoch;
                    if (commands.length) applyTimerCommands(commands, epoch, setTimer);
                }
            } catch {
                // On bridge failures, leave existing JS state intact.
            } finally {
                if (!cancelled && generation === nativeRefreshGeneration.current) {
                    nativeReconcilingRef.current = false;
                    setNativeReady(true);
                }
            }
        };
        void reconcile();
        void subscribeTimerCommands(stream => {
            if (!cancelled) void reconcile(stream.commands, stream.epoch);
        }).then(remove => {
            if (cancelled) remove(); else removeListener = remove;
        });
        const onResume = () => {
            if (document.visibilityState === 'visible') void reconcile();
        };
        document.addEventListener('visibilitychange', onResume);
        window.addEventListener('focus', onResume);
        return () => {
            cancelled = true;
            nativeRefreshGeneration.current += 1;
            nativeReconcilingRef.current = false;
            document.removeEventListener('visibilitychange', onResume);
            window.removeEventListener('focus', onResume);
            removeListener?.();
        };
    }, [isNative]);

    const setRestTimer = useCallback((action: React.SetStateAction<TimerState>) => {
        // Only this user-intent entry point may mutate the OS alarm. Native
        // commands and background hydration call setTimer directly instead.
        if (isNative) {
            nativeUserRevisionRef.current += 1;
            setNativeUserRevision(nativeUserRevisionRef.current);
        }
        setTimer(prev => {
            const next = typeof action === 'function' ? (action as (p: TimerState) => TimerState)(prev) : action;
            timerRef.current = next;
            return next;
        });
    }, [isNative]);

    return { restTimer: timer, setRestTimer };
};
