
import { useState, useEffect, useRef, useCallback } from 'react';
import { playTimerFinishSound } from '../utils/audio';

export interface TimerState {
    active: boolean;
    timeLeft: number;
    duration: number;
    endAt: number;
}

export const useTimer = () => {
    const [timer, setTimer] = useState<TimerState>({ active: false, timeLeft: 0, duration: 120, endAt: 0 });
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Blob for inline worker to avoid external file issues
        const workerCode = `
            let interval = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    if (interval) clearInterval(interval);
                    interval = setInterval(() => {
                        self.postMessage('tick');
                    }, 250); 
                } else if (e.data === 'stop') {
                    if (interval) clearInterval(interval);
                    interval = null;
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));

        // Request Notification Permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const handleTick = useCallback(() => {
        setTimer(prev => {
            if (!prev || !prev.active) return prev;
            
            const now = Date.now();
            const remainingMs = Math.max(0, (prev.endAt || 0) - now);
            const secondsLeft = Math.ceil(remainingMs / 1000);
            
            // Update Title
            document.title = secondsLeft > 0 ? `(${Math.floor(secondsLeft/60)}:${(secondsLeft%60).toString().padStart(2,'0')}) Resting...` : "IronLog Pro";

            if (secondsLeft <= 0) {
                // FINISHED
                playTimerFinishSound();
                
                // Safe Notification Logic
                if ("Notification" in window && Notification.permission === "granted") {
                    try {
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.ready.then(registration => {
                                registration.showNotification("Rest Finished!", {
                                    body: "Get back to work!",
                                    icon: "/icon.svg",
                                    vibrate: [200, 100, 200]
                                } as any);
                            }).catch(() => {
                                // Silent fail or fallback
                                try {
                                    new Notification("Rest Finished!", {
                                        body: "Get back to work!",
                                        icon: "/icon.svg"
                                    });
                                } catch(e) {}
                            });
                        } else {
                            new Notification("Rest Finished!", {
                                body: "Get back to work!",
                                icon: "/icon.svg"
                            });
                        }
                    } catch (e) {
                        console.warn("Notification failed", e);
                    }
                }

                document.title = "IronLog Pro";
                workerRef.current?.postMessage('stop');
                return { ...prev, active: false, timeLeft: 0, endAt: 0 };
            }
            
            if (secondsLeft === prev.timeLeft) return prev;
            return { ...prev, timeLeft: secondsLeft };
        });
    }, []);

    useEffect(() => {
        if (!workerRef.current) return;
        workerRef.current.onmessage = handleTick;

        if (timer.active) {
            workerRef.current.postMessage('start');
        } else {
            workerRef.current.postMessage('stop');
            document.title = "IronLog Pro";
        }
    }, [timer.active, handleTick]);

    return { restTimer: timer, setRestTimer: setTimer };
};
