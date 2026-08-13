import { Capacitor, registerPlugin } from '@capacitor/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface NativeBridgePlugin {
    haptic(options: { type: HapticType }): Promise<void>;
    scheduleRestTimer(options: { endAt: number; title: string; body: string }): Promise<void>;
    cancelRestTimer(): Promise<void>;
}

const NativeBridge = registerPlugin<NativeBridgePlugin>('NativeBridge');

// Simple oscillator beep to avoid loading external assets
export const playTimerFinishSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error('Audio play failed', e);
    }
};

const webHaptic = (type: HapticType) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    switch (type) {
        case 'light':
            navigator.vibrate(10);
            break;
        case 'medium':
            navigator.vibrate(40);
            break;
        case 'heavy':
            navigator.vibrate(70);
            break;
        case 'success':
            navigator.vibrate([50, 50, 50]);
            break;
        case 'warning':
            navigator.vibrate([100, 50, 100]);
            break;
    }
};

// Installed Android builds use the local Capacitor bridge backed by Android's
// Vibrator API. Browser/PWA builds keep navigator.vibrate as a fallback.
export const triggerHaptic = (type: HapticType = 'light') => {
    if (Capacitor.isNativePlatform()) {
        void NativeBridge.haptic({ type }).catch(() => webHaptic(type));
        return;
    }

    webHaptic(type);
};

/**
 * Schedule the rest timer at the Android OS layer. AlarmManager remains useful
 * when the WebView is throttled, the app is backgrounded, or the screen locks.
 */
export const scheduleNativeRestTimer = (endAt: number, title: string, body: string) => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeBridge.scheduleRestTimer({ endAt, title, body }).catch((error) => {
        console.warn('Native rest timer schedule failed', error);
    });
};

export const cancelNativeRestTimer = () => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeBridge.cancelRestTimer().catch((error) => {
        console.warn('Native rest timer cancel failed', error);
    });
};
