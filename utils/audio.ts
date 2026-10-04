import { Capacitor, registerPlugin } from '@capacitor/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface NativeBridgePlugin {
    haptic(options: { type: HapticType }): Promise<void>;
    scheduleRestTimer(options: { endAt: number; title: string; body: string; liveTitle?: string; liveBody?: string }): Promise<void>;
    cancelRestTimer(): Promise<void>;
    canScheduleExactAlarms(): Promise<{ granted: boolean; sdkInt: number }>;
    openExactAlarmSettings(): Promise<void>;
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
export const scheduleNativeRestTimer = (endAt: number, title: string, body: string, liveTitle?: string, liveBody?: string) => {
    if (!Capacitor.isNativePlatform()) return;
    const options: { endAt: number; title: string; body: string; liveTitle?: string; liveBody?: string } = { endAt, title, body };
    if (liveTitle !== undefined) options.liveTitle = liveTitle;
    if (liveBody !== undefined) options.liveBody = liveBody;
    void NativeBridge.scheduleRestTimer(options).catch((error) => {
        console.warn('Native rest timer schedule failed', error);
    });
};

export const cancelNativeRestTimer = () => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeBridge.cancelRestTimer().catch((error) => {
        console.warn('Native rest timer cancel failed', error);
    });
};

export interface ExactAlarmState {
    granted: boolean;
    sdkInt: number;
}

/**
 * Q8: exact-alarm state on native Android (null everywhere else, including
 * web/PWA and non-Android shells). Never throws: callers treat null as
 * "hide the row / skip the notice".
 */
export const getExactAlarmState = async (): Promise<ExactAlarmState | null> => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
    try {
        const state = await NativeBridge.canScheduleExactAlarms();
        if (typeof state?.granted !== 'boolean' || typeof state?.sdkInt !== 'number') return null;
        return { granted: state.granted, sdkInt: state.sdkInt };
    } catch {
        return null;
    }
};

/** Q8: opens the system "Alarms & reminders" screen (native Android only). */
export const openExactAlarmSettings = () => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeBridge.openExactAlarmSettings().catch((error) => {
        console.warn('Open exact-alarm settings failed', error);
    });
};

/**
 * Q8: pure notice rule for the one-time prompt after the first rest: native
 * Android on API 31+ where exact alarms are not granted and the notice was
 * never shown.
 */
export const shouldShowExactAlarmNotice = (input: {
    platform: string;
    isNative: boolean;
    sdkInt: number;
    granted: boolean;
    alreadyNoticed: boolean;
}): boolean =>
    input.isNative
    && input.platform === 'android'
    && input.sdkInt >= 31
    && !input.granted
    && !input.alreadyNoticed;
