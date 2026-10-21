import { Capacitor, registerPlugin } from '@capacitor/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

interface NativeBridgePlugin {
    haptic(options: { type: HapticType }): Promise<void>;
    scheduleRestTimer(options: { endAt: number; title: string; body: string; liveTitle?: string; liveBody?: string; skipLabel?: string; duration: number; sourceExerciseInstanceId: number; sourceSetId: number }): Promise<void>;
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

// Simple oscillator beep to avoid loading external assets
export const playTimerFinishSound = () => {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
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
export const scheduleNativeRestTimer = (
    endAt: number,
    title: string,
    body: string,
    liveTitle?: string,
    liveBody?: string,
    duration = 120,
    source?: { exerciseInstanceId: number; setId: number },
    skipLabel?: string,
) => {
    if (!Capacitor.isNativePlatform()) return;
    const options = {
        endAt, title, body, liveTitle, liveBody, skipLabel,
        duration: Math.max(1, Math.round(duration)),
        sourceExerciseInstanceId: source?.exerciseInstanceId ?? -1,
        sourceSetId: source?.setId ?? -1,
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
        return state;
    } catch {
        return null;
    }
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
