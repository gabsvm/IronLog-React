import { Capacitor, registerPlugin } from '@capacitor/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface NativeBridgePlugin {
    haptic(options: { type: HapticType }): Promise<void>;
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

// Haptic Feedback Utility
// Installed Android builds use a tiny local Capacitor plugin backed by the
// platform Vibrator API. Browser/PWA builds keep navigator.vibrate as fallback.
export const triggerHaptic = (type: HapticType = 'light') => {
    if (Capacitor.isNativePlatform()) {
        void NativeBridge.haptic({ type }).catch(() => webHaptic(type));
        return;
    }

    webHaptic(type);
};
