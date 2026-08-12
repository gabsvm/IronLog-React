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
        // The countdown is timestamp-based, so a 1 Hz worker is enough. The old
        // 250 ms ticker woke the WebView four times per second even though React
        // only displayed whole seconds.
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

        // Browser/PWA only. Android notifications are handled by NativeBridge.
        if (!isNative && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }

        return () => {
            workerRef.current?.terminate();
            URL.revokeObjectURL(blobUrl);
        };
    }, [isNative]);

    // Keep an OS-level timer scheduled in the installed Android build. This
    // effect deliberately ignores timeLeft so the alarm is NOT rescheduled every
    // second; only start/stop/endAt changes touch the native layer.
    useEffect(() => {
        if (!isNative) return;

        if (timer.active && timer.endAt > Date.now()) {
            const t = TRANSLATIONS[lang]?.timer || TRANSLATIONS.en.timer;
            scheduleNativeRestTimer(timer.endAt, t.finished, t.getBack);
        } else {
            cancelNativeRestTimer();
        }
    }, [isNative, timer.active, timer.endAt, lang]);

    const handleTick = useCallback(() => {
        setTimer(prev => {
            if (!prev || !prev.active) return prev;

            const now = Date.now();
            const remainingMs = Math.max(0, (prev.endAt || 0) - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);

            // Updating document.title is useful for browser tabs but is wasted DOM
            // work inside the installed Capacitor shell.
            if (!isNative) {
                document.title = secondsLeft > 0
                    ? `(${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}) Resting...`
                    : 'GainsLab Pro';
            }

            if (secondsLeft <= 0) {
                // When foregrounded, JS owns immediate feedback. If Android put
                // the WebView to sleep, the native AlarmManager receiver owns it.
                playTimerFinishSound();
                triggerHaptic('success');

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
                                    icon: '/assets/icons/icon-192.webp',
                                    tag: 'gainslab-timer',
                                    vibrate: [200, 100, 200]
                                } as any);
                            }).catch(() => {
                                try {
                                    new Notification(title, {
                                        body,
                                        icon: '/assets/icons/icon-192.webp',
                                        tag: 'gainslab-timer'
                                    });
                                } catch (e) {}
                            });
                        } else {
                            new Notification(title, {
                                body,
                                icon: '/assets/icons/icon-192.webp',
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
        workerRef.current.onmessage = handleTick;

        if (timer.active) {
            workerRef.current.postMessage('start');
        } else {
            workerRef.current.postMessage('stop');
            if (!isNative) document.title = 'GainsLab Pro';
        }
    }, [timer.active, handleTick, isNative]);

    // Recalculate immediately after returning to the app instead of waiting for
    // the next worker tick. This also self-corrects any WebView timer throttling.
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleTick();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [handleTick]);

    return { restTimer: timer, setRestTimer: setTimer };
};
