import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    cancelNativeRestTimer,
    playTimerFinishSound,
    scheduleNativeRestTimer,
    triggerHaptic,
} from '../utils/audio';
import { TRANSLATIONS } from '../constants';
import { Lang } from '../types';

export interface TimerState {
    active: boolean;
    timeLeft: number;
    duration: number;
    endAt: number;
}

export const useTimer = (lang: Lang) => {
    const [timer, setTimer] = useState<TimerState>({ active: false, timeLeft: 0, duration: 120, endAt: 0 });
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

        if (!isNative && 'Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission().catch(() => {});
        }

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
            scheduleNativeRestTimer(timer.endAt, t.finished, t.getBack);
        } else {
            cancelNativeRestTimer();
        }
    }, [isNative, timer.active, timer.endAt, lang]);

    const handleTick = useCallback((suppressFeedback = false) => {
        setTimer(prev => {
            if (!prev || !prev.active) return prev;

            const remainingMs = Math.max(0, (prev.endAt || 0) - Date.now());
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

                if (!isNative && 'Notification' in window && Notification.permission === 'granted') {
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
                return { ...prev, active: false, timeLeft: 0, endAt: 0 };
            }

            if (secondsLeft === prev.timeLeft) return prev;
            return { ...prev, timeLeft: secondsLeft };
        });
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

    return { restTimer: timer, setRestTimer: setTimer };
};
