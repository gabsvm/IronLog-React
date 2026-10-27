import { Capacitor, registerPlugin } from '@capacitor/core';
import { useContext } from 'react';
import { AppContext } from '../context/app/appContexts';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface NativeBridgePlugin {
    pauseRestTimer(options: { remaining: number; endAt?: number }): Promise<{ paused: boolean; remaining: number }>;
    haptic(options: { type: HapticType }): Promise<void>;
    scheduleRestTimer(options: { endAt: number; title: string; body: string; liveTitle?: string; liveBody?: string; skipLabel?: string; duration: number; sourceExerciseInstanceId: number; sourceSetId: number; soundEnabled?: boolean; vibrateEnabled?: boolean }): Promise<void>;
    getRestTimerState(): Promise<NativeRestTimerSnapshot>;
    updateRestTimerContent(options: { endAt: number; liveTitle: string; liveBody: string; skipLabel?: string }): Promise<void>;
    cancelRestTimer(): Promise<void>;
    canScheduleExactAlarms(): Promise<{ granted: boolean; sdkInt: number }>;
    openExactAlarmSettings(): Promise<void>;
    consumePendingTimerCommands(): Promise<{ epoch: number; commands: TimerCommandPayload[] }>;
    getLaunchAction(): Promise<{ action: string }>;
    consumeSharedFile(): Promise<{ available: boolean; name?: string; text?: string; error?: string }>;
    shareFile(options: { filename: string; mime: string; base64: string; title?: string }): Promise<{ shared: boolean }>;
    updateWidgetData(options: { title: string }): Promise<void>;
    addListener(event: 'restTimerCommand', cb: (data: unknown) => void): Promise<{ remove: () => Promise<void> }>;
}

export interface NativeRestTimerSnapshot {
    active: boolean;
    endAt: number;
    duration: number;
    epoch: number;
    sourceExerciseInstanceId: number;
    sourceSetId: number;
    /** True when the OS holds a frozen rest (alarm cancelled, no countdown). */
    paused?: boolean;
    /** Whole seconds left, meaningful only when paused is true. */
    remaining?: number;
}

export interface TimerCommandPayload {
    id: number;
    action: 'add30' | 'skip';
    endAt: number;
}

const NativeBridge = registerPlugin<NativeBridgePlugin>('NativeBridge');

// One shared context: creating (and never closing) a context per beep leaks
// audio resources over long sessions; resume covers the suspended state that
// autoplay policies impose before the first user gesture.
let sharedAudioCtx: AudioContext | null = null;
const getAudioCtor = (): typeof AudioContext | undefined => {
    if (typeof window === 'undefined') return undefined;
    if (window.AudioContext) return window.AudioContext;
    const w: unknown = window;
    if (typeof w === 'object' && w !== null && 'webkitAudioContext' in w && typeof w.webkitAudioContext === 'function') {
        // Legacy WebKit prefix exposes the same constructor; lib type omits it.
        const LegacyAC = w.webkitAudioContext as unknown as typeof AudioContext;
        return LegacyAC;
    }
    return undefined;
};
const getAudioCtx = (): AudioContext | null => {
    try {
        const AC = getAudioCtor();
        if (!AC) return null;
        if (!sharedAudioCtx) sharedAudioCtx = new AC();
        if (sharedAudioCtx.state === 'suspended') void sharedAudioCtx.resume();
        return sharedAudioCtx;
    } catch {
        return null;
    }
};

import type { RestSoundName } from '../types';

export type { RestSoundName };

const playTone = (ctx: AudioContext, freq: number, at: number, dur: number, peak = 0.4, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + at);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.05);
};

// Simple oscillator sounds to avoid loading external assets
// (Strong offers Boxing bell / Chime / Tri tone / Short bell).
export const playTimerFinishSound = (name: RestSoundName = 'boxingBell') => {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (name === 'chime') {
            playTone(ctx, 880, 0, 0.5);
            playTone(ctx, 1318.5, 0.18, 0.6);
        } else if (name === 'triTone') {
            playTone(ctx, 660, 0, 0.25);
            playTone(ctx, 880, 0.2, 0.25);
            playTone(ctx, 1320, 0.4, 0.5);
        } else if (name === 'shortBell') {
            playTone(ctx, 1567, 0, 0.25, 0.5, 'triangle');
        } else {
            // boxingBell: low thump + bright strike.
            playTone(ctx, 196, 0, 0.3, 0.5, 'triangle');
            playTone(ctx, 880, 0.05, 0.4);
        }
    } catch (err) {
        console.error('Audio play failed', err);
    }
};

/** Back-compat single beep (legacy callers without a sound choice). */
export const playTimerBeep = () => playTimerFinishSound('boxingBell');

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
export const scheduleNativeRestTimer = (
    endAt: number,
    title: string,
    body: string,
    liveTitle?: string,
    liveBody?: string,
    duration = 120,
    source?: { exerciseInstanceId: number; setId?: number },
    skipLabel?: string,
    feedback?: { soundEnabled?: boolean; vibrateEnabled?: boolean },
) => {
    if (!Capacitor.isNativePlatform()) return;
    const options = {
        endAt, title, body, liveTitle, liveBody, skipLabel,
        duration: Math.max(1, Math.round(duration)),
        sourceExerciseInstanceId: source?.exerciseInstanceId ?? -1,
        sourceSetId: source?.setId ?? -1,
        soundEnabled: feedback?.soundEnabled ?? true,
        vibrateEnabled: feedback?.vibrateEnabled ?? true,
    };
    void NativeBridge.scheduleRestTimer(options).catch((error) => {
        console.warn('Native rest timer schedule failed', error);
    });
};

/** Native alarm state is the source of truth after an Android WebView restart.
 * A missing/older native bridge returns null (never overwrite a live JS timer).
 */
export const getNativeRestTimerState = async (): Promise<NativeRestTimerSnapshot | null> => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
    try {
        const state = await NativeBridge.getRestTimerState();
        if (!state || typeof state.active !== 'boolean'
            || !Number.isFinite(state.endAt) || !Number.isFinite(state.duration)
            || !Number.isInteger(state.epoch) || !Number.isInteger(state.sourceExerciseInstanceId)
            || !Number.isInteger(state.sourceSetId)) return null;
        if (state.paused !== undefined && typeof state.paused !== 'boolean') return null;
        if (state.remaining !== undefined && !Number.isFinite(state.remaining)) return null;
        return state;
    } catch {
        return null;
    }
};

/**
 * Freeze the OS rest: cancels the alarm and live countdown but keeps the
 * native snapshot (texts, source, epoch) so resume/background-restore stay
 * coherent. Falls back to a plain cancel on older bridges. endAt serializes
 * against a later resume: a stale pause never clobbers a newer schedule.
 */
export interface PauseRestResult {
    paused: boolean;
    remaining: number;
}
export const pauseNativeRestTimer = (
    remainingSeconds: number,
    endAt?: number,
): Promise<PauseRestResult | null> => {
    if (!Capacitor.isNativePlatform()) return Promise.resolve(null);
    const remaining = Math.max(1, Math.round(Number(remainingSeconds) || 0));
    const bridge = NativeBridge as Partial<NativeBridgePlugin> & Pick<NativeBridgePlugin, 'cancelRestTimer'>;
    if (typeof bridge.pauseRestTimer !== 'function') {
        cancelNativeRestTimer();
        return Promise.resolve(null);
    }
    const options: { remaining: number; endAt?: number } = { remaining };
    if (Number.isFinite(endAt) && (endAt as number) > 0) options.endAt = endAt as number;
    return bridge.pauseRestTimer(options).then((res) => ({
        paused: res?.paused === true,
        remaining: Number.isFinite(res?.remaining) ? Number(res.remaining) : 0,
    })).catch(() => {
        cancelNativeRestTimer();
        return null;
    });
};

/** Update the same Android countdown notification without touching its alarm,
 * countdown epoch or action queue. Native rejects stale deadlines.
 */
export const updateNativeRestTimerContent = (
    endAt: number,
    content: { liveTitle: string; liveBody: string; skipLabel?: string },
): void => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    if (!Number.isFinite(endAt) || endAt <= Date.now()) return;
    void NativeBridge.updateRestTimerContent({
        endAt, liveTitle: content.liveTitle, liveBody: content.liveBody, skipLabel: content.skipLabel,
    }).catch(() => {
        // Old APK without the newer bridge remains fully functional with generic text.
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
export interface TimerCommandStream {
    epoch: number;
    commands: TimerCommandPayload[];
}

const isTimerCommand = (value: unknown): value is TimerCommandPayload => {
    if (typeof value !== 'object' || value === null) return false;
    const cmd = value as Record<string, unknown>;
    return (
        Number.isInteger(cmd.id)
        && (cmd.action === 'add30' || cmd.action === 'skip')
        && typeof cmd.endAt === 'number'
        && Number.isFinite(cmd.endAt)
    );
};

/**
 * Q9: drains the native command stream written by notification actions
 * (native only; [] + epoch -1 everywhere else or on failure).
 */
export const consumePendingTimerCommands = async (): Promise<TimerCommandStream> => {
    const empty: TimerCommandStream = { epoch: -1, commands: [] };
    if (!Capacitor.isNativePlatform()) return empty;
    try {
        const res = await NativeBridge.consumePendingTimerCommands();
        if (!res || !Number.isInteger(res.epoch) || !Array.isArray(res.commands)) return empty;
        return { epoch: res.epoch, commands: res.commands.filter(isTimerCommand) };
    } catch {
        return empty;
    }
};

/**
 * Q9: live command events while the bridge is alive (the drain above is the
 * fallback for frozen JS). No-op off native. Resolves to an unsubscribe fn.
 */
export const subscribeTimerCommands = async (
    cb: (stream: TimerCommandStream) => void,
): Promise<() => void> => {
    if (!Capacitor.isNativePlatform()) return () => {};
    try {
        const handle = await NativeBridge.addListener('restTimerCommand', (raw: unknown) => {
            if (typeof raw !== 'object' || raw === null) return;
            const data = raw as { epoch?: unknown; command?: unknown };
            if (!Number.isInteger(data.epoch) || !isTimerCommand(data.command)) return;
            cb({ epoch: data.epoch as number, commands: [data.command] });
        });
        return () => {
            void handle.remove().catch(() => {});
        };
    } catch {
        return () => {};
    }
};

/**
 * Q17: consume the widget launch action (native only; null everywhere else
 * or on failure). The native side clears the pending action, so each widget
 * tap is delivered exactly once.
 */
export const getNativeLaunchAction = async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const res = await NativeBridge.getLaunchAction();
        return typeof res?.action === 'string' && res.action !== '' ? res.action : null;
    } catch {
        return null;
    }
};

/**
 * T3: a CSV shared to / opened with the native app (consumed once).
 * null when nothing is pending or off-native; 'error' when it could not be read.
 */
export const consumeNativeSharedFile = async (): Promise<{ name: string; text: string } | 'error' | null> => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const res = await NativeBridge.consumeSharedFile();
        if (!res?.available) return null;
        if (typeof res.text !== 'string') return 'error';
        return { name: typeof res.name === 'string' ? res.name : 'shared.csv', text: res.text };
    } catch {
        return null;
    }
};

/**
 * U8: hand a file to the Android share sheet (the WebView cannot download
 * blobs nor share files). Returns false off-native or on failure.
 */
export const nativeShareFile = async (filename: string, mime: string, base64: string, title?: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        const res = await NativeBridge.shareFile({ filename, mime, base64, title });
        return !!res?.shared;
    } catch {
        return false;
    }
};

/** Q17: publish the next-session title to installed widgets (native only). */
export const updateWidgetData = (title: string) => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeBridge.updateWidgetData({ title }).catch((error) => {
        console.warn('Update widget data failed', error);
    });
};

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

/** Reads the configured rest sound without requiring a provider (falls back to default). */
export const useRestSoundName = (): RestSoundName => {
    const ctx = useContext(AppContext);
    const name = ctx?.config?.restSoundName;
    if (name === 'chime' || name === 'triTone' || name === 'shortBell' || name === 'boxingBell') return name;
    return 'boxingBell';
};
